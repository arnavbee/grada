from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, utcnow


class MarketplaceExport(Base):
    __tablename__ = 'marketplace_exports'

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey('companies.id', ondelete='CASCADE'), index=True)
    requested_by_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    marketplace: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    template_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    template_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    export_format: Mapped[str] = mapped_column(String(16), default='csv', nullable=False)
    status: Mapped[str] = mapped_column(String(32), default='queued', index=True, nullable=False)
    filters_json: Mapped[str] = mapped_column(Text, default='{}', nullable=False)
    file_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(512), nullable=True)
    row_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    completed_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
