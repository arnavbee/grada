"""Add received PO exception inbox fields.

Revision ID: 20260402_0006
Revises: 20260331_0005
Create Date: 2026-04-02 10:30:00
"""

from __future__ import annotations

from collections.abc import Iterable

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = '20260402_0006'
down_revision = '20260331_0005'
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
    _add_column_if_missing('received_pos', sa.Column('auto_resolve_rate', sa.Numeric(5, 2), nullable=True))
    _add_column_if_missing(
        'received_pos',
        sa.Column('exception_count', sa.Integer(), nullable=False, server_default='0'),
    )
    _add_column_if_missing(
        'received_pos',
        sa.Column('review_required_count', sa.Integer(), nullable=False, server_default='0'),
    )

    _add_column_if_missing('received_po_line_items', sa.Column('confidence_score', sa.Numeric(5, 2), nullable=True))
    _add_column_if_missing(
        'received_po_line_items',
        sa.Column('resolution_status', sa.String(length=32), nullable=False, server_default='needs_review'),
    )
    _add_column_if_missing('received_po_line_items', sa.Column('exception_reason', sa.String(length=255), nullable=True))
    _add_column_if_missing(
        'received_po_line_items',
        sa.Column('suggested_fix_json', sa.Text(), nullable=False, server_default='{}'),
    )
    _create_index_if_missing(
        'ix_received_po_line_items_resolution_status',
        'received_po_line_items',
        ['resolution_status'],
    )


def downgrade() -> None:
    pass
