import uuid

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, utcnow


class PackingList(Base):
    __tablename__ = 'packing_lists'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    received_po_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey('received_pos.id', ondelete='CASCADE'),
        index=True,
    )
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey('companies.id', ondelete='CASCADE'), index=True)
    # Invoice linkage — packing list is downstream of an invoice snapshot
    invoice_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey('invoices.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )
    invoice_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    invoice_date: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default='draft', index=True, nullable=False)
    file_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    cartons: Mapped[list['PackingListCarton']] = relationship(
        'PackingListCarton',
        back_populates='packing_list',
        cascade='all, delete-orphan',
    )


class PackingListCarton(Base):
    __tablename__ = 'packing_list_cartons'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    packing_list_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey('packing_lists.id', ondelete='CASCADE'),
        index=True,
    )
    carton_number: Mapped[int] = mapped_column(Integer, nullable=False)
    gross_weight: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    net_weight: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    dimensions: Mapped[str | None] = mapped_column(String(128), nullable=True)
    total_pieces: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    packing_list: Mapped['PackingList'] = relationship('PackingList', back_populates='cartons')
    items: Mapped[list['PackingListCartonItem']] = relationship(
        'PackingListCartonItem',
        back_populates='carton',
        cascade='all, delete-orphan',
    )


class PackingListCartonItem(Base):
    __tablename__ = 'packing_list_carton_items'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    carton_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey('packing_list_cartons.id', ondelete='CASCADE'),
        index=True,
    )
    line_item_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey('received_po_line_items.id', ondelete='CASCADE'),
        index=True,
    )
    pieces_in_carton: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    carton: Mapped['PackingListCarton'] = relationship('PackingListCarton', back_populates='items')
