import uuid

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, utcnow


class PORequestColorway(Base):
    __tablename__ = 'po_request_colorways'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    po_request_item_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey('po_request_items.id', ondelete='CASCADE'),
        index=True,
    )
    letter: Mapped[str] = mapped_column(String(2), nullable=False)
    color_name: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    item: Mapped['PORequestItem'] = relationship('PORequestItem', back_populates='colorways')


class PORequestRow(Base):
    __tablename__ = 'po_request_rows'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    po_request_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey('po_requests.id', ondelete='CASCADE'),
        index=True,
    )
    po_request_item_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey('po_request_items.id', ondelete='CASCADE'),
        index=True,
    )
    product_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey('products.id', ondelete='CASCADE'),
        index=True,
    )
    row_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sku_id: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    brand_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    category_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    styli_sku_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    color: Mapped[str | None] = mapped_column(String(64), nullable=True)
    size: Mapped[str | None] = mapped_column(String(16), nullable=True)
    colorway_letter: Mapped[str | None] = mapped_column(String(2), nullable=True)
    l1: Mapped[str] = mapped_column(String(20), default='Women', nullable=False)
    fibre_composition: Mapped[str | None] = mapped_column(String(128), nullable=True)
    coo: Mapped[str] = mapped_column(String(64), default='India', nullable=False)
    po_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    osp_in_sar: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    po_qty: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    knitted_woven: Mapped[str | None] = mapped_column(String(16), nullable=True)
    product_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    dress_print: Mapped[str | None] = mapped_column(String(64), nullable=True)
    dress_length: Mapped[str | None] = mapped_column(String(64), nullable=True)
    dress_shape: Mapped[str | None] = mapped_column(String(64), nullable=True)
    sleeve_length: Mapped[str | None] = mapped_column(String(64), nullable=True)
    neck_women: Mapped[str | None] = mapped_column(String(64), nullable=True)
    sleeve_styling: Mapped[str | None] = mapped_column(String(64), nullable=True)
    other_attributes_json: Mapped[str] = mapped_column(Text, default='{}', nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    po_request: Mapped['PORequest'] = relationship('PORequest', back_populates='rows')
    item: Mapped['PORequestItem'] = relationship('PORequestItem', back_populates='rows')
