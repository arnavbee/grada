import uuid
from typing import List

from sqlalchemy import JSON, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, utcnow


class PORequest(Base):
    __tablename__ = 'po_requests'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey('companies.id', ondelete='CASCADE'), index=True)
    status: Mapped[str] = mapped_column(String(32), default='draft', index=True, nullable=False)
    created_by_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    items: Mapped[List["PORequestItem"]] = relationship("PORequestItem", back_populates="po_request", cascade="all, delete-orphan")


class PORequestItem(Base):
    __tablename__ = 'po_request_items'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    po_request_id: Mapped[str] = mapped_column(String(36), ForeignKey('po_requests.id', ondelete='CASCADE'), index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey('products.id', ondelete='CASCADE'), index=True)
    
    po_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    osp_inside_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    fabric_composition: Mapped[str | None] = mapped_column(String(128), nullable=True)
    
    size_ratio: Mapped[dict] = mapped_column(JSON, default={}, nullable=False)
    extracted_attributes: Mapped[dict] = mapped_column(JSON, default={}, nullable=False)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    po_request: Mapped["PORequest"] = relationship("PORequest", back_populates="items")
