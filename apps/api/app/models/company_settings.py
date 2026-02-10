from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, utcnow


class CompanySettings(Base):
    __tablename__ = 'company_settings'

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey('companies.id', ondelete='CASCADE'), unique=True)

    sku_format: Mapped[str] = mapped_column(String(128), default='{BRAND}-{CATEGORY}-{COLOR}-{SIZE}', nullable=False)
    default_margin_percent: Mapped[float] = mapped_column(Numeric(10, 2), default=25.0, nullable=False)
    invoice_prefix: Mapped[str] = mapped_column(String(24), default='INV', nullable=False)
    invoice_next_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    email_notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    settings_json: Mapped[str] = mapped_column(Text, default='{}', nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
