"""Add marketplace document templates and export template linkage.

Revision ID: 20260331_0003
Revises: 20260330_0002
Create Date: 2026-03-31 13:30:00
"""

from __future__ import annotations

from collections.abc import Iterable

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = '20260331_0003'
down_revision = '20260330_0002'
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
    if 'marketplace_document_templates' not in _table_names():
        op.create_table(
            'marketplace_document_templates',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('company_id', sa.String(length=36), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('marketplace_key', sa.String(length=64), nullable=False),
            sa.Column('document_type', sa.String(length=32), nullable=False, server_default='catalog'),
            sa.Column('template_kind', sa.String(length=32), nullable=False, server_default='tabular'),
            sa.Column('file_format', sa.String(length=16), nullable=False, server_default='csv'),
            sa.Column('sample_file_url', sa.String(length=512), nullable=True),
            sa.Column('sheet_name', sa.String(length=128), nullable=True),
            sa.Column('header_row_index', sa.Integer(), nullable=False, server_default='1'),
            sa.Column('schema_json', sa.Text(), nullable=False, server_default='{}'),
            sa.Column('layout_json', sa.Text(), nullable=False, server_default='{}'),
            sa.Column('is_default', sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('company_id', 'name', name='uq_marketplace_document_templates_company_name'),
        )
    _create_index_if_missing(
        'ix_marketplace_document_templates_company_id',
        'marketplace_document_templates',
        ['company_id'],
    )
    _create_index_if_missing(
        'ix_marketplace_document_templates_marketplace_key',
        'marketplace_document_templates',
        ['marketplace_key'],
    )

    _add_column_if_missing('marketplace_exports', sa.Column('template_id', sa.String(length=36), nullable=True))
    _add_column_if_missing('marketplace_exports', sa.Column('template_name', sa.String(length=255), nullable=True))
    _create_index_if_missing('ix_marketplace_exports_template_id', 'marketplace_exports', ['template_id'])


def downgrade() -> None:
    pass
