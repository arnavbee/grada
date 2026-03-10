from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, utcnow


class CatalogTemplate(Base):
    __tablename__ = 'catalog_templates'
    __table_args__ = (UniqueConstraint('company_id', 'name', name='uq_catalog_templates_company_name'),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey('companies.id', ondelete='CASCADE'), index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    defaults_json: Mapped[str] = mapped_column(Text, default='{}', nullable=False)
    allowed_colors_json: Mapped[str] = mapped_column(Text, default='[]', nullable=False)
    allowed_fabrics_json: Mapped[str] = mapped_column(Text, default='[]', nullable=False)
    style_code_pattern: Mapped[str | None] = mapped_column(String(128), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_by_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )
