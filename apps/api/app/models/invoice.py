import uuid

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

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
    gross_weight: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    igst_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=5, nullable=False)
    igst_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default='draft', index=True, nullable=False)
    file_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
