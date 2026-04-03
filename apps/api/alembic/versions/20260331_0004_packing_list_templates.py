"""Add packing list template linkage.

Revision ID: 20260331_0004
Revises: 20260331_0003
Create Date: 2026-03-31 16:00:00
"""

from __future__ import annotations

from collections.abc import Iterable

import sqlalchemy as sa
from sqlalchemy import inspect

from alembic import op

revision = '20260331_0004'
down_revision = '20260331_0003'
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
    _add_column_if_missing('packing_lists', sa.Column('template_id', sa.String(length=36), nullable=True))
    _add_column_if_missing('packing_lists', sa.Column('template_name', sa.String(length=255), nullable=True))
    _add_column_if_missing(
        'packing_lists',
        sa.Column('layout_key', sa.String(length=64), nullable=False, server_default='default_v1'),
    )
    _add_column_if_missing('packing_lists', sa.Column('template_snapshot_json', sa.Text(), nullable=True))
    _create_index_if_missing('ix_packing_lists_template_id', 'packing_lists', ['template_id'])


def downgrade() -> None:
    pass
