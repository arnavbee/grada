import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, utcnow


class MarketplaceDocumentTemplate(Base):
    __tablename__ = 'marketplace_document_templates'
    __table_args__ = (UniqueConstraint('company_id', 'name', name='uq_marketplace_document_templates_company_name'),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey('companies.id', ondelete='CASCADE'), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    marketplace_key: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    document_type: Mapped[str] = mapped_column(String(32), default='catalog', nullable=False)
    template_kind: Mapped[str] = mapped_column(String(32), default='tabular', nullable=False)
    file_format: Mapped[str] = mapped_column(String(16), default='csv', nullable=False)
    sample_file_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    sheet_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    header_row_index: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    schema_json: Mapped[str] = mapped_column(Text, default='{}', nullable=False)
    layout_json: Mapped[str] = mapped_column(Text, default='{}', nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )
