from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, utcnow


class ProductMeasurement(Base):
    __tablename__ = 'product_measurements'

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey('companies.id', ondelete='CASCADE'), index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey('products.id', ondelete='CASCADE'), index=True)
    measurement_key: Mapped[str] = mapped_column(String(64), nullable=False)
    measurement_value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String(16), default='cm', nullable=False)
    source: Mapped[str] = mapped_column(String(32), default='manual', nullable=False)
    confidence_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    needs_review: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
