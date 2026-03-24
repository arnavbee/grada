import uuid

from sqlalchemy import DateTime, ForeignKey, Integer, String
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
    file_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    total_stickers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
