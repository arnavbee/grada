"""Add buyer document templates and invoice template snapshot fields.

Revision ID: 20260330_0002
Revises: 20260325_0001
Create Date: 2026-03-30 17:45:00
"""

from __future__ import annotations

from collections.abc import Iterable

import sqlalchemy as sa
from sqlalchemy import inspect

from alembic import op

revision = '20260330_0002'
down_revision = '20260325_0001'
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
    if 'buyer_document_templates' not in _table_names():
        op.create_table(
            'buyer_document_templates',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('company_id', sa.String(length=36), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('buyer_key', sa.String(length=255), nullable=False),
            sa.Column('document_type', sa.String(length=32), nullable=False, server_default='invoice'),
            sa.Column('layout_key', sa.String(length=64), nullable=False, server_default='default_v1'),
            sa.Column('defaults_json', sa.Text(), nullable=False, server_default='{}'),
            sa.Column('is_default', sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
    _create_index_if_missing('ix_buyer_document_templates_company_id', 'buyer_document_templates', ['company_id'])
    _create_index_if_missing('ix_buyer_document_templates_buyer_key', 'buyer_document_templates', ['buyer_key'])

    _add_column_if_missing('invoices', sa.Column('buyer_template_id', sa.String(length=36), nullable=True))
    _add_column_if_missing('invoices', sa.Column('buyer_template_name', sa.String(length=255), nullable=True))
    _add_column_if_missing(
        'invoices',
        sa.Column('layout_key', sa.String(length=64), nullable=False, server_default='default_v1'),
    )
    _add_column_if_missing(
        'invoices',
        sa.Column('template_snapshot_json', sa.Text(), nullable=False, server_default='{}'),
    )
    _create_index_if_missing('ix_invoices_buyer_template_id', 'invoices', ['buyer_template_id'])


def downgrade() -> None:
    pass
