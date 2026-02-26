import json
import re
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from urllib.request import urlopen
from uuid import uuid4

from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.base import utcnow
from app.db.session import SessionLocal
from app.models.ai_correction import AICorrection
from app.models.processing_job import ProcessingJob
from app.models.product_image import ProductImage
from app.models.product_measurement import ProductMeasurement

settings = get_settings()

TECHPACK_SOURCE = 'techpack_ocr'
MEASUREMENT_ALIASES: dict[str, tuple[str, ...]] = {
    'chest': ('chest', 'bust'),
    'waist': ('waist',),
    'hip': ('hip', 'hips'),
    'length': ('length', 'total length'),
    'shoulder': ('shoulder', 'across shoulder'),
    'sleeve': ('sleeve', 'sleeve length'),
}
MEASUREMENT_RANGES_CM: dict[str, tuple[float, float]] = {
    'chest': (60.0, 160.0),
    'waist': (50.0, 150.0),
    'hip': (60.0, 170.0),
    'length': (40.0, 200.0),
    'shoulder': (20.0, 80.0),
    'sleeve': (10.0, 90.0),
}
REQUIRED_TECHPACK_KEYS = ('chest', 'waist', 'length')

class AIService:
    def __init__(self):
        base_url = None
        if settings.OPENAI_API_KEY.startswith("sk-or-v1"):
            base_url = "https://openrouter.ai/api/v1"
            
        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=base_url
        )

    def analyze_image(self, image_url: str) -> dict[str, Any]:
        """
        Analyze a product image to extract structured data using GPT-4o.
        Returns a dictionary with keys: category, style_name, color, fabric, composition, woven_knits
        and optionally a confidence_score for each.
        """
        prompt = """
        Analyze this fashion product image and extract the following structured data in JSON format:
        - category: The specific category ('DRESSES' or 'CORD SETS').
        - style_name: The style name (e.g., 'Maxi Dress', 'Midi Dress', 'Knee Length', 'Knot Cord Set').
        - color: The dominant color (e.g., 'Beige', 'Black', 'Blue', 'Bottle Green', 'Brown', 'Green', 'Grey', 'Lilac', 'Maroon', 'Mustard', 'Navy', 'Pink', 'Purple', 'Silver', 'White', 'Wine').
        - fabric: The fabric type (e.g., 'Cotton Poplin', 'Pleated Knitted Fabric', 'Poly Georgette', 'Poly Weightless Ggt', 'Polymoss', 'polycrepe').
        - composition: The composition ('100% Cotton' or '100% Polyester').
        - woven_knits: Whether it is 'Knits' or 'Woven'.
        
        For each field, provide a prediction and a confidence score between 0 and 100.
        Format the JSON strictly as:
        {
            "category": {"value": "...", "confidence": 95},
            "style_name": {"value": "...", "confidence": 80},
            "color": {"value": "...", "confidence": 90},
            "fabric": {"value": "...", "confidence": 60},
            "composition": {"value": "...", "confidence": 75},
            "woven_knits": {"value": "...", "confidence": 85}
        }
        
        Return ONLY valid JSON.
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": image_url,
                                    "detail": "high"
                                },
                            },
                        ],
                    }
                ],
                max_tokens=500,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            if not content:
                return {}
            
            return json.loads(content)
        except Exception as e:
            print(f"AI Analysis Error: {e}")
            return {"error": str(e)}

ai_service = AIService()


def _parse_payload(raw_payload: str | None) -> dict[str, Any]:
    if not raw_payload:
        return {}
    try:
        parsed = json.loads(raw_payload)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _read_techpack_bytes(input_ref: str | None) -> bytes:
    if not input_ref:
        return b''

    parsed = urlparse(input_ref)
    if parsed.scheme in {'http', 'https'}:
        with urlopen(input_ref, timeout=10) as response:
            return response.read()

    path_part = parsed.path if parsed.path else input_ref
    if path_part.startswith('/static/'):
        local_path = Path(path_part.lstrip('/'))
    elif path_part.startswith('static/'):
        local_path = Path(path_part)
    else:
        return b''

    if not local_path.exists():
        return b''
    return local_path.read_bytes()


def _extract_text_from_pdf_bytes(content: bytes) -> str:
    if not content:
        return ''
    decoded = content.decode('latin-1', errors='ignore')
    normalized = re.sub(r'[^A-Za-z0-9\s\.\,\-\:\/()%]', ' ', decoded)
    return re.sub(r'\s+', ' ', normalized).strip()


def _extract_measurements_from_text(text: str) -> list[dict[str, Any]]:
    if not text:
        return []

    extracted: dict[str, dict[str, Any]] = {}
    for key, aliases in MEASUREMENT_ALIASES.items():
        alias_pattern = '|'.join(re.escape(alias) for alias in aliases)
        pattern = re.compile(
            rf'(?i)\b(?:{alias_pattern})\b[^0-9]{{0,25}}(\d{{1,3}}(?:\.\d+)?)\s*(cm|in|inch|inches)?'
        )
        match = pattern.search(text)
        if not match:
            continue
        unit_token = (match.group(2) or 'cm').lower()
        unit = 'in' if unit_token in {'in', 'inch', 'inches'} else 'cm'
        confidence = 88.0 if match.group(2) else 74.0
        extracted[key] = {
            'measurement_key': key,
            'measurement_value': float(match.group(1)),
            'unit': unit,
            'confidence_score': confidence,
        }

    return list(extracted.values())


def _value_to_cm(value: float, unit: str) -> float:
    if unit == 'in':
        return value * 2.54
    return value


def _validate_techpack_measurements(
    measurements: list[dict[str, Any]]
) -> tuple[list[dict[str, Any]], list[str], float | None]:
    flags: list[str] = []
    total_confidence = 0.0
    reviewed_count = 0
    present_keys = {item['measurement_key'] for item in measurements}

    missing_required = [key for key in REQUIRED_TECHPACK_KEYS if key not in present_keys]
    if missing_required:
        flags.append(f"Missing required measurements: {', '.join(missing_required)}")

    validated: list[dict[str, Any]] = []
    for item in measurements:
        key = item['measurement_key']
        value = float(item['measurement_value'])
        unit = item['unit']
        confidence = float(item.get('confidence_score') or 0.0)
        total_confidence += confidence
        reviewed_count += 1

        needs_review = confidence < 80
        notes: list[str] = []
        if confidence < 80:
            notes.append('Low OCR confidence')

        range_bounds = MEASUREMENT_RANGES_CM.get(key)
        if range_bounds:
            value_cm = _value_to_cm(value, unit)
            min_cm, max_cm = range_bounds
            if value_cm < min_cm or value_cm > max_cm:
                needs_review = True
                notes.append(f'Value outside expected range ({min_cm:.0f}-{max_cm:.0f} cm)')
                flags.append(f'{key}: suspicious value {value} {unit}')

        validated.append(
            {
                **item,
                'needs_review': needs_review,
                'notes': '; '.join(notes) if notes else None,
            }
        )

    if not validated:
        flags.append('No measurable fields detected from tech-pack OCR.')

    average_confidence = (total_confidence / reviewed_count) if reviewed_count > 0 else None
    return validated, flags, average_confidence


def process_image_analysis_job(job_id: str):
    """
    Background task to process image analysis.
    Updates Job status and ProductImage analysis_json.
    """
    db = SessionLocal()
    job = None
    try:
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if not job:
            return

        job.status = 'processing'
        job.started_at = utcnow()
        db.commit()

        # Parse payload
        try:
            payload = json.loads(job.payload_json)
        except json.JSONDecodeError:
            payload = {}

        image_id = payload.get('image_id')
        image_data = payload.get('image_data')
        
        if image_id:
            image = db.query(ProductImage).filter(ProductImage.id == image_id).first()
            if image:
                 # Call AI Service
                 # Prefer image_data (base64) if provided, otherwise fallback to URL
                 image_source = image_data if image_data else image.file_url
                 
                 analysis = ai_service.analyze_image(image_source)
                 
                 # Update Image
                 image.analysis_json = json.dumps(analysis, separators=(',', ':'))
                 image.processing_status = 'completed'
                 
                 # Update Job
                 job.result_json = json.dumps(analysis, separators=(',', ':'))
                 job.status = 'completed'
                 job.completed_at = utcnow()
                 job.progress_percent = 100
                 db.commit()
                 return
            else:
                 job.error_message = f"ProductImage {image_id} not found"
        else:
             job.error_message = "Missing image_id in payload"

        # Fallback for failure cases
        job.status = 'failed'
        job.completed_at = utcnow()
        db.commit()

    except Exception as e:
        if job:
            job.status = 'failed'
            job.error_message = str(e)
            job.completed_at = utcnow()
            db.commit()
    finally:
        db.close()


def process_techpack_ocr_job(job_id: str):
    """
    Background task to process tech-pack OCR style extraction.
    This MVP implementation uses text-pattern extraction from uploaded PDF bytes.
    """
    db: Session = SessionLocal()
    job: ProcessingJob | None = None
    try:
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if not job:
            return

        job.status = 'processing'
        job.started_at = utcnow()
        job.progress_percent = 15
        db.commit()

        if not job.product_id:
            job.status = 'failed'
            job.error_message = 'techpack_ocr requires product_id.'
            job.completed_at = utcnow()
            db.commit()
            return

        payload = _parse_payload(job.payload_json)
        techpack_text = payload.get('techpack_text')
        input_ref = payload.get('techpack_url') or job.input_ref

        if isinstance(techpack_text, str) and techpack_text.strip():
            normalized_text = re.sub(r'\s+', ' ', techpack_text).strip()
        else:
            file_bytes = _read_techpack_bytes(input_ref)
            normalized_text = _extract_text_from_pdf_bytes(file_bytes)

        extracted = _extract_measurements_from_text(normalized_text)
        validated, flags, average_confidence = _validate_techpack_measurements(extracted)

        db.query(ProductMeasurement).filter(
            ProductMeasurement.company_id == job.company_id,
            ProductMeasurement.product_id == job.product_id,
            ProductMeasurement.source == TECHPACK_SOURCE,
        ).delete()

        for entry in validated:
            db.add(
                ProductMeasurement(
                    id=str(uuid4()),
                    company_id=job.company_id,
                    product_id=job.product_id,
                    measurement_key=entry['measurement_key'],
                    measurement_value=entry['measurement_value'],
                    unit=entry['unit'],
                    source=TECHPACK_SOURCE,
                    confidence_score=entry.get('confidence_score'),
                    needs_review=bool(entry.get('needs_review')),
                    notes=entry.get('notes'),
                )
            )

        result = {
            'techpack_source': input_ref,
            'measurements': validated,
            'validation_flags': flags,
            'extracted_count': len(validated),
            'ocr_text_preview': normalized_text[:800],
        }
        job.result_json = json.dumps(result, separators=(',', ':'))
        job.confidence_score = average_confidence
        job.status = 'completed'
        job.progress_percent = 100
        job.completed_at = utcnow()
        db.commit()
    except Exception as e:
        if job:
            job.status = 'failed'
            job.error_message = str(e)
            job.completed_at = utcnow()
            db.commit()
    finally:
        db.close()


def process_ai_correction_retraining(correction_id: str):
    """
    Lightweight retraining queue worker for logged AI corrections.
    This MVP marks correction events as processed and stores a short note.
    """
    db: Session = SessionLocal()
    correction: AICorrection | None = None
    try:
        correction = db.query(AICorrection).filter(AICorrection.id == correction_id).first()
        if not correction:
            return

        correction.retraining_status = 'processing'
        db.commit()

        if correction.feedback_type == 'reject':
            correction.retraining_notes = 'Queued negative sample for prompt tuning.'
        else:
            correction.retraining_notes = 'Queued positive sample for confidence calibration.'

        correction.retraining_status = 'completed'
        correction.processed_at = utcnow()
        db.commit()
    except Exception as e:
        if correction:
            correction.retraining_status = 'failed'
            correction.retraining_notes = str(e)[:255]
            correction.processed_at = utcnow()
            db.commit()
    finally:
        db.close()
