"""Replace runtime schema patching with first-class migrations.

Revision ID: 20260325_0001
Revises:
Create Date: 2026-03-25 19:30:00
"""

from __future__ import annotations

from collections.abc import Iterable

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = '20260325_0001'
down_revision = None
branch_labels = None
depends_on = None


def _table_names() -> set[str]:
    bind = op.get_bind()
    return set(inspect(bind).get_table_names())


def _column_names(table_name: str) -> set[str]:
    bind = op.get_bind()
    return {column['name'] for column in inspect(bind).get_columns(table_name)}


def _index_names(table_name: str) -> set[str]:
    bind = op.get_bind()
    return {index['name'] for index in inspect(bind).get_indexes(table_name)}


def _add_column_if_missing(table_name: str, column: sa.Column) -> None:
    if table_name not in _table_names():
        return
    if column.name in _column_names(table_name):
        return
    op.add_column(table_name, column)


def _create_index_if_missing(index_name: str, table_name: str, columns: Iterable[str]) -> None:
    if table_name not in _table_names():
        return
    if index_name in _index_names(table_name):
        return
    op.create_index(index_name, table_name, list(columns), unique=False)


def upgrade() -> None:
    _add_column_if_missing(
        'users',
        sa.Column('signup_source', sa.String(length=64), nullable=False, server_default='self_serve'),
    )
    _add_column_if_missing(
        'users',
        sa.Column(
            'verification_status',
            sa.String(length=32),
            nullable=False,
            server_default='unreviewed',
        ),
    )
    _add_column_if_missing('users', sa.Column('verification_notes', sa.String(length=512), nullable=True))
    _add_column_if_missing('users', sa.Column('verified_by_user_id', sa.String(length=36), nullable=True))
    _add_column_if_missing('users', sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True))
    _add_column_if_missing('users', sa.Column('last_seen_at', sa.DateTime(timezone=True), nullable=True))

    _add_column_if_missing(
        'barcode_jobs',
        sa.Column('template_kind', sa.String(length=16), nullable=False, server_default='styli'),
    )
    _add_column_if_missing('barcode_jobs', sa.Column('template_id', sa.String(length=36), nullable=True))
    _add_column_if_missing(
        'barcode_jobs',
        sa.Column('total_pages', sa.Integer(), nullable=False, server_default='0'),
    )

    _add_column_if_missing(
        'invoices',
        sa.Column('number_of_cartons', sa.Integer(), nullable=False, server_default='0'),
    )
    _add_column_if_missing(
        'invoices',
        sa.Column('export_mode', sa.String(length=32), nullable=False, server_default='Air'),
    )
    _add_column_if_missing(
        'invoices',
        sa.Column('total_quantity', sa.Integer(), nullable=False, server_default='0'),
    )
    _add_column_if_missing('invoices', sa.Column('total_amount_words', sa.String(length=512), nullable=True))
    _add_column_if_missing(
        'invoices',
        sa.Column('details_json', sa.Text(), nullable=False, server_default='{}'),
    )
    updated_at_missing = 'invoices' in _table_names() and 'updated_at' not in _column_names('invoices')
    _add_column_if_missing('invoices', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))
    if updated_at_missing:
        op.execute(sa.text('UPDATE invoices SET updated_at = created_at WHERE updated_at IS NULL'))

    _add_column_if_missing(
        'received_po_line_items',
        sa.Column('knitted_woven', sa.String(length=64), nullable=True),
    )

    _add_column_if_missing(
        'invoice_line_items',
        sa.Column('source_line_item_id', sa.String(length=36), nullable=True),
    )
    _create_index_if_missing(
        'ix_invoice_line_items_source_line_item_id',
        'invoice_line_items',
        ['source_line_item_id'],
    )

    _add_column_if_missing(
        'packing_lists',
        sa.Column('invoice_id', sa.String(length=36), nullable=True),
    )
    _add_column_if_missing(
        'packing_lists',
        sa.Column('invoice_number', sa.String(length=64), nullable=True),
    )
    _add_column_if_missing(
        'packing_lists',
        sa.Column('invoice_date', sa.DateTime(timezone=True), nullable=True),
    )
    _create_index_if_missing('ix_packing_lists_invoice_id', 'packing_lists', ['invoice_id'])


def downgrade() -> None:
    # This migration codifies additive runtime schema changes for local/dev DBs.
    # Downgrade is intentionally left as a no-op to avoid destructive data loss.
    pass
