"""Add barcode marketplace template linkage.

Revision ID: 20260331_0005
Revises: 20260331_0004
Create Date: 2026-03-31 16:40:00
"""

from __future__ import annotations

from collections.abc import Iterable

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = '20260331_0005'
down_revision = '20260331_0004'
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
    _add_column_if_missing('barcode_jobs', sa.Column('marketplace_template_id', sa.String(length=36), nullable=True))
    _add_column_if_missing('barcode_jobs', sa.Column('marketplace_template_name', sa.String(length=255), nullable=True))
    _add_column_if_missing('barcode_jobs', sa.Column('template_snapshot_json', sa.Text(), nullable=True))
    _create_index_if_missing(
        'ix_barcode_jobs_marketplace_template_id',
        'barcode_jobs',
        ['marketplace_template_id'],
    )


def downgrade() -> None:
    pass
