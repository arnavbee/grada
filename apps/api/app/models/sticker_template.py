import uuid

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, utcnow


class StickerTemplate(Base):
    __tablename__ = 'sticker_templates'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey('companies.id', ondelete='CASCADE'), index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    width_mm: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    height_mm: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    border_color: Mapped[str | None] = mapped_column(String(32), nullable=True)
    border_radius_mm: Mapped[float] = mapped_column(Numeric(8, 2), default=2, nullable=False)
    background_color: Mapped[str] = mapped_column(String(32), default='#FFFFFF', nullable=False)
    is_default: Mapped[bool] = mapped_column(default=False, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    elements: Mapped[list['StickerElement']] = relationship(
        'StickerElement',
        back_populates='template',
        cascade='all, delete-orphan',
        order_by=lambda: (StickerElement.z_index.asc(), StickerElement.created_at.asc()),
    )


class StickerElement(Base):
    __tablename__ = 'sticker_elements'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey('sticker_templates.id', ondelete='CASCADE'),
        index=True,
        nullable=False,
    )
    element_type: Mapped[str] = mapped_column(String(32), nullable=False)
    x_mm: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    y_mm: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    width_mm: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    height_mm: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    z_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    properties: Mapped[dict[str, object]] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    template: Mapped['StickerTemplate'] = relationship('StickerTemplate', back_populates='elements')
