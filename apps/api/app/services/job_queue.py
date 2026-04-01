import json
import logging
import threading
from time import sleep
from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.base import utcnow
from app.db.session import SessionLocal
from app.models.processing_job import ProcessingJob

logger = logging.getLogger(__name__)
settings = get_settings()

JOB_TYPE_RECEIVED_PO_PARSE = 'received_po.parse'
JOB_TYPE_RECEIVED_PO_BARCODE_PDF = 'received_po.barcode_pdf'
JOB_TYPE_RECEIVED_PO_INVOICE_PDF = 'received_po.invoice_pdf'
JOB_TYPE_RECEIVED_PO_PACKING_LIST_PDF = 'received_po.packing_list_pdf'

SUPPORTED_JOB_TYPES = {
    JOB_TYPE_RECEIVED_PO_PARSE,
    JOB_TYPE_RECEIVED_PO_BARCODE_PDF,
    JOB_TYPE_RECEIVED_PO_INVOICE_PDF,
    JOB_TYPE_RECEIVED_PO_PACKING_LIST_PDF,
}

_worker_lock = threading.Lock()
_worker_thread: threading.Thread | None = None
_worker_stop_event = threading.Event()


def _json_dumps(payload: dict[str, object]) -> str:
    return json.dumps(payload, separators=(',', ':'))


def enqueue_processing_job(
    db: Session,
    *,
    company_id: str,
    job_type: str,
    payload: dict[str, object],
    created_by_user_id: str | None = None,
    input_ref: str | None = None,
    product_id: str | None = None,
) -> ProcessingJob:
    job = ProcessingJob(
        id=str(uuid4()),
        company_id=company_id,
        product_id=product_id,
        job_type=job_type,
        status='queued',
        input_ref=input_ref,
        payload_json=_json_dumps(payload),
        result_json=_json_dumps({}),
        progress_percent=0,
        created_by_user_id=created_by_user_id,
    )
    db.add(job)
    db.flush()
    logger.info('[Worker] Enqueued job %s (%s)', job.id, job.job_type)
    return job


def _load_payload(raw_payload: str | None) -> dict[str, object]:
    if not raw_payload:
        return {}
    try:
        parsed = json.loads(raw_payload)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _requeue_inflight_jobs() -> None:
    db = SessionLocal()
    try:
        inflight_jobs = (
            db.query(ProcessingJob)
            .filter(ProcessingJob.job_type.in_(SUPPORTED_JOB_TYPES), ProcessingJob.status == 'running')
            .all()
        )
        if not inflight_jobs:
            return

        for job in inflight_jobs:
            job.status = 'queued'
            job.started_at = None
            job.progress_percent = 0
            job.error_message = 'Recovered after worker restart.'
        db.commit()
        logger.info('[Worker] Re-queued %s interrupted jobs.', len(inflight_jobs))
    finally:
        db.close()


def _claim_next_job() -> ProcessingJob | None:
    db = SessionLocal()
    try:
        job = (
            db.query(ProcessingJob)
            .filter(ProcessingJob.job_type.in_(SUPPORTED_JOB_TYPES), ProcessingJob.status == 'queued')
            .order_by(ProcessingJob.created_at.asc())
            .first()
        )
        if job is None:
            return None

        job.status = 'running'
        job.started_at = utcnow()
        job.progress_percent = 5
        job.error_message = None
        db.commit()
        db.refresh(job)
        db.expunge(job)
        return job
    finally:
        db.close()


def _run_job_handler(job: ProcessingJob) -> dict[str, object]:
    payload = _load_payload(job.payload_json)

    if job.job_type == JOB_TYPE_RECEIVED_PO_PARSE:
        from app.services.received_po_parser import process_received_po_parse_job

        process_received_po_parse_job(str(payload.get('received_po_id') or ''))
        return {'received_po_id': payload.get('received_po_id')}

    if job.job_type == JOB_TYPE_RECEIVED_PO_BARCODE_PDF:
        from app.services.received_po_documents import generate_barcode_job_pdf

        generate_barcode_job_pdf(str(payload.get('barcode_job_id') or ''))
        return {'barcode_job_id': payload.get('barcode_job_id')}

    if job.job_type == JOB_TYPE_RECEIVED_PO_INVOICE_PDF:
        from app.services.received_po_documents import generate_invoice_pdf

        generate_invoice_pdf(str(payload.get('invoice_id') or ''))
        return {'invoice_id': payload.get('invoice_id')}

    if job.job_type == JOB_TYPE_RECEIVED_PO_PACKING_LIST_PDF:
        from app.services.received_po_documents import generate_packing_list_pdf

        generate_packing_list_pdf(str(payload.get('packing_list_id') or ''))
        return {'packing_list_id': payload.get('packing_list_id')}

    raise ValueError(f'Unsupported durable job type: {job.job_type}')


def _mark_job_complete(job_id: str, result: dict[str, object]) -> None:
    db = SessionLocal()
    try:
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job is None:
            return
        job.status = 'completed'
        job.progress_percent = 100
        job.completed_at = utcnow()
        job.result_json = _json_dumps(result)
        db.commit()
    finally:
        db.close()


def _mark_job_failed(job_id: str, message: str) -> None:
    db = SessionLocal()
    try:
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job is None:
            return
        job.status = 'failed'
        job.progress_percent = 100
        job.completed_at = utcnow()
        job.error_message = message[:512]
        db.commit()
    finally:
        db.close()


def _worker_loop() -> None:
    _requeue_inflight_jobs()
    poll_interval = max(0.1, settings.job_worker_poll_interval_seconds)
    logger.info('[Worker] Durable job worker started with poll interval=%s', poll_interval)

    while not _worker_stop_event.is_set():
        job = _claim_next_job()
        if job is None:
            sleep(poll_interval)
            continue

        logger.info('[Worker] Running job %s (%s)', job.id, job.job_type)
        try:
            result = _run_job_handler(job)
            _mark_job_complete(job.id, result)
            logger.info('[Worker] Completed job %s (%s)', job.id, job.job_type)
        except Exception as exc:
            logger.exception('[Worker] Job %s failed', job.id)
            _mark_job_failed(job.id, str(exc))

    logger.info('[Worker] Durable job worker stopped')


def start_job_worker() -> None:
    global _worker_thread

    if not settings.job_worker_enabled:
        logger.info('[Worker] Durable job worker disabled by config')
        return

    with _worker_lock:
        if _worker_thread is not None and _worker_thread.is_alive():
            return

        _worker_stop_event.clear()
        _worker_thread = threading.Thread(target=_worker_loop, name='grada-job-worker', daemon=True)
        _worker_thread.start()


def stop_job_worker() -> None:
    global _worker_thread

    with _worker_lock:
        if _worker_thread is None:
            return
        _worker_stop_event.set()
        _worker_thread.join(timeout=2)
        _worker_thread = None


def is_job_worker_running() -> bool:
    with _worker_lock:
        return _worker_thread is not None and _worker_thread.is_alive()
