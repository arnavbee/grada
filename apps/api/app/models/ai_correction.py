from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, utcnow


class AICorrection(Base):
    __tablename__ = 'ai_corrections'

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey('companies.id', ondelete='CASCADE'), index=True)
    product_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey('products.id', ondelete='SET NULL'), index=True, nullable=True
    )
    image_hash: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    field_name: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    feedback_type: Mapped[str] = mapped_column(String(16), index=True, nullable=False)
    suggested_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    corrected_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    reason_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str | None] = mapped_column(String(64), nullable=True)
    based_on: Mapped[str | None] = mapped_column(Text, nullable=True)
    learned_from: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    retraining_status: Mapped[str] = mapped_column(String(32), default='queued', index=True, nullable=False)
    retraining_notes: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_by_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    processed_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
