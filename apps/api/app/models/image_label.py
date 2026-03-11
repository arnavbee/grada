from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, utcnow


class ImageLabel(Base):
    __tablename__ = 'image_labels'

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey('companies.id', ondelete='CASCADE'), index=True)
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    ai_category: Mapped[str | None] = mapped_column(String(128), nullable=True)
    ai_style: Mapped[str | None] = mapped_column(String(255), nullable=True)
    human_category: Mapped[str | None] = mapped_column(String(128), nullable=True)
    human_style: Mapped[str | None] = mapped_column(String(255), nullable=True)
    corrected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)
