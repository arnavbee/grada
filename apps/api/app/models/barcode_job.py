import uuid

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, utcnow


class BarcodeJob(Base):
    __tablename__ = 'barcode_jobs'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    received_po_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey('received_pos.id', ondelete='CASCADE'),
        index=True,
    )
    status: Mapped[str] = mapped_column(String(32), default='pending', index=True, nullable=False)
    template_kind: Mapped[str] = mapped_column(String(16), default='styli', nullable=False)
    template_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    marketplace_template_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    marketplace_template_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    template_snapshot_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    total_stickers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_pages: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
