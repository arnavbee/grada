import uuid

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, utcnow


class Invoice(Base):
    __tablename__ = 'invoices'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    received_po_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey('received_pos.id', ondelete='CASCADE'),
        index=True,
    )
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey('companies.id', ondelete='CASCADE'), index=True)
    invoice_number: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    invoice_date: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    number_of_cartons: Mapped[int] = mapped_column(default=0, nullable=False)
    export_mode: Mapped[str] = mapped_column(String(32), default='Air', nullable=False)
    gross_weight: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    total_quantity: Mapped[int] = mapped_column(default=0, nullable=False)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    igst_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=5, nullable=False)
    igst_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    total_amount_words: Mapped[str | None] = mapped_column(String(512), nullable=True)
    details_json: Mapped[str] = mapped_column(Text, default='{}', nullable=False)
    buyer_template_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    buyer_template_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    layout_key: Mapped[str] = mapped_column(String(64), default='default_v1', nullable=False)
    template_snapshot_json: Mapped[str] = mapped_column(Text, default='{}', nullable=False)
    status: Mapped[str] = mapped_column(String(32), default='draft', index=True, nullable=False)
    file_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    line_items: Mapped[list['InvoiceLineItem']] = relationship(
        'InvoiceLineItem',
        back_populates='invoice',
        cascade='all, delete-orphan',
        order_by='InvoiceLineItem.sort_order',
    )


class InvoiceLineItem(Base):
    __tablename__ = 'invoice_line_items'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id: Mapped[str] = mapped_column(String(36), ForeignKey('invoices.id', ondelete='CASCADE'), index=True)
    source_line_item_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    vendor_style_hash: Mapped[str] = mapped_column(String(160), nullable=False)
    neom_sku_id: Mapped[str] = mapped_column(String(160), nullable=False)
    neom_po_code: Mapped[str] = mapped_column(String(128), nullable=False)
    product_description: Mapped[str] = mapped_column(String(255), nullable=False)
    hsn_code: Mapped[str] = mapped_column(String(32), nullable=False)
    model_number: Mapped[str] = mapped_column(String(128), nullable=False)
    fabric_composition: Mapped[str] = mapped_column(String(255), nullable=False)
    knitted_woven: Mapped[str] = mapped_column(String(64), nullable=False)
    neom_size: Mapped[str] = mapped_column(String(32), nullable=False)
    country_of_origin: Mapped[str] = mapped_column(String(64), default='India', nullable=False)
    state_of_origin: Mapped[str] = mapped_column(String(128), nullable=False)
    district_of_origin: Mapped[str] = mapped_column(String(128), nullable=False)
    quantity: Mapped[int] = mapped_column(default=0, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    net_taxable_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    gst_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=5, nullable=False)
    igst_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    cgst_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    sgst_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    total_gst_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    sort_order: Mapped[int] = mapped_column(default=0, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    invoice: Mapped['Invoice'] = relationship('Invoice', back_populates='line_items')
