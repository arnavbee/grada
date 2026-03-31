import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, utcnow


class BuyerDocumentTemplate(Base):
    __tablename__ = 'buyer_document_templates'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey('companies.id', ondelete='CASCADE'), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    buyer_key: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    document_type: Mapped[str] = mapped_column(String(32), default='invoice', nullable=False)
    layout_key: Mapped[str] = mapped_column(String(64), default='default_v1', nullable=False)
    defaults_json: Mapped[str] = mapped_column(Text, default='{}', nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )
