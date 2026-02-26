'use client';

import { ChangeEvent, DragEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DashboardShell } from '@/src/components/dashboard/dashboard-shell';
import { Button } from '@/src/components/ui/button';
import { apiRequest } from '@/src/lib/api-client';
import { cn } from '@/src/lib/cn';

type CatalogStatus = 'draft' | 'processing' | 'needs_review' | 'ready' | 'archived';
type UploadStatus = 'queued' | 'uploading' | 'completed' | 'completed_local' | 'failed';
type ExportFormat = 'csv' | 'xlsx';
type ExportStatus = 'queued' | 'processing' | 'completed' | 'failed';
type AiFieldKey = 'category' | 'styleName' | 'color' | 'fabric' | 'composition' | 'wovenKnits';
type FeedbackType = 'accept' | 'reject';

const MAX_BULK_FILES_PER_BATCH = 20;
const MAX_BULK_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_ITEM_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const CATEGORY_OPTIONS = ['DRESSES', 'CORD SETS'] as const;
const STYLE_NAME_OPTIONS = ['Maxi Dress', 'Midi Dress', 'Knee Length', 'Knot Cord Set'] as const;
const COLOR_OPTIONS = [
  'Beige',
  'Black',
  'Blue',
  'Bottle Green',
  'Brown',
  'Green',
  'Grey',
  'Lilac',
  'Maroon',
  'Mustard',
  'Navy',
  'Pink',
  'Purple',
  'Silver',
  'White',
  'Wine',
] as const;
const FABRIC_OPTIONS = [
  'Cotton Poplin',
  'Pleated Knitted Fabric',
  'Poly Georgette',
  'Poly Weightless Ggt',
  'Polymoss',
  'polycrepe',
] as const;
const COMPOSITION_OPTIONS = ['100% Cotton', '100% Polyester'] as const;
const WOVEN_KNITS_OPTIONS = ['Knits', 'Woven'] as const;
const TOTAL_UNITS_OPTIONS = ['24', '26'] as const;
const PO_PRICE_OPTIONS = ['550', '575', '600', '625', '650', '675', '700', '750'] as const;
const OSP_OPTIONS = ['90', '95', '100', '120', '125', '130'] as const;
const STATUS_OPTIONS: CatalogStatus[] = ['draft', 'processing', 'needs_review', 'ready', 'archived'];
const MARKETPLACE_OPTIONS = ['Generic', 'Myntra', 'Ajio', 'Amazon IN', 'Flipkart', 'Nykaa'] as const;
const EXPORT_STATUS_OPTIONS: Array<'all' | ExportStatus> = [
  'all',
  'queued',
  'processing',
  'completed',
  'failed',
];
const AI_FIELD_LABELS: Record<AiFieldKey, string> = {
  category: 'Category',
  styleName: 'Style Name',
  color: 'Color',
  fabric: 'Fabric',
  composition: 'Composition',
  wovenKnits: 'Woven Knits',
};
const AI_FIELD_API_KEYS: Record<AiFieldKey, string> = {
  category: 'category',
  styleName: 'style_name',
  color: 'color',
  fabric: 'fabric',
  composition: 'composition',
  wovenKnits: 'woven_knits',
};
const CORRECTION_REASON_OPTIONS = [
  { value: 'image_quality', label: 'Image quality issue' },
  { value: 'lighting', label: 'Lighting/color cast' },
  { value: 'ambiguous_style', label: 'Style ambiguity' },
  { value: 'fabric_texture', label: 'Fabric/texture confusion' },
  { value: 'other', label: 'Other' },
] as const;

interface CatalogProduct {
  id: string;
  sku: string;
  title: string;
  category: string | null;
  color?: string | null;
  primary_image_url?: string | null;
  ai_attributes?: Record<string, unknown>;
  status: CatalogStatus;
}

interface CatalogListResponse {
  items: CatalogProduct[];
}

interface ProductResponse {
  id: string;
  company_id: string;
  sku: string;
  title: string;
  description?: string;
  brand?: string;
  category?: string;
  color?: string;
  size?: string;
  status: string;
  primary_image_url?: string;
  ai_attributes?: Record<string, unknown>;
}

interface CatalogRow {
  id: string;
  primary_image_url?: string;
  styleNo: string;
  name: string;
  category: string;
  color: string;
  fabric: string;
  composition: string;
  wovenKnits: string;
  units: string;
  poPrice: string;
  price: string;
  status: CatalogStatus;
  persisted: boolean;
  imageName?: string;
}

interface UploadItem {
  id: string;
  name: string;
  type: string;
  size: number;
  progress: number;
  status: UploadStatus;
  file?: File;
  error?: string;
  previewUrl?: string;
}

interface ProductImageResponse {
  id: string;
  file_name: string;
  file_url: string;
  processing_status: string;
}

interface MarketplaceExportRecord {
  id: string;
  company_id: string;
  requested_by_user_id?: string | null;
  marketplace: string;
  export_format: ExportFormat;
  status: ExportStatus;
  filters: Record<string, unknown>;
  file_url?: string | null;
  error_message?: string | null;
  row_count: number;
  created_at: string;
  completed_at?: string | null;
}

interface MarketplaceExportListResponse {
  items: MarketplaceExportRecord[];
  total: number;
}

interface AiFieldContext {
  source?: string;
  basedOn?: string;
  learnedFrom?: string;
}

interface AiSuggestionsState {
  values: Partial<Record<AiFieldKey, string>>;
  confidence: Partial<Record<AiFieldKey, number>>;
  context: Partial<Record<AiFieldKey, AiFieldContext>>;
  imageHash?: string;
}

interface AnalyzeImageApiField {
  value?: string;
  confidence?: number;
  source?: string;
  based_on?: string;
  learned_from?: string;
}

interface AnalyzeImageApiResult {
  category?: AnalyzeImageApiField;
  style_name?: AnalyzeImageApiField;
  color?: AnalyzeImageApiField;
  fabric?: AnalyzeImageApiField;
  composition?: AnalyzeImageApiField;
  woven_knits?: AnalyzeImageApiField;
  image_hash?: string;
}

interface LogCorrectionRequest {
  product_id?: string;
  image_hash?: string;
  field_name: string;
  feedback_type: FeedbackType;
  suggested_value?: string;
  corrected_value?: string;
  reason_code?: string;
  notes?: string;
  source?: string;
  based_on?: string;
  learned_from?: string;
  confidence_score?: number;
}

interface LearningFieldAccuracy {
  field_name: string;
  accepted_count: number;
  rejected_count: number;
  total_feedback: number;
  accuracy_percent: number;
}

interface LearningStatsResponse {
  items_processed: number;
  corrections_received: number;
  time_saved_minutes: number;
  pending_retraining: number;
  field_accuracy: LearningFieldAccuracy[];
  insights: string[];
}

const sampleCatalogRows: CatalogRow[] = [
  {
    id: 'sample-1',
    styleNo: 'HRDS25001',
    name: 'Maxi Dress',
    category: 'DRESSES',
    color: 'Blue',
    fabric: 'Poly Georgette',
    composition: '100% Polyester',
    wovenKnits: 'Woven',
    units: '24',
    poPrice: '600',
    price: 'SAR 95',
    status: 'ready',
    persisted: false,
    imageName: 'Maxi Dress',
  },
  {
    id: 'sample-2',
    styleNo: 'HRDS25002',
    name: 'Midi Dress',
    category: 'DRESSES',
    color: 'Maroon',
    fabric: 'Poly Georgette',
    composition: '100% Polyester',
    wovenKnits: 'Woven',
    units: '24',
    poPrice: '600',
    price: 'SAR 95',
    status: 'needs_review',
    persisted: false,
    imageName: 'Midi Dress',
  },
  {
    id: 'sample-3',
    styleNo: 'HRDS25003',
    name: 'Midi Dress',
    category: 'DRESSES',
    color: 'Wine',
    fabric: 'Poly Georgette',
    composition: '100% Polyester',
    wovenKnits: 'Woven',
    units: '24',
    poPrice: '600',
    price: 'SAR 95',
    status: 'processing',
    persisted: false,
    imageName: 'Midi Dress',
  },
  {
    id: 'sample-4',
    styleNo: 'HRDS25004',
    name: 'Midi Dress',
    category: 'DRESSES',
    color: 'Wine',
    fabric: 'Poly Weightless Ggt',
    composition: '100% Polyester',
    wovenKnits: 'Woven',
    units: '24',
    poPrice: '600',
    price: 'SAR 95',
    status: 'draft',
    persisted: false,
    imageName: 'Midi Dress',
  },
  {
    id: 'sample-5',
    styleNo: 'HRDS25005',
    name: 'Maxi Dress',
    category: 'DRESSES',
    color: 'Lilac',
    fabric: 'Poly Georgette',
    composition: '100% Polyester',
    wovenKnits: 'Woven',
    units: '24',
    poPrice: '600',
    price: 'SAR 95',
    status: 'ready',
    persisted: false,
    imageName: 'Maxi Dress',
  },
];

function hasAccessToken(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  return document.cookie.includes('kira_access_token=');
}

function getImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;

  // If it's already an absolute URL (http:// or https://), return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If it's a relative path starting with /static, prepend the API base URL
  if (imageUrl.startsWith('/static')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const baseUrl = apiUrl.replace('/api/v1', '').replace(/\/+$/, '');
    return `${baseUrl}${imageUrl}`;
  }

  // For other relative paths or data URLs, return as-is
  return imageUrl;
}

function normalizeCategory(value: string | null | undefined): (typeof CATEGORY_OPTIONS)[number] {
  const normalized = value?.trim().toUpperCase() ?? '';
  if (normalized === 'DRESSES') return 'DRESSES';
  if (normalized === 'CORD SETS' || normalized === 'CORD-SET' || normalized === 'CORDSETS') return 'CORD SETS';
  if (normalized.includes('CORD')) return 'CORD SETS';
  return 'DRESSES';
}

function formatStatusLabel(status: CatalogStatus): string {
  if (status === 'needs_review') return 'Needs Review';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatExportStatusLabel(status: 'all' | ExportStatus): string {
  if (status === 'all') return 'All';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString();
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function colorDot(color: string): string {
  const token = color.toLowerCase();
  if (token === 'blue') return '#1D4ED8';
  if (token === 'maroon') return '#7F1D1D';
  if (token === 'wine') return '#6B2136';
  if (token === 'lilac') return '#C4A2D3';
  if (token === 'black') return '#18181B';
  if (token === 'white') return '#D4D4D8';
  return '#7A7C88';
}

function parseAiContext(rawField: unknown): AiFieldContext | undefined {
  if (!rawField || typeof rawField !== 'object') return undefined;
  const record = rawField as Record<string, unknown>;
  const source = typeof record.source === 'string' ? record.source : undefined;
  const basedOnRaw = record.based_on ?? record.basedOn;
  const learnedFromRaw = record.learned_from ?? record.learnedFrom;
  const basedOn = typeof basedOnRaw === 'string' ? basedOnRaw : undefined;
  const learnedFrom = typeof learnedFromRaw === 'string' ? learnedFromRaw : undefined;

  if (!source && !basedOn && !learnedFrom) {
    return undefined;
  }
  return { source, basedOn, learnedFrom };
}

function normalizeAiValue(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = value.trim();
  if (!cleaned) return undefined;

  const token = cleaned.toLowerCase();
  if (
    token === 'unknown'
    || token === 'n/a'
    || token === 'na'
    || token === 'none'
    || token === 'null'
    || token.includes('unable to determine')
    || token.includes('cannot determine')
    || token.includes("can't determine")
    || token.includes('not sure')
  ) {
    return undefined;
  }
  return cleaned;
}

function canonicalizeToken(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function pickOptionValue<T extends readonly string[]>(
  rawValue: string | null | undefined,
  options: T,
): T[number] | undefined {
  const normalized = normalizeAiValue(rawValue);
  if (!normalized) return undefined;
  const normalizedToken = canonicalizeToken(normalized);
  const match = options.find((option) => canonicalizeToken(option) === normalizedToken);
  return match as T[number] | undefined;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = () => resolve(fileReader.result as string);
    fileReader.onerror = () => reject(new Error('Could not read image file.'));
  });
}

async function imageUrlToDataUrl(imageUrl: string): Promise<string> {
  const resolvedUrl = getImageUrl(imageUrl) ?? imageUrl;
  if (resolvedUrl.startsWith('data:')) return resolvedUrl;

  const response = await fetch(resolvedUrl);
  if (!response.ok) {
    throw new Error('Failed to load existing image for analysis.');
  }

  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to process existing image for analysis.'));
  });
}

function UploadIcon(): JSX.Element {
  return (
    <svg aria-hidden='true' className='h-4 w-4' fill='none' viewBox='0 0 24 24'>
      <path d='M12 16V4' stroke='currentColor' strokeLinecap='round' strokeWidth='1.8' />
      <path d='M7.5 8.5L12 4L16.5 8.5' stroke='currentColor' strokeLinecap='round' strokeWidth='1.8' />
      <path d='M5 20H19' stroke='currentColor' strokeLinecap='round' strokeWidth='1.8' />
    </svg>
  );
}

function PlusIcon(): JSX.Element {
  return (
    <svg aria-hidden='true' className='h-4 w-4' fill='none' viewBox='0 0 24 24'>
      <path d='M12 5V19' stroke='currentColor' strokeLinecap='round' strokeWidth='1.8' />
      <path d='M5 12H19' stroke='currentColor' strokeLinecap='round' strokeWidth='1.8' />
    </svg>
  );
}

function DownloadIcon(): JSX.Element {
  return (
    <svg aria-hidden='true' className='h-4 w-4' fill='none' viewBox='0 0 24 24'>
      <path d='M12 4V15' stroke='currentColor' strokeLinecap='round' strokeWidth='1.8' />
      <path d='M8 11.5L12 15.5L16 11.5' stroke='currentColor' strokeLinecap='round' strokeWidth='1.8' />
      <path d='M5 20H19' stroke='currentColor' strokeLinecap='round' strokeWidth='1.8' />
    </svg>
  );
}

function PencilIcon(): JSX.Element {
  return (
    <svg aria-hidden='true' className='h-4 w-4' fill='none' viewBox='0 0 24 24'>
      <path d='M4 20L8.5 19L19 8.5L14.5 4L4 14.5L4 20Z' stroke='currentColor' strokeWidth='1.6' />
    </svg>
  );
}

function TrashIcon(): JSX.Element {
  return (
    <svg aria-hidden='true' className='h-4 w-4' fill='none' viewBox='0 0 24 24'>
      <path d='M5 7H19' stroke='currentColor' strokeLinecap='round' strokeWidth='1.6' />
      <path d='M9 7V5H15V7' stroke='currentColor' strokeLinecap='round' strokeWidth='1.6' />
      <path d='M8 7L9 19H15L16 7' stroke='currentColor' strokeLinecap='round' strokeWidth='1.6' />
      <path d='M11 10V16' stroke='currentColor' strokeLinecap='round' strokeWidth='1.6' />
      <path d='M13 10V16' stroke='currentColor' strokeLinecap='round' strokeWidth='1.6' />
    </svg>
  );
}

function CloseIcon(): JSX.Element {
  return (
    <svg aria-hidden='true' className='h-5 w-5' fill='none' viewBox='0 0 24 24'>
      <path d='M6 6L18 18' stroke='currentColor' strokeLinecap='round' strokeWidth='1.8' />
      <path d='M18 6L6 18' stroke='currentColor' strokeLinecap='round' strokeWidth='1.8' />
    </svg>
  );
}

function BrainIcon(): JSX.Element {
  return (
    <svg aria-hidden='true' className='h-4 w-4' fill='none' viewBox='0 0 24 24'>
      <path
        d='M9.2 6.4A2.8 2.8 0 1 0 6.4 9.2V15A2.8 2.8 0 1 0 9.2 17.8H14.8A2.8 2.8 0 1 0 17.6 15V9.2A2.8 2.8 0 1 0 14.8 6.4H9.2Z'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.6'
      />
      <path
        d='M9.2 9.2H14.8M12 9.2V15M9.2 15H14.8'
        stroke='currentColor'
        strokeLinecap='round'
        strokeWidth='1.6'
      />
    </svg>
  );
}

function FieldLabel({
  children,
  confidence,
  context,
}: {
  children: string,
  confidence?: number,
  context?: AiFieldContext,
}): JSX.Element {
  let badgeColor = 'bg-kira-warmgray/30 text-kira-darkgray';
  if (confidence !== undefined) {
    if (confidence >= 85) badgeColor = 'bg-green-100 text-green-800 border-green-200';
    else if (confidence >= 60) badgeColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
    else badgeColor = 'bg-red-100 text-red-800 border-red-200';
  }
  const tooltip = [
    `AI Confidence: ${confidence ?? '--'}%`,
    `Source: ${context?.source ?? 'vision_model'}`,
    `Based on: ${context?.basedOn ?? 'Image texture, silhouette, and color cues'}`,
    `Learned from: ${context?.learnedFrom ?? 'Catalog priors and historical apparel patterns'}`,
  ].join('\n');

  return (
    <div className="flex items-center gap-2">
      <label className='text-sm uppercase tracking-[0.08em] text-kira-midgray'>{children}</label>
      {confidence !== undefined && (
        <span
          title={tooltip}
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border cursor-help",
            badgeColor
          )}
        >
          {confidence}% AI
        </span>
      )}
    </div>
  );
}

function AiSuggestionRow({
  fieldKey,
  label,
  value,
  confidence,
  onFeedback,
  isSubmitting,
  isFeedbackLocked,
}: {
  fieldKey: AiFieldKey,
  label: string,
  value: string | undefined,
  confidence?: number,
  onFeedback: (fieldKey: AiFieldKey, feedbackType: FeedbackType) => void,
  isSubmitting: boolean,
  isFeedbackLocked: boolean,
}): JSX.Element | null {
  if (!value) return null;
  let badgeColor = 'bg-kira-warmgray/30 text-kira-darkgray';
  if (confidence !== undefined) {
    if (confidence >= 85) badgeColor = 'bg-[#E3F6ED] text-[#1E7145]';
    else if (confidence >= 60) badgeColor = 'bg-yellow-100 text-yellow-800';
    else badgeColor = 'bg-red-100 text-red-800';
  }

  return (
    <div className='flex items-center justify-between gap-3 border border-[#DCEADF] bg-white px-3 py-2 text-[13px]'>
      <div className='min-w-0'>
        <p className='text-[11px] uppercase tracking-[0.08em] text-[#6D7772]'>{label}</p>
        <p className='truncate font-medium text-kira-black'>{value}</p>
      </div>
      <div className='flex items-center gap-2'>
        {confidence !== undefined && (
          <span
            className={cn(
              'px-1.5 py-0.5 rounded flex items-center justify-center text-[10px] font-bold tracking-tight min-w-[40px]',
              badgeColor,
            )}
          >
            {confidence}%
          </span>
        )}
        {!isFeedbackLocked ? (
          <div className='inline-flex items-center gap-1 border border-kira-warmgray/45 bg-kira-offwhite p-0.5'>
            <button
              type='button'
              className='inline-flex h-7 w-7 items-center justify-center rounded text-base text-[#1E7145] hover:bg-[#E3F6ED] disabled:opacity-50'
              disabled={isSubmitting}
              onClick={() => onFeedback(fieldKey, 'accept')}
              title='Mark this suggestion as correct'
              aria-label='Mark suggestion as correct'
            >
              <i className='ri-check-line' />
            </button>
            <button
              type='button'
              className='inline-flex h-7 w-7 items-center justify-center rounded text-base text-[#9F3A3A] hover:bg-[#FDECEC] disabled:opacity-50'
              disabled={isSubmitting}
              onClick={() => onFeedback(fieldKey, 'reject')}
              title='Report this suggestion as incorrect'
              aria-label='Mark suggestion as incorrect'
            >
              <i className='ri-close-line' />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CatalogView(): JSX.Element {
  const [catalogRows, setCatalogRows] = useState<CatalogRow[]>([]);
  const [catalogNotice, setCatalogNotice] = useState<string | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);

  const [searchValue, setSearchValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [colorFilter, setColorFilter] = useState('All Colors');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<CatalogStatus | ''>('');
  const [bulkUnitsValue, setBulkUnitsValue] = useState('');
  const [isBulkApplying, setIsBulkApplying] = useState(false);

  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isDropActive, setIsDropActive] = useState(false);
  const [selectedUploadProductId, setSelectedUploadProductId] = useState('');
  const [isUploadProcessing, setIsUploadProcessing] = useState(false);
  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false);
  const [bulkComposition, setBulkComposition] = useState('100% Polyester');
  const [bulkWovenKnits, setBulkWovenKnits] = useState('Woven');
  const [bulkPoPrice, setBulkPoPrice] = useState('600');
  const [bulkOspSar, setBulkOspSar] = useState('95');
  const [exportHistory, setExportHistory] = useState<MarketplaceExportRecord[]>([]);
  const [isExportHistoryLoading, setIsExportHistoryLoading] = useState(false);
  const [isCreatingExport, setIsCreatingExport] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportMarketplace, setExportMarketplace] = useState<string>(MARKETPLACE_OPTIONS[0]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
  const [exportStatusFilter, setExportStatusFilter] = useState<'all' | ExportStatus>('all');
  const [isExportPanelOpen, setIsExportPanelOpen] = useState(false);
  const [isLearningPanelOpen, setIsLearningPanelOpen] = useState(false);
  const [activeExportTab, setActiveExportTab] = useState<'generate' | 'history'>('generate');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [pendingAnalyzeProductId, setPendingAnalyzeProductId] = useState<string | null>(null);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [addItemError, setAddItemError] = useState<string | null>(null);

  const [itemStyleNo, setItemStyleNo] = useState('');
  const [itemCategory, setItemCategory] = useState<string>(CATEGORY_OPTIONS[0]);
  const [itemStyleName, setItemStyleName] = useState<string>(STYLE_NAME_OPTIONS[0]);
  const [itemColor, setItemColor] = useState<string>(COLOR_OPTIONS[1]);
  const [itemFabric, setItemFabric] = useState<string>(FABRIC_OPTIONS[0]);
  const [itemComposition, setItemComposition] = useState<string>(COMPOSITION_OPTIONS[1]);
  const [itemWovenKnits, setItemWovenKnits] = useState<string>(WOVEN_KNITS_OPTIONS[1]);
  const [itemTotalUnits, setItemTotalUnits] = useState<string>(TOTAL_UNITS_OPTIONS[0]);
  const [itemPoPrice, setItemPoPrice] = useState<string>(PO_PRICE_OPTIONS[2]);
  const [itemOspSar, setItemOspSar] = useState<string>(OSP_OPTIONS[1]);
  const [itemImageName, setItemImageName] = useState('');
  const [itemImageError, setItemImageError] = useState<string | null>(null);
  const [isItemDropActive, setIsItemDropActive] = useState(false);
  const [rememberLastValues, setRememberLastValues] = useState<boolean>(false);
  const [fieldConfidence, setFieldConfidence] = useState<Partial<Record<AiFieldKey, number>>>({});
  const [fieldContext, setFieldContext] = useState<Partial<Record<AiFieldKey, AiFieldContext>>>({});

  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestionsState | null>(null);
  const [isAiSuggestionsVisible, setIsAiSuggestionsVisible] = useState(false);
  const [overallConfidence, setOverallConfidence] = useState<number | null>(null);
  const [analysisStage, setAnalysisStage] = useState<string | null>(null);
  const [lastAnalyzedImageHash, setLastAnalyzedImageHash] = useState<string | null>(null);
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [feedbackCompletedFields, setFeedbackCompletedFields] = useState<Partial<Record<AiFieldKey, true>>>({});
  const [learningStats, setLearningStats] = useState<LearningStatsResponse | null>(null);
  const [isLearningStatsLoading, setIsLearningStatsLoading] = useState(false);
  const [learningStatsError, setLearningStatsError] = useState<string | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionFieldKey, setCorrectionFieldKey] = useState<AiFieldKey | null>(null);
  const [correctionReasonCode, setCorrectionReasonCode] = useState<string>(CORRECTION_REASON_OPTIONS[0].value);
  const [correctionNotes, setCorrectionNotes] = useState('');

  // Initialize from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem('kira_remember_last_values');
    if (stored === 'true') {
      setRememberLastValues(true);
    }
  }, []);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queueRef = useRef<UploadItem[]>([]);
  const queueRunningRef = useRef(false);
  const selectedUploadProductIdRef = useRef('');
  const persistedProductsRef = useRef<CatalogRow[]>([]);
  const addItemImageInputRef = useRef<HTMLInputElement | null>(null);
  const selectedImageFileRef = useRef<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadCatalog(): Promise<void> {
      if (!hasAccessToken()) {
        setCatalogNotice('Sign in to load live catalog records. Showing sample data.');
        setCatalogRows(sampleCatalogRows);
        if (mounted) setIsCatalogLoading(false);
        return;
      }

      setIsCatalogLoading(true);
      setCatalogRows([]);
      try {
        const response = await apiRequest<CatalogListResponse>('/catalog/products?limit=50');
        if (!mounted) return;

        if (response.items.length === 0) {
          setCatalogNotice('No catalog records yet. Showing sample data.');
          setCatalogRows(sampleCatalogRows);
          return;
        }

        const mappedRows: CatalogRow[] = response.items.map((item) => {
          const attributes = item.ai_attributes ?? {};
          const attrFabric = typeof attributes.fabric === 'string' ? attributes.fabric : undefined;
          const attrComposition = typeof attributes.composition === 'string' ? attributes.composition : undefined;
          const attrWovenKnitsRaw = typeof attributes.woven_knits === 'string'
            ? attributes.woven_knits
            : (typeof attributes.wovenKnits === 'string' ? attributes.wovenKnits : undefined);
          const attrUnits = attributes.units;
          const attrPoPrice = attributes.po_price ?? attributes.poPrice;
          const attrOsp = attributes.osp ?? attributes.osp_sar ?? attributes.ospSar;

          const mappedColor = pickOptionValue(item.color, COLOR_OPTIONS) ?? 'Blue';
          const mappedFabric = pickOptionValue(attrFabric, FABRIC_OPTIONS) ?? 'Poly Georgette';
          const mappedComposition = pickOptionValue(attrComposition, COMPOSITION_OPTIONS) ?? '100% Polyester';
          const mappedWovenKnits = pickOptionValue(attrWovenKnitsRaw, WOVEN_KNITS_OPTIONS) ?? 'Woven';
          const mappedUnits = typeof attrUnits === 'number'
            ? String(attrUnits)
            : (typeof attrUnits === 'string' && attrUnits.trim() ? attrUnits.trim() : '24');
          const mappedPoPrice = typeof attrPoPrice === 'number'
            ? String(attrPoPrice)
            : (typeof attrPoPrice === 'string' && attrPoPrice.trim() ? attrPoPrice.trim() : '600');
          const mappedPrice = typeof attrOsp === 'number'
            ? `SAR ${attrOsp}`
            : (typeof attrOsp === 'string' && attrOsp.trim() ? attrOsp.trim() : 'SAR 95');

          return {
            id: item.id,
            primary_image_url: getImageUrl(item.primary_image_url) ?? undefined,
            styleNo: item.sku,
            name: item.title,
            category: normalizeCategory(item.category),
            color: mappedColor,
            fabric: mappedFabric,
            composition: mappedComposition,
            wovenKnits: mappedWovenKnits,
            units: mappedUnits,
            poPrice: mappedPoPrice,
            price: mappedPrice,
            status: item.status,
            persisted: true,
          };
        });
        setCatalogRows(mappedRows);
        setCatalogNotice(null);
      } catch (error) {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : 'Catalog could not be loaded.';
        setCatalogNotice(`${message} Showing sample data.`);
        setCatalogRows(sampleCatalogRows);
      } finally {
        if (mounted) setIsCatalogLoading(false);
      }
    }

    void loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  const persistedProducts = useMemo(() => catalogRows.filter((row) => row.persisted), [catalogRows]);

  useEffect(() => {
    persistedProductsRef.current = persistedProducts;
  }, [persistedProducts]);

  useEffect(() => {
    selectedUploadProductIdRef.current = selectedUploadProductId;
  }, [selectedUploadProductId]);

  useEffect(() => {
    if (!selectedUploadProductId && persistedProducts.length > 0) {
      const first = persistedProducts[0];
      if (first) setSelectedUploadProductId(first.id);
    }
  }, [selectedUploadProductId, persistedProducts]);

  const loadExportHistory = useCallback(async (statusOverride: 'all' | ExportStatus): Promise<void> => {
    if (!hasAccessToken()) {
      setExportHistory([]);
      return;
    }

    setIsExportHistoryLoading(true);
    setExportError(null);
    try {
      const queryParams = new URLSearchParams({ limit: '20' });
      if (statusOverride !== 'all') {
        queryParams.set('status', statusOverride);
      }
      const response = await apiRequest<MarketplaceExportListResponse>(`/catalog/exports?${queryParams.toString()}`);
      setExportHistory(response.items);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load export history.';
      setExportError(message);
    } finally {
      setIsExportHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExportHistory(exportStatusFilter);
  }, [exportStatusFilter, loadExportHistory]);

  const loadLearningStats = useCallback(async (): Promise<void> => {
    if (!hasAccessToken()) {
      setLearningStats(null);
      setLearningStatsError(null);
      return;
    }
    setIsLearningStatsLoading(true);
    setLearningStatsError(null);
    try {
      const response = await apiRequest<LearningStatsResponse>('/catalog/learning-stats');
      setLearningStats(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load learning stats.';
      setLearningStatsError(message);
    } finally {
      setIsLearningStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLearningPanelOpen) return;
    void loadLearningStats();
  }, [isLearningPanelOpen, loadLearningStats]);

  async function handleDownloadExport(record: MarketplaceExportRecord): Promise<void> {
    if (!record.file_url) return;

    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const baseUrl = rawApiUrl.replace('/api/v1', '').replace(/\/+$/, '');
    const fileUrl = record.file_url.startsWith('http')
      ? record.file_url
      : `${baseUrl}${record.file_url.startsWith('/') ? '' : '/'}${record.file_url}`;

    try {
      const response = await fetch(fileUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}.`);
      }
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${record.marketplace.toLowerCase().replace(/\s+/g, '-')}-export-${record.id}.${record.export_format}`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to download export.';
      setExportError(message);
    }
  }

  async function handleCreateMarketplaceExport(): Promise<void> {
    if (!hasAccessToken()) {
      setExportError('Sign in to generate marketplace exports.');
      return;
    }

    const exportFilters: Record<string, string> = {};
    if (statusFilter !== 'All Statuses') {
      exportFilters.status = statusFilter;
    }
    if (searchValue.trim()) {
      exportFilters.search = searchValue.trim();
    }

    setIsCreatingExport(true);
    setExportError(null);
    try {
      const created = await apiRequest<MarketplaceExportRecord>('/catalog/exports', {
        method: 'POST',
        body: JSON.stringify({
          marketplace: exportMarketplace,
          export_format: exportFormat,
          filters: exportFilters,
        }),
      });
      setExportHistory((items) => [created, ...items].slice(0, 20));

      if (created.status === 'completed' && created.file_url) {
        await handleDownloadExport(created);
      }
      if (created.status === 'failed') {
        setExportError(created.error_message ?? 'Export validation failed.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create export.';
      setExportError(message);
    } finally {
      setIsCreatingExport(false);
      await loadExportHistory(exportStatusFilter);
    }
  }

  const categoryOptions = useMemo(() => ['All Categories', ...CATEGORY_OPTIONS], []);

  const colorOptions = useMemo(() => {
    const colors = Array.from(new Set(catalogRows.map((row) => row.color))).sort();
    return ['All Colors', ...colors];
  }, [catalogRows]);

  const filteredCatalogRows = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return catalogRows.filter((row) => {
      const matchesSearch =
        query.length === 0 ||
        [row.styleNo, row.name, normalizeCategory(row.category), row.color, row.fabric].join(' ').toLowerCase().includes(
          query,
        );
      const matchesCategory = categoryFilter === 'All Categories' || normalizeCategory(row.category) === categoryFilter;
      const matchesColor = colorFilter === 'All Colors' || row.color === colorFilter;
      const matchesStatus = statusFilter === 'All Statuses' || row.status === statusFilter;
      return matchesSearch && matchesCategory && matchesColor && matchesStatus;
    });
  }, [catalogRows, searchValue, categoryFilter, colorFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = catalogRows.length;
    const dresses = catalogRows.filter((row) => normalizeCategory(row.category) === 'DRESSES').length;
    const cordSets = catalogRows.filter((row) => normalizeCategory(row.category) === 'CORD SETS').length;
    return { total, dresses, cordSets };
  }, [catalogRows]);

  const lowConfidenceFields = useMemo(
    () =>
      Object.entries(aiSuggestions?.confidence ?? {})
        .filter(([, confidence]) => typeof confidence === 'number' && confidence < 70)
        .map(([field]) => field as AiFieldKey),
    [aiSuggestions],
  );

  const similarItems = useMemo(() => {
    if (!aiSuggestions || lowConfidenceFields.length === 0) return [];
    const categorySuggestion = aiSuggestions.values.category;
    const colorSuggestion = aiSuggestions.values.color;
    const fabricSuggestion = aiSuggestions.values.fabric;
    const compositionSuggestion = aiSuggestions.values.composition;

    return catalogRows
      .filter((row) => !editingRowId || row.id !== editingRowId)
      .map((row) => {
        let score = 0;
        if (categorySuggestion && normalizeCategory(row.category) === normalizeCategory(categorySuggestion)) score += 2;
        if (colorSuggestion && row.color.toLowerCase() === colorSuggestion.toLowerCase()) score += 2;
        if (fabricSuggestion && row.fabric.toLowerCase() === fabricSuggestion.toLowerCase()) score += 2;
        if (compositionSuggestion && row.composition.toLowerCase() === compositionSuggestion.toLowerCase()) score += 1;
        return { row, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.row);
  }, [aiSuggestions, catalogRows, editingRowId, lowConfidenceFields.length]);

  const seasonalRecommendation = useMemo(() => {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) {
      return { season: 'Spring', color: 'Pink', fabric: 'Cotton Poplin', composition: '100% Cotton' };
    }
    if (month >= 6 && month <= 8) {
      return { season: 'Summer', color: 'White', fabric: 'Cotton Poplin', composition: '100% Cotton' };
    }
    if (month >= 9 && month <= 11) {
      return { season: 'Fall', color: 'Maroon', fabric: 'Poly Georgette', composition: '100% Polyester' };
    }
    return { season: 'Winter', color: 'Bottle Green', fabric: 'Pleated Knitted Fabric', composition: '100% Polyester' };
  }, []);

  useEffect(() => {
    setSelectedRowIds((ids) => ids.filter((id) => catalogRows.some((row) => row.id === id)));
  }, [catalogRows]);

  const selectedIdSet = useMemo(() => new Set(selectedRowIds), [selectedRowIds]);
  const selectedVisibleCount = useMemo(
    () => filteredCatalogRows.filter((row) => selectedIdSet.has(row.id)).length,
    [filteredCatalogRows, selectedIdSet],
  );
  const allVisibleSelected = filteredCatalogRows.length > 0 && selectedVisibleCount === filteredCatalogRows.length;

  const isEditMode = editingRowId !== null;

  function updateUploadItem(itemId: string, updater: (item: UploadItem) => UploadItem): void {
    setUploadItems((items) => items.map((item) => (item.id === itemId ? updater(item) : item)));
  }

  async function runSingleUpload(item: UploadItem): Promise<void> {
    updateUploadItem(item.id, (current) => ({ ...current, status: 'uploading', progress: 10, error: undefined }));
    let progress = 10;
    while (progress < 92) {
      await wait(120);
      progress = Math.min(92, progress + Math.floor(Math.random() * 14) + 6);
      updateUploadItem(item.id, (current) => ({ ...current, progress }));
    }
    // Queue stage only: mark file ready for bulk AI/save flow.
    updateUploadItem(item.id, (current) => ({
      ...current,
      status: 'completed_local',
      progress: 100,
    }));
  }

  async function drainQueue(): Promise<void> {
    if (queueRunningRef.current) return;
    queueRunningRef.current = true;
    setIsUploadProcessing(true);
    try {
      while (queueRef.current.length > 0) {
        const next = queueRef.current.shift();
        if (!next) break;
        await runSingleUpload(next);
      }
    } finally {
      queueRunningRef.current = false;
      setIsUploadProcessing(false);
    }
  }

  async function handleAnalyzeAll(): Promise<boolean> {
    if (uploadItems.length === 0 || isBulkAnalyzing) return true;
    if (!hasAccessToken()) {
      setUploadMessage('Sign in to analyze and save bulk items.');
      return false;
    }
    setIsBulkAnalyzing(true);
    let hasFailures = false;

    try {
      const newItems = [...uploadItems];
      for (const item of newItems) {
        if (!item.file) continue;

        // Skip if already completed or uploading
        if (item.status === 'completed' || item.status === 'uploading') continue;

        try {
          updateUploadItem(item.id, (current) => ({ ...current, status: 'uploading', progress: 25 }));

          const base64DataUrl = await fileToDataUrl(item.file);

          const analysisRes = await apiRequest<AnalyzeImageApiResult>('/catalog/analyze-image', {
            method: 'POST',
            body: JSON.stringify({ image_url: base64DataUrl }),
          });

          const resolvedCategory = normalizeCategory(normalizeAiValue(analysisRes.category?.value));
          const resolvedStyleName = pickOptionValue(analysisRes.style_name?.value, STYLE_NAME_OPTIONS);
          const resolvedColor = pickOptionValue(analysisRes.color?.value, COLOR_OPTIONS) ?? seasonalRecommendation.color;
          const resolvedFabric = pickOptionValue(analysisRes.fabric?.value, FABRIC_OPTIONS) ?? seasonalRecommendation.fabric;
          const resolvedComposition = pickOptionValue(analysisRes.composition?.value, COMPOSITION_OPTIONS) ?? bulkComposition;
          const resolvedWovenKnits = pickOptionValue(analysisRes.woven_knits?.value, WOVEN_KNITS_OPTIONS) ?? bulkWovenKnits;

          const formData = new FormData();
          formData.append('file', item.file);

          const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
          const normalizedApiUrl = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/api/v1`;
          const headers: HeadersInit = {};
          const accessToken = document.cookie
            .split(';')
            .map((entry) => entry.trim())
            .find((entry) => entry.startsWith('kira_access_token='))
            ?.split('=')[1];
          if (accessToken) headers.Authorization = `Bearer ${decodeURIComponent(accessToken)}`;
          const uploadRes = await fetch(`${normalizedApiUrl}/uploads/`, {
            method: 'POST',
            headers,
            body: formData,
          });

          if (!uploadRes.ok) throw new Error('Upload failed');
          const uploadData = await uploadRes.json() as { url: string, filename: string };
          const uploadedUrl = uploadData.url.startsWith('/static')
            ? `${rawApiUrl.replace('/api/v1', '')}${uploadData.url}`
            : uploadData.url;

          // Generate a style code
          const styleRes = await apiRequest<{ style_code: string }>('/catalog/generate-style-code', {
            method: 'POST',
            body: JSON.stringify({ brand: 'GEN', category: resolvedCategory })
          });

          // Create the product combining AI findings with bulk settings
          const defaultName = item.name.split('.')[0] || 'Bulk Item';
          const resolvedTitle = resolvedStyleName ?? defaultName;
          const created = await apiRequest<ProductResponse>('/catalog/products', {
            method: 'POST',
            body: JSON.stringify({
              sku: styleRes.style_code,
              title: resolvedTitle,
              category: resolvedCategory,
              color: resolvedColor,
              status: 'draft',
              ai_attributes: {
                fabric: resolvedFabric,
                composition: resolvedComposition,
                woven_knits: resolvedWovenKnits,
                units: '24',
                po_price: bulkPoPrice,
                osp: `SAR ${bulkOspSar}`,
              },
            })
          });

          await apiRequest(`/catalog/products/${created.id}/images`, {
            method: 'POST',
            body: JSON.stringify({
              file_name: uploadData.filename,
              file_url: uploadedUrl,
              mime_type: item.type,
              file_size_bytes: item.size,
              processing_status: 'uploaded',
            }),
          });

          const newRow: CatalogRow = {
            id: created.id,
            primary_image_url: uploadedUrl,
            styleNo: created.sku,
            name: created.title || resolvedTitle,
            category: normalizeCategory(created.category ?? resolvedCategory),
            color: created.color ?? resolvedColor,
            fabric: resolvedFabric,
            composition: resolvedComposition,
            wovenKnits: resolvedWovenKnits,
            units: '24',
            poPrice: bulkPoPrice,
            price: `SAR ${bulkOspSar}`,
            status: created.status as CatalogStatus,
            persisted: true,
            imageName: item.name,
          };

          setCatalogRows((prev) => [newRow, ...prev]);
          persistedProductsRef.current = [newRow, ...persistedProductsRef.current];
          updateUploadItem(item.id, (current) => ({ ...current, status: 'completed', progress: 100 }));

        } catch (error) {
          hasFailures = true;
          updateUploadItem(item.id, (current) => ({
            ...current,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Analysis failed',
            progress: 100
          }));
        }
      }
      setUploadMessage(
        hasFailures
          ? 'Bulk analyze finished with some failures. Review failed rows and retry.'
          : 'Bulk analyze complete. Items saved to catalog.',
      );
      return !hasFailures;
    } finally {
      setIsBulkAnalyzing(false);
    }
  }

  async function handleSaveAllToCatalog(): Promise<void> {
    if (uploadItems.length === 0 || isBulkAnalyzing) return;
    const savedSuccessfully = await handleAnalyzeAll();
    if (savedSuccessfully) {
      setIsBulkUploadOpen(false);
      setUploadItems([]);
      queueRef.current = [];
    }
  }

  function enqueueUploads(files: File[]): void {
    if (files.length === 0) return;

    const limited = files.slice(0, MAX_BULK_FILES_PER_BATCH);
    const errors: string[] = [];
    if (files.length > MAX_BULK_FILES_PER_BATCH) {
      errors.push(`Only first ${MAX_BULK_FILES_PER_BATCH} files were queued.`);
    }

    const accepted: UploadItem[] = [];
    for (const file of limited) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: unsupported format`);
        continue;
      }
      if (file.size > MAX_BULK_FILE_SIZE_BYTES) {
        errors.push(`${file.name}: exceeds ${formatBytes(MAX_BULK_FILE_SIZE_BYTES)} limit`);
        continue;
      }
      accepted.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        progress: 0,
        status: 'queued',
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (accepted.length > 0) {
      setUploadItems((items) => [...accepted, ...items]);
      queueRef.current = [...queueRef.current, ...accepted];
      void drainQueue();
      setUploadMessage('Files queued for upload.');
    }

    if (errors.length > 0) setUploadMessage(errors.join(' • '));
  }

  function handleBulkFileInput(event: ChangeEvent<HTMLInputElement>): void {
    const files = event.target.files ? Array.from(event.target.files) : [];
    enqueueUploads(files);
    event.currentTarget.value = '';
  }

  function handleBulkDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDropActive(false);
    enqueueUploads(Array.from(event.dataTransfer.files));
  }

  function clearFinishedUploads(): void {
    setUploadItems((items) => items.filter((item) => item.status === 'queued' || item.status === 'uploading'));
  }

  async function handleEditRow(row: CatalogRow): Promise<void> {
    setAddItemError(null);
    setItemImageError(null);
    setFieldConfidence({});
    setFieldContext({});
    setAiSuggestions(null);
    setIsAiSuggestionsVisible(false);
    setFeedbackCompletedFields({});
    setOverallConfidence(null);
    setAnalysisStage(null);
    setLastAnalyzedImageHash(null);
    setIsCorrectionModalOpen(false);
    setCorrectionFieldKey(null);
    selectedImageFileRef.current = null;
    if (addItemImageInputRef.current) {
      addItemImageInputRef.current.value = '';
    }

    // If the row is persisted, fetch the latest product data to get the most up-to-date image
    if (row.persisted && hasAccessToken()) {
      try {
        const response = await apiRequest<ProductResponse>(`/catalog/products/${row.id}`);
        setImagePreviewUrl(getImageUrl(response.primary_image_url));
      } catch (error) {
        // Fallback to row data if fetch fails
        setImagePreviewUrl(getImageUrl(row.primary_image_url));
      }
    } else {
      setImagePreviewUrl(getImageUrl(row.primary_image_url));
    }

    setEditingRowId(row.id);
    setItemStyleNo(row.styleNo);
    setItemCategory(normalizeCategory(row.category));
    setItemStyleName(STYLE_NAME_OPTIONS.includes(row.name as (typeof STYLE_NAME_OPTIONS)[number]) ? row.name : STYLE_NAME_OPTIONS[0]);
    setItemColor(COLOR_OPTIONS.includes(row.color as (typeof COLOR_OPTIONS)[number]) ? row.color : COLOR_OPTIONS[0]);
    setItemFabric(FABRIC_OPTIONS.includes(row.fabric as (typeof FABRIC_OPTIONS)[number]) ? row.fabric : FABRIC_OPTIONS[0]);
    setItemComposition(
      COMPOSITION_OPTIONS.includes(row.composition as (typeof COMPOSITION_OPTIONS)[number])
        ? row.composition
        : COMPOSITION_OPTIONS[0],
    );
    setItemWovenKnits(
      WOVEN_KNITS_OPTIONS.includes(row.wovenKnits as (typeof WOVEN_KNITS_OPTIONS)[number])
        ? row.wovenKnits
        : WOVEN_KNITS_OPTIONS[0],
    );
    setItemTotalUnits(
      TOTAL_UNITS_OPTIONS.includes(row.units as (typeof TOTAL_UNITS_OPTIONS)[number])
        ? row.units
        : TOTAL_UNITS_OPTIONS[0],
    );
    setItemPoPrice(
      PO_PRICE_OPTIONS.includes(row.poPrice as (typeof PO_PRICE_OPTIONS)[number])
        ? row.poPrice
        : PO_PRICE_OPTIONS[0],
    );
    setItemOspSar(
      OSP_OPTIONS.includes(row.price.replace('SAR', '').trim() as (typeof OSP_OPTIONS)[number])
        ? row.price.replace('SAR', '').trim()
        : OSP_OPTIONS[0],
    );
    setItemImageName(row.imageName ?? row.name);
    setIsAddModalOpen(true);
  }

  async function handleDeleteRow(row: CatalogRow): Promise<void> {
    if (!row.persisted) {
      setCatalogRows((rows) => rows.filter((item) => item.id !== row.id));
      return;
    }

    // For persisted items, delete via API
    if (!hasAccessToken()) {
      setCatalogNotice('You must be signed in to delete items.');
      return;
    }

    try {
      await apiRequest(`/catalog/products/${row.id}`, {
        method: 'DELETE',
      });

      // Remove from local state after successful deletion
      setCatalogRows((rows) => rows.filter((item) => item.id !== row.id));
      setCatalogNotice('Item deleted successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete item.';
      setCatalogNotice(`Error: ${message}`);
    }
  }

  function toggleRowSelection(rowId: string): void {
    setSelectedRowIds((ids) => (ids.includes(rowId) ? ids.filter((id) => id !== rowId) : [...ids, rowId]));
  }

  function toggleSelectAllVisible(): void {
    const visibleIds = filteredCatalogRows.map((row) => row.id);
    if (visibleIds.length === 0) return;
    const visibleSet = new Set(visibleIds);
    setSelectedRowIds((ids) => {
      const allSelected = visibleIds.every((id) => ids.includes(id));
      if (allSelected) return ids.filter((id) => !visibleSet.has(id));
      const merged = new Set(ids);
      visibleIds.forEach((id) => merged.add(id));
      return Array.from(merged);
    });
  }

  function handleInlineUnitsChange(rowId: string, value: string): void {
    const normalized = value.replace(/[^0-9]/g, '');
    setCatalogRows((rows) => rows.map((row) => (row.id === rowId ? { ...row, units: normalized } : row)));
  }

  function handleInlinePriceChange(rowId: string, value: string): void {
    const normalized = value.replace(/[^0-9.]/g, '').trim();
    const formatted = normalized.length > 0 ? `SAR ${normalized}` : 'SAR 0';
    setCatalogRows((rows) => rows.map((row) => (row.id === rowId ? { ...row, price: formatted } : row)));
  }

  async function handleRowStatusTransition(row: CatalogRow, nextStatus: CatalogStatus): Promise<void> {
    if (row.status === nextStatus) return;

    if (row.persisted) {
      if (!hasAccessToken()) {
        setCatalogNotice('Sign in to update product status on the API.');
        return;
      }
      try {
        await apiRequest<ProductResponse>(`/catalog/products/${row.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: nextStatus }),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update status.';
        setCatalogNotice(`Error: ${message}`);
        return;
      }
    }

    setCatalogRows((rows) => rows.map((item) => (item.id === row.id ? { ...item, status: nextStatus } : item)));
    setCatalogNotice(`Status updated to ${formatStatusLabel(nextStatus)}.`);
  }

  async function handleApplyBulkEdit(): Promise<void> {
    if (selectedRowIds.length === 0) return;

    const trimmedUnits = bulkUnitsValue.trim();
    const nextBulkStatus: CatalogStatus | null = bulkStatus === '' ? null : bulkStatus;
    const shouldApplyUnits = trimmedUnits.length > 0;
    const shouldApplyStatus = nextBulkStatus !== null;
    if (!shouldApplyUnits && !shouldApplyStatus) {
      setCatalogNotice('Select at least one bulk edit value.');
      return;
    }

    setIsBulkApplying(true);
    try {
      const selectedSet = new Set(selectedRowIds);
      const canPersistStatus = hasAccessToken();
      let successfulPersistedStatusIds = new Set<string>();
      let failedPersistedStatusCount = 0;

      if (shouldApplyStatus) {
        const targetedPersistedRows = catalogRows.filter((row) => selectedSet.has(row.id) && row.persisted);
        if (targetedPersistedRows.length > 0) {
          if (!canPersistStatus) {
            setCatalogNotice('Sign in to apply status changes to persisted rows.');
          } else {
            const statusResults = await Promise.allSettled(
              targetedPersistedRows.map((row) =>
                apiRequest<ProductResponse>(`/catalog/products/${row.id}`, {
                  method: 'PATCH',
                  body: JSON.stringify({ status: nextBulkStatus }),
                }),
              ),
            );
            successfulPersistedStatusIds = new Set(
              statusResults
                .map((result, index) =>
                  result.status === 'fulfilled' ? targetedPersistedRows[index]?.id ?? null : null,
                )
                .filter((id): id is string => id !== null),
            );
            failedPersistedStatusCount = statusResults.filter((result) => result.status === 'rejected').length;
          }
        }
      }

      setCatalogRows((rows) =>
        rows.map((row) => {
          if (!selectedSet.has(row.id)) return row;
          let nextRow = row;
          if (shouldApplyUnits) {
            const unitsOnly = trimmedUnits.replace(/[^0-9]/g, '');
            nextRow = { ...nextRow, units: unitsOnly };
          }
          if (shouldApplyStatus) {
            if (!row.persisted || (canPersistStatus && successfulPersistedStatusIds.has(row.id))) {
              nextRow = { ...nextRow, status: nextBulkStatus as CatalogStatus };
            }
          }
          return nextRow;
        }),
      );

      if (shouldApplyStatus && failedPersistedStatusCount > 0) {
        setCatalogNotice(
          `Bulk edit applied with ${failedPersistedStatusCount} persisted status updates failing. Check API availability.`,
        );
      } else {
        setCatalogNotice(`Bulk edit applied to ${selectedRowIds.length} row(s).`);
      }
      setBulkUnitsValue('');
    } finally {
      setIsBulkApplying(false);
    }
  }

  function openAddModal(): void {
    setEditingRowId(null);
    setItemStyleNo('');
    setItemImageName('');
    setAddItemError(null);
    setImagePreviewUrl(null);
    setPendingAnalyzeProductId(null);
    setFieldConfidence({});
    setFieldContext({});
    setAiSuggestions(null);
    setIsAiSuggestionsVisible(false);
    setFeedbackCompletedFields({});
    setOverallConfidence(null);
    setAnalysisStage(null);
    setLastAnalyzedImageHash(null);
    setIsCorrectionModalOpen(false);
    setCorrectionFieldKey(null);
    setCorrectionReasonCode(CORRECTION_REASON_OPTIONS[0].value);
    setCorrectionNotes('');
    selectedImageFileRef.current = null;
    if (addItemImageInputRef.current) {
      addItemImageInputRef.current.value = '';
    }

    if (rememberLastValues) {
      const stored = localStorage.getItem('kira_last_item_values');
      if (stored) {
        try {
          const values = JSON.parse(stored);
          setItemCategory(values.category || CATEGORY_OPTIONS[0]);
          setItemStyleName(values.styleName || STYLE_NAME_OPTIONS[0]);
          setItemColor(values.color || COLOR_OPTIONS[1]);
          setItemFabric(values.fabric || FABRIC_OPTIONS[0]);
          setItemComposition(values.composition || COMPOSITION_OPTIONS[1]);
          setItemWovenKnits(values.wovenKnits || WOVEN_KNITS_OPTIONS[1]);
          setItemTotalUnits(values.totalUnits || TOTAL_UNITS_OPTIONS[0]);
          setItemPoPrice(values.poPrice || PO_PRICE_OPTIONS[2]);
          setItemOspSar(values.ospSar || OSP_OPTIONS[1]);
        } catch (e) {
          // ignore parse errors
        }
      }
    } else {
      setItemCategory(CATEGORY_OPTIONS[0]);
      setItemStyleName(STYLE_NAME_OPTIONS[0]);
      setItemColor(COLOR_OPTIONS[1]);
      setItemFabric(FABRIC_OPTIONS[0]);
      setItemComposition(COMPOSITION_OPTIONS[1]);
      setItemWovenKnits(WOVEN_KNITS_OPTIONS[1]);
      setItemTotalUnits(TOTAL_UNITS_OPTIONS[0]);
      setItemPoPrice(PO_PRICE_OPTIONS[2]);
      setItemOspSar(OSP_OPTIONS[1]);
    }

    setIsAddModalOpen(true);
  }

  function closeAddModal(): void {
    setIsAddModalOpen(false);
    setEditingRowId(null);
    setPendingAnalyzeProductId(null);
    setAddItemError(null);
    setItemImageError(null);
    setAnalysisStage(null);
    setIsCorrectionModalOpen(false);
    setCorrectionFieldKey(null);
    selectedImageFileRef.current = null;
    if (addItemImageInputRef.current) {
      addItemImageInputRef.current.value = '';
    }
  }

  function handleAddItemImage(file: File | null): void {
    setItemImageError(null);
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setItemImageError('Only PNG, JPG, and WEBP files are allowed.');
      return;
    }
    if (file.size > MAX_ITEM_IMAGE_SIZE_BYTES) {
      setItemImageError(`Image exceeds ${formatBytes(MAX_ITEM_IMAGE_SIZE_BYTES)}.`);
      return;
    }
    setItemImageName(file.name);
    selectedImageFileRef.current = file;
    setAiSuggestions(null);
    setIsAiSuggestionsVisible(false);
    setFeedbackCompletedFields({});
    setOverallConfidence(null);
    setFieldConfidence({});
    setFieldContext({});
    setLastAnalyzedImageHash(null);

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);

    if (hasAccessToken()) {
      setAnalysisStage('Queued for AI analysis...');
      void handleAnalyzeImage('auto');
    }
  }

  function currentFieldValue(fieldKey: AiFieldKey): string {
    if (fieldKey === 'category') return itemCategory;
    if (fieldKey === 'styleName') return itemStyleName;
    if (fieldKey === 'color') return itemColor;
    if (fieldKey === 'fabric') return itemFabric;
    if (fieldKey === 'composition') return itemComposition;
    return itemWovenKnits;
  }

  async function submitFeedback(fieldKey: AiFieldKey, feedbackType: FeedbackType, reasonCode?: string, notes?: string): Promise<void> {
    if (!aiSuggestions) return;
    const suggestedValue = aiSuggestions.values[fieldKey];
    if (!suggestedValue) return;

    const payload: LogCorrectionRequest = {
      product_id: pendingAnalyzeProductId ?? editingRowId ?? undefined,
      image_hash: aiSuggestions.imageHash ?? lastAnalyzedImageHash ?? undefined,
      field_name: AI_FIELD_API_KEYS[fieldKey],
      feedback_type: feedbackType,
      suggested_value: suggestedValue,
      corrected_value: currentFieldValue(fieldKey),
      reason_code: reasonCode,
      notes: notes && notes.trim().length > 0 ? notes.trim() : undefined,
      source: aiSuggestions.context[fieldKey]?.source,
      based_on: aiSuggestions.context[fieldKey]?.basedOn,
      learned_from: aiSuggestions.context[fieldKey]?.learnedFrom,
      confidence_score: aiSuggestions.confidence[fieldKey],
    };

    setIsFeedbackSubmitting(true);
    try {
      await apiRequest('/catalog/log-correction', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setFeedbackCompletedFields((prev) => ({ ...prev, [fieldKey]: true }));
      setCatalogNotice(
        feedbackType === 'accept'
          ? `${AI_FIELD_LABELS[fieldKey]} marked as correct.`
          : `${AI_FIELD_LABELS[fieldKey]} correction logged for AI learning.`,
      );
      await loadLearningStats();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to log AI feedback.';
      setCatalogNotice(`Feedback error: ${message}`);
    } finally {
      setIsFeedbackSubmitting(false);
    }
  }

  function handleSuggestionFeedback(fieldKey: AiFieldKey, feedbackType: FeedbackType): void {
    if (feedbackType === 'reject') {
      setCorrectionFieldKey(fieldKey);
      setCorrectionReasonCode(CORRECTION_REASON_OPTIONS[0].value);
      setCorrectionNotes('');
      setIsCorrectionModalOpen(true);
      return;
    }
    void submitFeedback(fieldKey, 'accept');
  }

  async function handleSubmitCorrectionModal(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!correctionFieldKey) return;
    await submitFeedback(correctionFieldKey, 'reject', correctionReasonCode, correctionNotes);
    setIsCorrectionModalOpen(false);
    setCorrectionFieldKey(null);
    setCorrectionNotes('');
  }

  async function handleAnalyzeImage(mode: 'manual' | 'auto' = 'manual'): Promise<void> {
    if (isAnalyzing) {
      return;
    }
    const selectedFile = selectedImageFileRef.current;
    const existingImageSource = imagePreviewUrl ? (getImageUrl(imagePreviewUrl) ?? imagePreviewUrl) : null;
    if (!selectedFile && !existingImageSource) {
      setItemImageError('Please select an image first.');
      return;
    }

    setIsAnalyzing(true);
    setAddItemError(null);
    setItemImageError(null);

    try {
      if (!hasAccessToken()) {
        if (mode === 'auto') {
          setAnalysisStage(null);
          return;
        }
        throw new Error('You must be signed in to use AI analysis.');
      }

      let base64DataUrl: string;
      if (selectedFile) {
        // 1a. New file selected: upload and analyze that file.
        setAnalysisStage('Uploading image...');
        const formData = new FormData();
        formData.append('file', selectedFile);

        const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const normalizedApiUrl = rawApiUrl.endsWith('/api/v1')
          ? rawApiUrl
          : `${rawApiUrl.replace(/\/+$/, '')}/api/v1`;

        const headers: HeadersInit = {};
        const accessToken = document.cookie
          .split(';')
          .map((entry) => entry.trim())
          .find((entry) => entry.startsWith('kira_access_token='))
          ?.split('=')[1];

        if (accessToken) {
          headers['Authorization'] = `Bearer ${decodeURIComponent(accessToken)}`;
        }

        const uploadRes = await fetch(`${normalizedApiUrl}/uploads/`, {
          method: 'POST',
          headers,
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload image before analysis.');
        }

        const uploadData = await uploadRes.json() as { url: string; filename: string };
        const baseUrl = normalizedApiUrl.replace('/api/v1', '').replace(/\/+$/, '');
        const fullImageUrl = uploadData.url.startsWith('/static')
          ? `${baseUrl}${uploadData.url}`
          : uploadData.url;

        // Update the preview URL so the user sees the canonical uploaded image.
        setImagePreviewUrl(getImageUrl(fullImageUrl));
        setAnalysisStage('Running AI vision analysis...');
        base64DataUrl = await fileToDataUrl(selectedFile);
      } else {
        // 1b. Edit mode existing image: analyze currently displayed image.
        setAnalysisStage('Preparing existing image...');
        try {
          base64DataUrl = await imageUrlToDataUrl(existingImageSource as string);
        } catch {
          // Some existing image URLs can be blocked by browser fetch/CORS; fall back to URL input.
          base64DataUrl = existingImageSource as string;
        }
        setAnalysisStage('Running AI vision analysis...');
      }

      // 3. Call synchronous analyze-image endpoint
      const result = await apiRequest<AnalyzeImageApiResult>('/catalog/analyze-image', {
        method: 'POST',
        body: JSON.stringify({ image_url: base64DataUrl })
      });

      // 3. Populate form fields and confidence
      setAnalysisStage('Applying AI suggestions...');
      const suggestions: Partial<Record<AiFieldKey, string>> = {};
      const newConfidence: Partial<Record<AiFieldKey, number>> = {};
      const newContext: Partial<Record<AiFieldKey, AiFieldContext>> = {};
      let totalConf = 0;
      let confCount = 0;

      const categoryContext = parseAiContext(result.category);
      if (categoryContext) newContext.category = categoryContext;

      if (result.category?.value) {
        suggestions.category = normalizeCategory(result.category.value);
        if (typeof result.category.confidence === 'number') {
          newConfidence.category = result.category.confidence;
          totalConf += result.category.confidence;
          confCount++;
        }
      }
      const colorContext = parseAiContext(result.color);
      if (colorContext) newContext.color = colorContext;
      if (result.color?.value) {
        suggestions.color = result.color.value;
        if (typeof result.color.confidence === 'number') {
          newConfidence.color = result.color.confidence;
          totalConf += result.color.confidence;
          confCount++;
        }
      }
      const styleContext = parseAiContext(result.style_name);
      if (styleContext) newContext.styleName = styleContext;
      const styleNameField = result.style_name;
      if (styleNameField?.value) {
        const matchingStyle = pickOptionValue(styleNameField.value, STYLE_NAME_OPTIONS);
        if (matchingStyle) {
          suggestions.styleName = matchingStyle;
          if (typeof styleNameField.confidence === 'number') {
            newConfidence.styleName = styleNameField.confidence;
            totalConf += styleNameField.confidence;
            confCount++;
          }
        }
      }
      const fabricContext = parseAiContext(result.fabric);
      if (fabricContext) newContext.fabric = fabricContext;
      const fabricField = result.fabric;
      if (fabricField?.value) {
        const matchingFabric = FABRIC_OPTIONS.find(o => o.toLowerCase() === String(fabricField.value).toLowerCase());
        if (matchingFabric) {
          suggestions.fabric = matchingFabric;
          if (typeof fabricField.confidence === 'number') {
            newConfidence.fabric = fabricField.confidence;
            totalConf += fabricField.confidence;
            confCount++;
          }
        }
      }
      const compositionContext = parseAiContext(result.composition);
      if (compositionContext) newContext.composition = compositionContext;
      const compositionField = result.composition;
      if (compositionField?.value) {
        const matchingComp = COMPOSITION_OPTIONS.find(o => o.toLowerCase() === String(compositionField.value).toLowerCase());
        if (matchingComp) {
          suggestions.composition = matchingComp;
          if (typeof compositionField.confidence === 'number') {
            newConfidence.composition = compositionField.confidence;
            totalConf += compositionField.confidence;
            confCount++;
          }
        }
      }
      const wovenKnitsContext = parseAiContext(result.woven_knits);
      if (wovenKnitsContext) newContext.wovenKnits = wovenKnitsContext;
      const wovenKnitsField = result.woven_knits;
      if (wovenKnitsField?.value) {
        const matchingKnits = WOVEN_KNITS_OPTIONS.find(o => o.toLowerCase() === String(wovenKnitsField.value).toLowerCase());
        if (matchingKnits) {
          suggestions.wovenKnits = matchingKnits;
          if (typeof wovenKnitsField.confidence === 'number') {
            newConfidence.wovenKnits = wovenKnitsField.confidence;
            totalConf += wovenKnitsField.confidence;
            confCount++;
          }
        }
      }

      const analyzedImageHash = typeof result.image_hash === 'string' ? result.image_hash : undefined;
      if (Object.keys(suggestions).length === 0) {
        setAiSuggestions(null);
        setIsAiSuggestionsVisible(false);
        setOverallConfidence(null);
        throw new Error('AI could not extract attributes from this image. Try another image or re-run analysis.');
      }
      setAiSuggestions({ values: suggestions, confidence: newConfidence, context: newContext, imageHash: analyzedImageHash });
      setIsAiSuggestionsVisible(true);
      setFeedbackCompletedFields({});
      setLastAnalyzedImageHash(analyzedImageHash ?? null);
      if (confCount > 0) {
        setOverallConfidence(Math.round(totalConf / confCount));
      }

      setCatalogNotice('AI analysis complete. Please review suggestions.');

    } catch (e: any) {
      setAddItemError(e.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStage(null);
    }
  }

  function handleAcceptAllAI(): void {
    if (!aiSuggestions) return;

    if (aiSuggestions.values.category) setItemCategory(aiSuggestions.values.category);
    if (aiSuggestions.values.color) setItemColor(aiSuggestions.values.color);
    if (aiSuggestions.values.styleName) setItemStyleName(aiSuggestions.values.styleName);
    if (aiSuggestions.values.fabric) setItemFabric(aiSuggestions.values.fabric);
    if (aiSuggestions.values.composition) setItemComposition(aiSuggestions.values.composition);
    if (aiSuggestions.values.wovenKnits) setItemWovenKnits(aiSuggestions.values.wovenKnits);

    // Set field confidence so the badges appear on the inputs
    setFieldConfidence(aiSuggestions.confidence);
    setFieldContext(aiSuggestions.context);

    setIsAiSuggestionsVisible(false);
    setCatalogNotice('AI suggestions accepted and applied.');
  }

  function applySimilarItemDefaults(row: CatalogRow): void {
    setItemCategory(normalizeCategory(row.category));
    setItemStyleName(
      STYLE_NAME_OPTIONS.includes(row.name as (typeof STYLE_NAME_OPTIONS)[number])
        ? row.name
        : STYLE_NAME_OPTIONS[0],
    );
    setItemColor(row.color);
    setItemFabric(row.fabric);
    setItemComposition(row.composition);
    setItemWovenKnits(row.wovenKnits);
    setCatalogNotice(`Inherited values from ${row.styleNo}.`);
  }

  function applySeasonalDefaults(): void {
    setItemColor(seasonalRecommendation.color);
    setItemFabric(seasonalRecommendation.fabric);
    setItemComposition(seasonalRecommendation.composition);
    setCatalogNotice(`${seasonalRecommendation.season} defaults applied.`);
  }

  function handleAddItemImageInput(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null;
    handleAddItemImage(file);
    event.currentTarget.value = '';
  }

  function handleAddItemDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    event.stopPropagation();
    setIsItemDropActive(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    handleAddItemImage(file);
  }

  async function handleSaveNewItem(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setAddItemError(null);

    const normalizedStyleNo = itemStyleNo.trim().toUpperCase();
    if (!normalizedStyleNo) {
      setAddItemError('Style No is required.');
      return;
    }

    if (rememberLastValues) {
      localStorage.setItem('kira_last_item_values', JSON.stringify({
        category: itemCategory,
        styleName: itemStyleName,
        color: itemColor,
        fabric: itemFabric,
        composition: itemComposition,
        wovenKnits: itemWovenKnits,
        totalUnits: itemTotalUnits,
        poPrice: itemPoPrice,
        ospSar: itemOspSar
      }));
    }

    const modalRowPayload = {
      styleNo: normalizedStyleNo,
      name: itemStyleName,
      category: itemCategory,
      color: itemColor,
      fabric: itemFabric,
      composition: itemComposition,
      wovenKnits: itemWovenKnits,
      units: itemTotalUnits,
      poPrice: itemPoPrice,
      price: `SAR ${itemOspSar}`,
      imageName: itemImageName || itemStyleName,
    };

    if (isEditMode && editingRowId) {
      const existingRow = catalogRows.find((row) => row.id === editingRowId);
      if (!existingRow) {
        setAddItemError('Unable to find item to edit.');
        return;
      }

      if (!hasAccessToken() || !existingRow.persisted) {
        setCatalogRows((rows) =>
          rows.map((row) =>
            row.id === editingRowId ? { ...row, ...modalRowPayload, status: row.status } : row,
          ),
        );
        setCatalogNotice('Item updated locally.');
        closeAddModal();
        return;
      }

      setIsSavingItem(true);
      try {
        const response = await apiRequest<ProductResponse>(`/catalog/products/${editingRowId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            sku: normalizedStyleNo,
            title: itemStyleName,
            category: itemCategory,
            color: itemColor,
            status: existingRow.status,
          }),
        });

        setCatalogRows((rows) =>
          rows.map((row) =>
            row.id === editingRowId
              ? {
                ...row,
                ...modalRowPayload,
                styleNo: response.sku,
                name: response.title,
                category: normalizeCategory(response.category ?? itemCategory),
                color: response.color ?? itemColor,
                status: response.status as CatalogStatus,
                persisted: true,
              }
              : row,
          ),
        );
        setCatalogNotice('Item updated successfully.');
        closeAddModal();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update item.';
        setAddItemError(message);
      } finally {
        setIsSavingItem(false);
      }
      return;
    }

    if (!hasAccessToken()) {
      const localRow: CatalogRow = {
        id: `local-${Date.now()}`,
        ...modalRowPayload,
        status: 'draft',
        persisted: false,
      };
      setCatalogRows((rows) => [localRow, ...rows]);
      setCatalogNotice('Item added locally. Sign in to persist to API.');
      closeAddModal();
      return;
    }

    setIsSavingItem(true);
    try {
      const response = pendingAnalyzeProductId
        ? await apiRequest<ProductResponse>(`/catalog/products/${pendingAnalyzeProductId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            sku: normalizedStyleNo,
            title: itemStyleName,
            category: itemCategory,
            color: itemColor,
            status: 'draft',
          }),
        })
        : await apiRequest<ProductResponse>('/catalog/products', {
          method: 'POST',
          body: JSON.stringify({
            sku: normalizedStyleNo,
            title: itemStyleName,
            category: itemCategory,
            color: itemColor,
            status: 'draft',
          }),
        });

      // Upload image if one was selected
      let imageUrl: string | undefined = undefined;
      if (selectedImageFileRef.current) {
        try {
          const formData = new FormData();
          formData.append('file', selectedImageFileRef.current);

          // Normalize API URL to include /api/v1 if not present
          const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
          const normalizedApiUrl = rawApiUrl.endsWith('/api/v1')
            ? rawApiUrl
            : `${rawApiUrl.replace(/\/+$/, '')}/api/v1`;

          const headers: HeadersInit = {};
          const accessToken = document.cookie
            .split(';')
            .map((entry) => entry.trim())
            .find((entry) => entry.startsWith('kira_access_token='))
            ?.split('=')[1];

          if (accessToken) {
            headers['Authorization'] = `Bearer ${decodeURIComponent(accessToken)}`;
          }

          const uploadRes = await fetch(`${normalizedApiUrl}/uploads/`, {
            method: 'POST',
            headers,
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json() as { url: string; filename: string };
            const baseUrl = normalizedApiUrl.replace('/api/v1', '').replace(/\/+$/, '');
            imageUrl = uploadData.url.startsWith('/static')
              ? `${baseUrl}${uploadData.url}`
              : uploadData.url;

            // Create ProductImage record
            const analysisPayload =
              aiSuggestions || lastAnalyzedImageHash
                ? {
                  image_hash: aiSuggestions?.imageHash ?? lastAnalyzedImageHash ?? undefined,
                  suggestions: aiSuggestions?.values ?? undefined,
                  confidence: aiSuggestions?.confidence ?? undefined,
                  source_context: aiSuggestions?.context ?? undefined,
                }
                : undefined;
            await apiRequest<ProductImageResponse>(`/catalog/products/${response.id}/images`, {
              method: 'POST',
              body: JSON.stringify({
                file_name: uploadData.filename,
                file_url: imageUrl,
                processing_status: 'uploaded',
                analysis: analysisPayload,
              })
            });
          }
        } catch (uploadError) {
          // Don't fail the whole save if image upload fails
          console.warn('Failed to upload image:', uploadError);
        }
      }

      const createdRow: CatalogRow = {
        id: response.id,
        primary_image_url: imageUrl,
        styleNo: response.sku,
        name: response.title,
        category: normalizeCategory(response.category ?? itemCategory),
        color: response.color ?? itemColor,
        fabric: modalRowPayload.fabric,
        composition: modalRowPayload.composition,
        wovenKnits: modalRowPayload.wovenKnits,
        units: modalRowPayload.units,
        poPrice: modalRowPayload.poPrice,
        price: modalRowPayload.price,
        status: response.status as CatalogStatus,
        persisted: true,
        imageName: modalRowPayload.imageName,
      };

      setCatalogRows((rows) => [createdRow, ...rows]);
      setCatalogNotice('Item saved to catalog.');
      closeAddModal();
      // Clear the selected image
      selectedImageFileRef.current = null;
      setImagePreviewUrl(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save item.';
      setAddItemError(message);
    } finally {
      setIsSavingItem(false);
    }
  }

  return (
    <>
      <DashboardShell hideHeader>
        <section className='surface-card p-6 md:p-8'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div>
              <h1 className='font-serif text-5xl font-semibold leading-tight'>Catalog</h1>
              <p className='mt-2 text-lg text-kira-midgray'>Manage your clothing inventory</p>
            </div>
            <div className='flex items-center gap-3'>
              <button
                type='button'
                aria-label='AI learning'
                className={cn(
                  'kira-focus-ring inline-flex h-9 w-9 items-center justify-center transition-colors',
                  isLearningPanelOpen
                    ? 'bg-[#1E7145] text-white'
                    : 'text-[#1E7145] hover:bg-[#E3F6ED] hover:text-[#185D39]',
                )}
                onClick={() => {
                  setIsLearningPanelOpen((open) => !open);
                }}
              >
                <BrainIcon />
              </button>
              <button
                className='kira-focus-ring inline-flex items-center gap-2 border border-kira-warmgray/60 bg-kira-offwhite px-6 py-3 text-sm font-semibold uppercase tracking-[0.04em] text-kira-darkgray'
                onClick={() => setIsBulkUploadOpen((open) => !open)}
                type='button'
              >
                <UploadIcon />
                Bulk Upload
              </button>
              <button
                className='kira-focus-ring inline-flex items-center gap-2 bg-kira-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.04em] text-kira-offwhite'
                onClick={openAddModal}
                type='button'
              >
                <PlusIcon />
                Add Item
              </button>
            </div>
          </div>

          <div className='mt-8 grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='rounded-none border border-kira-warmgray/55 bg-kira-offwhite p-6'>
              <p className='text-sm uppercase tracking-[0.08em] text-kira-midgray'>Total Items</p>
              <p className='mt-5 text-5xl font-semibold leading-none text-kira-black'>{stats.total}</p>
            </div>
            <div className='rounded-none border border-kira-warmgray/55 bg-kira-offwhite p-6'>
              <p className='text-sm uppercase tracking-[0.08em] text-kira-midgray'>Dresses</p>
              <p className='mt-5 text-5xl font-semibold leading-none text-kira-black'>{stats.dresses}</p>
            </div>
            <div className='rounded-none border border-kira-warmgray/55 bg-kira-offwhite p-6'>
              <p className='text-sm uppercase tracking-[0.08em] text-kira-midgray'>Cord Sets</p>
              <p className='mt-5 text-5xl font-semibold leading-none text-kira-black'>{stats.cordSets}</p>
            </div>
          </div>

          {isLearningPanelOpen ? (
            <div className='mt-6 rounded-none border border-kira-warmgray/55 bg-kira-offwhite p-6'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-semibold uppercase tracking-[0.08em] text-kira-black'>AI Learning Progress</h3>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    className='kira-focus-ring border border-kira-warmgray/55 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-kira-darkgray'
                    onClick={() => void loadLearningStats()}
                  >
                    Refresh
                  </button>
                  <button
                    type='button'
                    aria-label='Close AI learning'
                    className='kira-focus-ring inline-flex h-8 w-8 items-center justify-center text-kira-midgray hover:text-kira-black'
                    onClick={() => setIsLearningPanelOpen(false)}
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>
              {isLearningStatsLoading ? <p className='mt-3 text-sm text-kira-midgray'>Loading learning stats...</p> : null}
              {learningStatsError ? <p className='mt-3 text-sm text-rose-700'>{learningStatsError}</p> : null}
              {learningStats ? (
                <>
                  <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4'>
                    <div className='border border-kira-warmgray/45 bg-kira-offwhite px-3 py-3'>
                      <p className='text-[11px] uppercase tracking-[0.08em] text-kira-midgray'>Items Processed</p>
                      <p className='mt-2 text-2xl font-semibold text-kira-black'>{learningStats.items_processed}</p>
                    </div>
                    <div className='border border-kira-warmgray/45 bg-kira-offwhite px-3 py-3'>
                      <p className='text-[11px] uppercase tracking-[0.08em] text-kira-midgray'>Corrections</p>
                      <p className='mt-2 text-2xl font-semibold text-kira-black'>{learningStats.corrections_received}</p>
                    </div>
                    <div className='border border-kira-warmgray/45 bg-kira-offwhite px-3 py-3'>
                      <p className='text-[11px] uppercase tracking-[0.08em] text-kira-midgray'>Time Saved</p>
                      <p className='mt-2 text-2xl font-semibold text-kira-black'>{learningStats.time_saved_minutes}m</p>
                    </div>
                    <div className='border border-kira-warmgray/45 bg-kira-offwhite px-3 py-3'>
                      <p className='text-[11px] uppercase tracking-[0.08em] text-kira-midgray'>Retraining Queue</p>
                      <p className='mt-2 text-2xl font-semibold text-kira-black'>{learningStats.pending_retraining}</p>
                    </div>
                  </div>
                  <div className='mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2'>
                    <div>
                      <p className='text-xs font-semibold uppercase tracking-[0.08em] text-kira-midgray'>Field Accuracy</p>
                      <div className='mt-3 space-y-2'>
                        {learningStats.field_accuracy.length === 0 ? (
                          <p className='text-sm text-kira-midgray'>No feedback yet.</p>
                        ) : (
                          learningStats.field_accuracy.slice(0, 6).map((item) => (
                            <div key={item.field_name}>
                              <div className='flex items-center justify-between text-xs text-kira-darkgray'>
                                <span>{item.field_name.replace(/_/g, ' ')}</span>
                                <span>{item.accuracy_percent.toFixed(1)}%</span>
                              </div>
                              <div className='mt-1 h-2 w-full bg-kira-warmgray/25'>
                                <div
                                  className='h-full bg-[#1E7145]'
                                  style={{ width: `${Math.max(0, Math.min(100, item.accuracy_percent))}%` }}
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div>
                      <p className='text-xs font-semibold uppercase tracking-[0.08em] text-kira-midgray'>What AI Has Learned</p>
                      <ul className='mt-3 space-y-2 text-sm text-kira-darkgray'>
                        {learningStats.insights.map((insight, index) => (
                          <li className='border-l-2 border-kira-warmgray/60 pl-3' key={`${insight}-${index}`}>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {catalogNotice ? (
            <p className='mt-4 rounded-md bg-kira-warmgray/20 px-3 py-2 text-sm text-kira-black'>{catalogNotice}</p>
          ) : null}
          {isCatalogLoading ? <p className='mt-3 text-sm text-kira-midgray'>Loading catalog...</p> : null}

          {isExportPanelOpen ? (
            <div className='mt-4 rounded-none border border-kira-warmgray/55 bg-kira-offwhite p-5'>
              <div className='flex flex-wrap items-center justify-between gap-3 border-b border-kira-warmgray/45 pb-3'>
                <h3 className='text-base font-semibold uppercase tracking-[0.06em] text-kira-black'>Marketplace Export</h3>
                <div className='inline-flex border border-kira-warmgray/55'>
                  <button
                    className={cn(
                      'kira-focus-ring px-4 py-2 text-xs font-semibold uppercase tracking-[0.06em]',
                      activeExportTab === 'generate'
                        ? 'bg-kira-black text-kira-offwhite'
                        : 'bg-kira-offwhite text-kira-darkgray',
                    )}
                    onClick={() => setActiveExportTab('generate')}
                    type='button'
                  >
                    Generate
                  </button>
                  <button
                    className={cn(
                      'kira-focus-ring border-l border-kira-warmgray/55 px-4 py-2 text-xs font-semibold uppercase tracking-[0.06em]',
                      activeExportTab === 'history'
                        ? 'bg-kira-black text-kira-offwhite'
                        : 'bg-kira-offwhite text-kira-darkgray',
                    )}
                    onClick={() => setActiveExportTab('history')}
                    type='button'
                  >
                    History
                  </button>
                </div>
              </div>

              {activeExportTab === 'generate' ? (
                <div className='mt-4 space-y-3'>
                  <p className='text-xs text-kira-midgray'>Export uses current search/status filters from this page.</p>
                  <p className='text-xs text-kira-midgray'>Use XLSX for image preview cells. CSV exports image URLs only.</p>
                  <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
                    <select
                      className='kira-focus-ring border border-kira-warmgray/55 bg-kira-offwhite px-3 py-2 text-sm text-kira-darkgray'
                      onChange={(event) => setExportMarketplace(event.target.value)}
                      value={exportMarketplace}
                    >
                      {MARKETPLACE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <select
                      className='kira-focus-ring border border-kira-warmgray/55 bg-kira-offwhite px-3 py-2 text-sm text-kira-darkgray'
                      onChange={(event) => setExportFormat(event.target.value as ExportFormat)}
                      value={exportFormat}
                    >
                      <option value='csv'>CSV</option>
                      <option value='xlsx'>XLSX</option>
                    </select>
                    <button
                      className='kira-focus-ring bg-kira-black px-4 py-2 text-sm font-semibold uppercase tracking-[0.06em] text-kira-offwhite disabled:cursor-not-allowed disabled:opacity-60'
                      disabled={isCreatingExport}
                      onClick={() => void handleCreateMarketplaceExport()}
                      type='button'
                    >
                      {isCreatingExport ? 'Generating...' : 'Generate Export'}
                    </button>
                  </div>
                  {exportError ? <p className='text-sm text-rose-700'>{exportError}</p> : null}
                </div>
              ) : (
                <div className='mt-4 space-y-3'>
                  <div className='flex items-center gap-2'>
                    <label className='text-xs uppercase tracking-[0.08em] text-kira-midgray'>Status</label>
                    <select
                      className='kira-focus-ring border border-kira-warmgray/55 bg-kira-offwhite px-3 py-2 text-xs text-kira-darkgray'
                      onChange={(event) => setExportStatusFilter(event.target.value as 'all' | ExportStatus)}
                      value={exportStatusFilter}
                    >
                      {EXPORT_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {formatExportStatusLabel(option)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {exportError ? <p className='text-sm text-rose-700'>{exportError}</p> : null}
                  {isExportHistoryLoading ? <p className='text-sm text-kira-midgray'>Loading export history...</p> : null}

                  <div className='overflow-x-auto border border-kira-warmgray/50'>
                    <table className='min-w-full text-sm'>
                      <thead className='bg-kira-warmgray/15 text-left text-xs uppercase tracking-[0.06em] text-kira-midgray'>
                        <tr>
                          <th className='px-3 py-2'>Created</th>
                          <th className='px-3 py-2'>Marketplace</th>
                          <th className='px-3 py-2'>Format</th>
                          <th className='px-3 py-2'>Status</th>
                          <th className='px-3 py-2'>Rows</th>
                          <th className='px-3 py-2'>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exportHistory.length === 0 ? (
                          <tr>
                            <td className='px-3 py-3 text-kira-midgray' colSpan={6}>
                              No exports yet.
                            </td>
                          </tr>
                        ) : (
                          exportHistory.map((record) => (
                            <tr className='border-t border-kira-warmgray/35 text-kira-black' key={record.id}>
                              <td className='px-3 py-2'>{formatDateTime(record.created_at)}</td>
                              <td className='px-3 py-2'>{record.marketplace}</td>
                              <td className='px-3 py-2 uppercase'>{record.export_format}</td>
                              <td className='px-3 py-2'>{formatExportStatusLabel(record.status)}</td>
                              <td className='px-3 py-2'>{record.row_count}</td>
                              <td className='px-3 py-2'>
                                {record.file_url ? (
                                  <button
                                    className='kira-focus-ring border border-kira-warmgray/50 px-2 py-1 text-xs text-kira-darkgray hover:bg-kira-warmgray/20'
                                    onClick={() => void handleDownloadExport(record)}
                                    type='button'
                                  >
                                    Download
                                  </button>
                                ) : (
                                  <span className='text-xs text-kira-midgray'>{record.error_message ?? '--'}</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className='mt-6 flex flex-wrap items-center justify-between gap-3'>
            <div className='flex min-w-[280px] items-center gap-2 border border-kira-warmgray/55 bg-kira-offwhite px-3 py-2 text-kira-midgray'>
              <svg aria-hidden='true' className='h-4 w-4' fill='none' viewBox='0 0 24 24'>
                <circle cx='11' cy='11' r='7' stroke='currentColor' strokeWidth='1.5' />
                <path d='M16.5 16.5L21 21' stroke='currentColor' strokeLinecap='round' strokeWidth='1.5' />
              </svg>
              <input
                className='kira-focus-ring w-full bg-transparent text-sm text-kira-black outline-none placeholder:text-kira-midgray'
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder='Search by style, name, or category'
                type='search'
                value={searchValue}
              />
            </div>

            <div className='flex flex-wrap items-center gap-3'>
              <select
                className='kira-focus-ring border border-kira-warmgray/55 bg-kira-offwhite px-4 py-2 text-sm text-kira-darkgray'
                onChange={(event) => setCategoryFilter(event.target.value)}
                value={categoryFilter}
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                className='kira-focus-ring border border-kira-warmgray/55 bg-kira-offwhite px-4 py-2 text-sm text-kira-darkgray'
                onChange={(event) => setColorFilter(event.target.value)}
                value={colorFilter}
              >
                {colorOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                className='kira-focus-ring border border-kira-warmgray/55 bg-kira-offwhite px-4 py-2 text-sm text-kira-darkgray'
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value='All Statuses'>All Statuses</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {formatStatusLabel(option)}
                  </option>
                ))}
              </select>
              <button
                className='kira-focus-ring inline-flex h-10 w-10 items-center justify-center border border-kira-warmgray/55 text-kira-darkgray hover:bg-kira-warmgray/20'
                onClick={() => {
                  setIsExportPanelOpen((open) => !open);
                  setActiveExportTab('generate');
                }}
                type='button'
              >
                <DownloadIcon />
              </button>
            </div>
          </div>

          {selectedRowIds.length > 0 ? (
            <div className='mt-4 flex flex-wrap items-center gap-3 rounded-none border border-kira-warmgray/55 bg-kira-offwhite p-3'>
              <p className='text-sm font-semibold text-kira-black'>{selectedRowIds.length} selected</p>
              <input
                className='kira-focus-ring w-28 border border-kira-warmgray/55 bg-transparent px-2 py-1 text-sm text-kira-black'
                onChange={(event) => setBulkUnitsValue(event.target.value)}
                placeholder='Units'
                value={bulkUnitsValue}
              />
              <select
                className='kira-focus-ring border border-kira-warmgray/55 bg-kira-offwhite px-3 py-1.5 text-sm text-kira-darkgray'
                onChange={(event) => setBulkStatus(event.target.value as CatalogStatus | '')}
                value={bulkStatus}
              >
                <option value=''>Bulk Status</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {formatStatusLabel(option)}
                  </option>
                ))}
              </select>
              <button
                className='kira-focus-ring bg-kira-black px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-kira-offwhite disabled:cursor-not-allowed disabled:opacity-60'
                disabled={isBulkApplying}
                onClick={() => void handleApplyBulkEdit()}
                type='button'
              >
                {isBulkApplying ? 'Applying...' : 'Apply Bulk Edit'}
              </button>
              <button
                className='kira-focus-ring border border-kira-warmgray/55 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-kira-darkgray'
                onClick={() => setSelectedRowIds([])}
                type='button'
              >
                Clear Selection
              </button>
            </div>
          ) : null}

          <div className='mt-6 overflow-x-auto border border-kira-warmgray/55'>
            <table className='min-w-full border-collapse'>
              <thead>
                <tr className='bg-kira-warmgray/20 text-left text-kira-darkgray'>
                  <th className='px-4 py-4 text-sm font-medium'>
                    <input
                      checked={allVisibleSelected}
                      className='h-4 w-4 accent-kira-black'
                      onChange={toggleSelectAllVisible}
                      type='checkbox'
                    />
                  </th>
                  <th className='px-4 py-4 text-sm font-medium uppercase tracking-[0.06em]'>Image</th>
                  <th className='px-4 py-4 text-sm font-medium uppercase tracking-[0.06em]'>Style No</th>
                  <th className='px-4 py-4 text-sm font-medium uppercase tracking-[0.06em]'>Style Name</th>
                  <th className='px-4 py-4 text-sm font-medium uppercase tracking-[0.06em]'>Category</th>
                  <th className='px-4 py-4 text-sm font-medium uppercase tracking-[0.06em]'>Color</th>
                  <th className='px-4 py-4 text-sm font-medium uppercase tracking-[0.06em]'>Fabric</th>
                  <th className='px-4 py-4 text-sm font-medium uppercase tracking-[0.06em]'>Units</th>
                  <th className='px-4 py-4 text-sm font-medium uppercase tracking-[0.06em]'>Price</th>
                  <th className='px-4 py-4 text-sm font-medium uppercase tracking-[0.06em]'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCatalogRows.map((row) => (
                  <tr className='border-t border-kira-warmgray/45' key={row.id}>
                    <td className='px-4 py-4'>
                      <input
                        checked={selectedIdSet.has(row.id)}
                        className='h-4 w-4 accent-kira-black'
                        onChange={() => toggleRowSelection(row.id)}
                        type='checkbox'
                      />
                    </td>
                    <td className='px-4 py-4'>
                      <div className='flex h-14 w-14 items-center justify-center bg-kira-warmgray/15 text-sm font-semibold text-kira-darkgray overflow-hidden'>
                        {row.primary_image_url ? (
                          <img
                            src={getImageUrl(row.primary_image_url) ?? ''}
                            alt=""
                            className='h-full w-full object-cover'
                          />
                        ) : (
                          (row.imageName ?? row.name).slice(0, 1).toUpperCase()
                        )}
                      </div>
                    </td>
                    <td className='px-4 py-4 text-kira-black'>{row.styleNo}</td>
                    <td className='px-4 py-4 text-kira-black'>{row.name}</td>
                    <td className='px-4 py-4'>
                      <span className='inline-flex bg-kira-warmgray/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-kira-darkgray'>
                        {normalizeCategory(row.category)}
                      </span>
                    </td>
                    <td className='px-4 py-4 text-kira-black'>
                      <span className='inline-flex items-center gap-2'>
                        <span className='h-3 w-3 rounded-full' style={{ backgroundColor: colorDot(row.color) }} />
                        {row.color}
                      </span>
                    </td>
                    <td className='px-4 py-4 text-kira-black'>{row.fabric}</td>
                    <td className='px-4 py-4 text-kira-black'>
                      <input
                        className='kira-focus-ring w-16 border border-kira-warmgray/50 bg-transparent px-2 py-1 text-sm text-kira-black'
                        onChange={(event) => handleInlineUnitsChange(row.id, event.target.value)}
                        type='text'
                        value={row.units}
                      />
                    </td>
                    <td className='px-4 py-4 text-kira-black'>
                      <div className='inline-flex items-center gap-1 border border-kira-warmgray/50 px-2 py-1'>
                        <span className='text-xs text-kira-midgray'>SAR</span>
                        <input
                          className='kira-focus-ring w-16 bg-transparent text-sm text-kira-black'
                          onChange={(event) => handleInlinePriceChange(row.id, event.target.value)}
                          type='text'
                          value={row.price.replace('SAR', '').trim()}
                        />
                      </div>
                    </td>
                    <td className='px-4 py-4'>
                      <div className='flex items-center gap-3 text-kira-midgray'>
                        <button
                          className='kira-focus-ring inline-flex h-7 w-7 items-center justify-center hover:text-kira-black'
                          onClick={() => handleEditRow(row)}
                          type='button'
                        >
                          <PencilIcon />
                        </button>
                        <button
                          className='kira-focus-ring inline-flex h-7 w-7 items-center justify-center hover:text-kira-black'
                          onClick={() => handleDeleteRow(row)}
                          type='button'
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCatalogRows.length === 0 ? (
                  <tr>
                    <td className='px-4 py-8 text-center text-sm text-kira-midgray' colSpan={10}>
                      {isCatalogLoading ? 'Loading catalog rows...' : 'No catalog rows match current filters.'}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </DashboardShell>

      {isBulkUploadOpen ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='kira-modal-open w-full max-w-[850px] border border-kira-warmgray/50 bg-[#FAFAFA] shadow-2xl transition-all duration-300'>
            <div className='flex items-center justify-between border-b border-kira-warmgray/50 px-6 py-5'>
              <h2 className='font-serif text-[28px] font-semibold text-kira-black tracking-tight'>Bulk Upload</h2>
              <button
                className='kira-focus-ring inline-flex h-9 w-9 items-center justify-center text-kira-midgray hover:text-kira-black transition-colors'
                onClick={() => setIsBulkUploadOpen(false)}
                type='button'
              >
                <CloseIcon />
              </button>
            </div>

            {uploadItems.length === 0 ? (
              <div className="p-8">
                <input
                  accept='.jpg,.jpeg,.png,.webp'
                  className='hidden'
                  multiple
                  onChange={handleBulkFileInput}
                  ref={fileInputRef}
                  type='file'
                />

                <div
                  className={cn(
                    'cursor-pointer border-[1.5px] border-dashed py-24 text-center transition-all duration-200 flex flex-col items-center justify-center',
                    isDropActive
                      ? 'border-kira-brown bg-kira-brown/5'
                      : 'border-[#D9D9D9] hover:border-kira-midgray hover:bg-black/[0.02]',
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={(e) => { e.preventDefault(); setIsDropActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDropActive(false); }}
                  onDragOver={(e) => { e.preventDefault(); setIsDropActive(true); }}
                  onDrop={handleBulkDrop}
                >
                  <div className="w-14 h-14 mb-4 flex items-center justify-center text-[#9CA3AF]">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" fill="currentColor" />
                    </svg>
                  </div>
                  <p className="text-[#111827] font-medium text-[15px] mb-1">Drag & drop multiple images</p>
                  <p className="text-[#6B7280] text-[13px]">or click to select • PNG, JPG up to 10MB each</p>
                </div>

                {uploadMessage ? (
                  <p className='mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 text-center'>{uploadMessage}</p>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col h-[65vh]">
                <div className="flex-1 overflow-y-auto px-6 py-6 border-b border-kira-warmgray/50">

                  {/* Common Settings Box */}
                  <div className="border border-[#E5E7EB] bg-white mb-8">
                    <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#6B7280]">
                        <path d="M12 2L2 7l10 5 10-5-10-5zm0 13.5l-10-5v3.5l10 5 10-5v-3.5l-10 5z" fill="currentColor" />
                      </svg>
                      <span className="text-xs font-semibold tracking-wider text-[#6B7280]">COMMON SETTINGS (APPLIED TO ALL ITEMS)</span>
                    </div>

                    <div className="px-5 py-6 flex gap-12">
                      <div className="flex gap-8">
                        <div>
                          <span className="text-[11px] text-[#9CA3AF] mr-3">Composition</span>
                          <select
                            className="bg-transparent text-sm text-[#111827] border-b border-[#E5E7EB] pb-2 outline-none w-36 cursor-pointer"
                            value={bulkComposition}
                            onChange={(e) => setBulkComposition(e.target.value)}
                          >
                            <option>100% Polyester</option>
                            <option>100% Cotton</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[11px] text-[#9CA3AF] mr-3">Woven/Knits</span>
                          <select
                            className="bg-transparent text-sm text-[#111827] border-b border-[#E5E7EB] pb-2 outline-none w-24 cursor-pointer"
                            value={bulkWovenKnits}
                            onChange={(e) => setBulkWovenKnits(e.target.value)}
                          >
                            <option>Woven</option>
                            <option>Knits</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-10 border-l border-[#E5E7EB] pl-10">
                        <div>
                          <span className="text-[11px] text-[#9CA3AF] block mb-2">PO Price</span>
                          <input
                            type="text"
                            value={bulkPoPrice}
                            onChange={(e) => setBulkPoPrice(e.target.value)}
                            className="bg-transparent text-sm text-[#111827] border-b border-[#E5E7EB] pb-2 outline-none w-24"
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-[#9CA3AF] block mb-2">OSPs SAR</span>
                          <input
                            type="text"
                            value={bulkOspSar}
                            onChange={(e) => setBulkOspSar(e.target.value)}
                            className="bg-transparent text-sm text-[#111827] border-b border-[#E5E7EB] pb-2 outline-none w-24"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-[15px] text-[#6B7280]">{uploadItems.length} images selected</h3>
                    <button
                      className="bg-[#D4AF37] hover:bg-[#B8962A] text-white px-5 py-2.5 text-xs font-bold tracking-wider rounded-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                      onClick={() => void handleAnalyzeAll()}
                      disabled={isBulkAnalyzing || uploadItems.length === 0}
                    >
                      {isBulkAnalyzing ? (
                        <i className="ri-loader-4-line text-sm animate-spin"></i>
                      ) : (
                        <i className="ri-brain-line text-sm"></i>
                      )}
                      {isBulkAnalyzing ? 'ANALYZING...' : 'ANALYZE ALL WITH AI'}
                    </button>
                  </div>

                  <div className="space-y-[2px] bg-[#E5E7EB] border border-[#E5E7EB]">
                    {uploadItems.map((item, idx) => (
                      <div key={item.id} className="bg-white p-4 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="w-[100px] h-[100px] bg-[#E5E7EB] flex items-center justify-center text-[#9CA3AF] overflow-hidden">
                            {item.previewUrl ? (
                              <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <i className="ri-image-line text-2xl"></i>
                            )}
                          </div>
                          <span className="font-medium text-[#111827] text-[15px]">{item.name}</span>
                        </div>

                        <div className="flex flex-col items-center gap-1 text-[#6B7280]">
                          {item.status === 'queued' ? (
                            <>
                              <i className="ri-time-line text-base"></i>
                              <span className="text-xs">In queue</span>
                            </>
                          ) : item.status === 'uploading' ? (
                            <>
                              <i className="ri-loader-4-line text-base animate-spin text-kira-brown"></i>
                              <span className="text-xs text-kira-brown">{item.progress}%</span>
                            </>
                          ) : item.status === 'completed_local' ? (
                            <>
                              <i className="ri-checkbox-circle-line text-base text-[#64748B]"></i>
                              <span className="text-xs text-[#64748B]">Ready</span>
                            </>
                          ) : (
                            <>
                              <i className="ri-check-line text-base text-[#1E7145]"></i>
                              <span className="text-xs text-[#1E7145]">Done</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                <div className='flex justify-end gap-3 px-6 py-5 bg-white border-t border-[#E5E7EB]'>
                  <button
                    className='border border-[#D1D5DB] bg-white px-8 py-3 text-xs font-bold tracking-widest text-[#111827] hover:bg-gray-50 transition-colors'
                    onClick={() => setIsBulkUploadOpen(false)}
                    type='button'
                  >
                    CANCEL
                  </button>
                  <button
                    className='bg-[#111827] hover:bg-black text-white px-8 py-3 text-xs font-bold tracking-widest flex items-center gap-2 transition-colors disabled:opacity-50'
                    disabled={isBulkAnalyzing || uploadItems.length === 0}
                    onClick={() => void handleSaveAllToCatalog()}
                    type='button'
                  >
                    <i className="ri-add-line text-sm leading-none"></i>
                    SAVE ALL TO CATALOG
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {isAddModalOpen ? (
        <div className='fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 md:p-6'>
          <div className='kira-modal-open mx-auto my-2 w-full max-w-[1180px] border border-kira-warmgray/50 bg-kira-offwhite shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(6,6,6,0.24)]'>
            <div className='sticky top-0 z-20 flex items-center justify-between border-b border-kira-warmgray/50 bg-kira-offwhite px-5 py-4'>
              <div className="flex items-center gap-4">
                <h2 className='font-serif text-3xl font-semibold'>{isEditMode ? 'Edit Item' : 'Add New Item'}</h2>
                <label className="flex items-center gap-3 text-sm font-medium text-[#6D7772] cursor-pointer ml-4 select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={rememberLastValues}
                      onChange={(e) => {
                        setRememberLastValues(e.target.checked);
                        localStorage.setItem('kira_remember_last_values', String(e.target.checked));
                      }}
                    />
                    <div className="w-9 h-5 bg-[#C59B8D]/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1E7145]"></div>
                  </div>
                  Remember last values
                </label>
              </div>
              <button
                className='kira-focus-ring inline-flex h-9 w-9 items-center justify-center text-kira-midgray hover:text-kira-black'
                onClick={closeAddModal}
                type='button'
              >
                <CloseIcon />
              </button>
            </div>

            <form className='flex max-h-[calc(100vh-5rem)] flex-col' onSubmit={handleSaveNewItem}>
              <div className='flex-1 overflow-y-auto px-5 py-5'>
                <div className='grid grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,1fr)]'>
                <div className='space-y-3'>
                  <input
                    accept='.png,.jpg,.jpeg,.webp'
                    className='hidden'
                    onChange={handleAddItemImageInput}
                    ref={addItemImageInputRef}
                    type='file'
                  />

                  {imagePreviewUrl ? (
                    <>
                      <div className="relative w-full aspect-square overflow-hidden border border-kira-warmgray/40 bg-kira-warmgray/10">
                        <img
                          src={getImageUrl(imagePreviewUrl) ?? ''}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreviewUrl(null);
                            selectedImageFileRef.current = null;
                            setItemImageName('');
                            setAnalysisStage(null);
                            setAiSuggestions(null);
                            setIsAiSuggestionsVisible(false);
                            setFeedbackCompletedFields({});
                            setOverallConfidence(null);
                            setFieldConfidence({});
                            setFieldContext({});
                            setLastAnalyzedImageHash(null);
                            if (addItemImageInputRef.current) {
                              addItemImageInputRef.current.value = '';
                            }
                          }}
                          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center bg-white/90 text-kira-black hover:bg-white"
                        >
                          <CloseIcon />
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleAnalyzeImage(); }}
                          disabled={isAnalyzing}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 rounded-none border border-kira-black bg-kira-black py-2.5 text-sm font-semibold uppercase text-kira-offwhite hover:bg-kira-darkgray",
                            isAnalyzing && "opacity-70 cursor-not-allowed"
                          )}
                        >
                          {isAnalyzing ? (
                            <>
                              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Analyzing...
                            </>
                          ) : (
                            "Analyze with AI"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => addItemImageInputRef.current?.click()}
                          className="flex h-10 w-10 items-center justify-center border border-kira-warmgray/60 bg-kira-offwhite text-kira-darkgray hover:bg-kira-warmgray/20"
                        >
                          <UploadIcon />
                        </button>
                      </div>

                      {analysisStage ? <p className="text-xs text-kira-midgray">{analysisStage}</p> : null}
                      {itemImageError ? <p className='text-sm text-rose-700'>{itemImageError}</p> : null}

                      {isAiSuggestionsVisible && aiSuggestions && (
                        <div className="relative mt-4 max-h-[420px] overflow-y-auto border border-[#BEE7D3] bg-[#F1FBF6] px-5 py-4 text-kira-black">
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2 font-semibold text-[#1E7145]">
                              <i className="ri-sparkling-fill text-lg"></i>
                              <span className="text-[15px]">AI Suggestions</span>
                            </div>
                            <button
                              type="button"
                              onClick={handleAcceptAllAI}
                              className="kira-focus-ring bg-[#219653] hover:bg-[#1A7A43] text-white px-3 py-1.5 rounded-sm text-xs font-semibold tracking-wider flex items-center gap-1.5 transition-colors"
                            >
                              <i className="ri-check-line text-sm"></i> Accept All
                            </button>
                          </div>

                          <div className="space-y-0.5 mb-5">
                            <AiSuggestionRow
                              fieldKey="color"
                              label="Color"
                              value={aiSuggestions.values.color}
                              confidence={aiSuggestions.confidence.color}
                              onFeedback={handleSuggestionFeedback}
                              isSubmitting={isFeedbackSubmitting}
                              isFeedbackLocked={Boolean(feedbackCompletedFields.color)}
                            />
                            <AiSuggestionRow
                              fieldKey="category"
                              label="Category"
                              value={aiSuggestions.values.category}
                              confidence={aiSuggestions.confidence.category}
                              onFeedback={handleSuggestionFeedback}
                              isSubmitting={isFeedbackSubmitting}
                              isFeedbackLocked={Boolean(feedbackCompletedFields.category)}
                            />
                            <AiSuggestionRow
                              fieldKey="styleName"
                              label="Style Name"
                              value={aiSuggestions.values.styleName}
                              confidence={aiSuggestions.confidence.styleName}
                              onFeedback={handleSuggestionFeedback}
                              isSubmitting={isFeedbackSubmitting}
                              isFeedbackLocked={Boolean(feedbackCompletedFields.styleName)}
                            />
                            <AiSuggestionRow
                              fieldKey="fabric"
                              label="Fabric"
                              value={aiSuggestions.values.fabric}
                              confidence={aiSuggestions.confidence.fabric}
                              onFeedback={handleSuggestionFeedback}
                              isSubmitting={isFeedbackSubmitting}
                              isFeedbackLocked={Boolean(feedbackCompletedFields.fabric)}
                            />
                            <AiSuggestionRow
                              fieldKey="composition"
                              label="Composition"
                              value={aiSuggestions.values.composition}
                              confidence={aiSuggestions.confidence.composition}
                              onFeedback={handleSuggestionFeedback}
                              isSubmitting={isFeedbackSubmitting}
                              isFeedbackLocked={Boolean(feedbackCompletedFields.composition)}
                            />
                            <AiSuggestionRow
                              fieldKey="wovenKnits"
                              label="Woven Knits"
                              value={aiSuggestions.values.wovenKnits}
                              confidence={aiSuggestions.confidence.wovenKnits}
                              onFeedback={handleSuggestionFeedback}
                              isSubmitting={isFeedbackSubmitting}
                              isFeedbackLocked={Boolean(feedbackCompletedFields.wovenKnits)}
                            />
                          </div>

                          <p className="mb-4 text-xs text-[#6D7772]">
                            Manual overrides and feedback help AI learn your catalog standards.
                          </p>

                          {lowConfidenceFields.length > 0 ? (
                            <div className="mb-4 border border-[#DCEADF] bg-white px-3 py-3">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4A5D52]">
                                  Similar Items Helper
                                </p>
                                <span className="text-[11px] text-[#6D7772]">
                                  Low confidence: {lowConfidenceFields.map((field) => AI_FIELD_LABELS[field]).join(', ')}
                                </span>
                              </div>
                              {similarItems.length === 0 ? (
                                <p className="mt-2 text-xs text-[#6D7772]">No close matches found in current catalog.</p>
                              ) : (
                                <div className="mt-3 space-y-2">
                                  {similarItems.map((item) => (
                                    <div className="flex items-center justify-between border border-[#E5E7EB] px-2 py-2" key={item.id}>
                                      <div className="text-xs text-kira-darkgray">
                                        <p className="font-semibold">{item.styleNo}</p>
                                        <p>{item.color} • {item.fabric} • {item.composition}</p>
                                      </div>
                                      <button
                                        type="button"
                                        className="kira-focus-ring border border-kira-warmgray/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-kira-darkgray hover:bg-kira-warmgray/20"
                                        onClick={() => applySimilarItemDefaults(item)}
                                      >
                                        Inherit Values
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : null}

                          <div className="mb-2 border border-[#E5E7EB] bg-white px-3 py-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-[#6D7772]">
                                Seasonal recommendation: {seasonalRecommendation.season} defaults
                              </p>
                              <button
                                type="button"
                                className="kira-focus-ring text-[10px] font-semibold uppercase tracking-[0.06em] text-kira-black hover:text-kira-midgray"
                                onClick={applySeasonalDefaults}
                              >
                                Apply
                              </button>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-[#BEE7D3] flex items-center justify-between">
                            <span className="text-[13px] text-[#6D7772]">Overall Confidence</span>
                            <span className="font-bold text-[#1E7145] text-base">{overallConfidence}%</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      className={cn(
                        'flex min-h-[300px] cursor-pointer flex-col items-center justify-center border-2 border-dashed p-4 text-center',
                        isItemDropActive
                          ? 'border-kira-brown bg-kira-brown/10'
                          : 'border-kira-warmgray/60 bg-kira-offwhite',
                      )}
                      onClick={() => addItemImageInputRef.current?.click()}
                      onDragEnter={(event) => {
                        event.preventDefault();
                        setIsItemDropActive(true);
                      }}
                      onDragLeave={(event) => {
                        event.preventDefault();
                        setIsItemDropActive(false);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsItemDropActive(true);
                      }}
                      onDrop={handleAddItemDrop}
                    >
                      <UploadIcon />
                      <p className='mt-4 text-xl font-semibold text-kira-black'>
                        Click to upload <span className='font-normal text-kira-midgray'>or drag and drop</span>
                      </p>
                      <p className='mt-2 text-base text-kira-midgray'>PNG, JPG up to 10MB</p>
                      {itemImageError ? <p className='mt-2 text-sm text-rose-700'>{itemImageError}</p> : null}
                    </div>
                  )}
                </div>

                <div className='grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='col-span-1 md:col-span-2 space-y-2 border-b border-kira-warmgray/30 pb-4'>
                    <div className="flex items-center justify-between">
                      <FieldLabel>Style No</FieldLabel>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await apiRequest<{ style_code: string }>('/catalog/generate-style-code', {
                              method: 'POST',
                              body: JSON.stringify({ brand: 'GEN', category: itemCategory }) // Pass basic context
                            });
                            setItemStyleNo(res.style_code);
                            setCatalogNotice('Style No generated.');
                          } catch (e: any) {
                            setAddItemError(e.message || 'Failed to generate Style No.');
                          }
                        }}
                        className="text-xs font-semibold uppercase tracking-wider text-kira-black hover:text-kira-midgray flex items-center gap-1"
                      >
                        <i className="ri-magic-line"></i> Auto-Generate
                      </button>
                    </div>
                    <input
                      className='kira-focus-ring w-full border-0 border-b border-kira-warmgray/70 bg-transparent px-0 pb-2 pt-1 text-2xl font-bold text-kira-black outline-none placeholder:font-normal placeholder:text-kira-midgray'
                      onChange={(event) => setItemStyleNo(event.target.value)}
                      placeholder='e.g., HRDS25001'
                      required
                      value={itemStyleNo}
                    />
                  </div>
                  <div className='space-y-2'>
                    <FieldLabel confidence={fieldConfidence.category} context={fieldContext.category}>Category</FieldLabel>
                    <select
                      className='kira-focus-ring w-full border-0 border-b border-kira-warmgray/70 bg-transparent px-0 pb-2 pt-1 text-xl text-kira-black outline-none'
                      onChange={(event) => setItemCategory(event.target.value)}
                      value={itemCategory}
                    >
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='space-y-2'>
                    <FieldLabel confidence={fieldConfidence.styleName} context={fieldContext.styleName}>Style Name</FieldLabel>
                    <select
                      className='kira-focus-ring w-full border-0 border-b border-kira-warmgray/70 bg-transparent px-0 pb-2 pt-1 text-xl text-kira-black outline-none'
                      onChange={(event) => setItemStyleName(event.target.value)}
                      value={itemStyleName}
                    >
                      {STYLE_NAME_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='space-y-2'>
                    <FieldLabel confidence={fieldConfidence.color} context={fieldContext.color}>Color</FieldLabel>
                    <select
                      className='kira-focus-ring w-full border-0 border-b border-kira-warmgray/70 bg-transparent px-0 pb-2 pt-1 text-xl text-kira-black outline-none'
                      onChange={(event) => setItemColor(event.target.value)}
                      value={itemColor}
                    >
                      {COLOR_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='space-y-2'>
                    <FieldLabel confidence={fieldConfidence.fabric} context={fieldContext.fabric}>Fabric</FieldLabel>
                    <select
                      className='kira-focus-ring w-full border-0 border-b border-kira-warmgray/70 bg-transparent px-0 pb-2 pt-1 text-xl text-kira-black outline-none'
                      onChange={(event) => setItemFabric(event.target.value)}
                      value={itemFabric}
                    >
                      {FABRIC_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='space-y-2'>
                    <FieldLabel confidence={fieldConfidence.composition} context={fieldContext.composition}>Composition</FieldLabel>
                    <select
                      className='kira-focus-ring w-full border-0 border-b border-kira-warmgray/70 bg-transparent px-0 pb-2 pt-1 text-xl text-kira-black outline-none'
                      onChange={(event) => setItemComposition(event.target.value)}
                      value={itemComposition}
                    >
                      {COMPOSITION_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='space-y-2'>
                    <FieldLabel confidence={fieldConfidence.wovenKnits} context={fieldContext.wovenKnits}>Woven / Knits</FieldLabel>
                    <select
                      className='kira-focus-ring w-full border-0 border-b border-kira-warmgray/70 bg-transparent px-0 pb-2 pt-1 text-xl text-kira-black outline-none'
                      onChange={(event) => setItemWovenKnits(event.target.value)}
                      value={itemWovenKnits}
                    >
                      {WOVEN_KNITS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='space-y-2'>
                    <FieldLabel>Total Units</FieldLabel>
                    <select
                      className='kira-focus-ring w-full border-0 border-b border-kira-warmgray/70 bg-transparent px-0 pb-2 pt-1 text-xl text-kira-black outline-none'
                      onChange={(event) => setItemTotalUnits(event.target.value)}
                      value={itemTotalUnits}
                    >
                      {TOTAL_UNITS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='space-y-2'>
                    <FieldLabel>PO Price</FieldLabel>
                    <select
                      className='kira-focus-ring w-full border-0 border-b border-kira-warmgray/70 bg-transparent px-0 pb-2 pt-1 text-xl text-kira-black outline-none'
                      onChange={(event) => setItemPoPrice(event.target.value)}
                      value={itemPoPrice}
                    >
                      {PO_PRICE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='space-y-2'>
                    <FieldLabel>OSPS in SAR</FieldLabel>
                    <select
                      className='kira-focus-ring w-full border-0 border-b border-kira-warmgray/70 bg-transparent px-0 pb-2 pt-1 text-xl text-kira-black outline-none'
                      onChange={(event) => setItemOspSar(event.target.value)}
                      value={itemOspSar}
                    >
                      {OSP_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                </div>

                {addItemError ? (
                  <p className='mt-5 rounded-md bg-kira-warmgray/20 px-3 py-2 text-sm text-kira-black'>{addItemError}</p>
                ) : null}
              </div>

              <div className='flex justify-end gap-3 border-t border-kira-warmgray/50 bg-kira-offwhite px-5 py-4'>
                <button
                  className='kira-focus-ring border border-kira-warmgray/60 bg-kira-offwhite px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.06em] text-kira-darkgray'
                  onClick={closeAddModal}
                  type='button'
                >
                  Cancel
                </button>
                <button
                  className='kira-focus-ring inline-flex items-center gap-2 bg-kira-black px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.06em] text-kira-offwhite'
                  disabled={isSavingItem}
                  type='submit'
                >
                  <PlusIcon />
                  {isSavingItem ? 'Saving...' : 'Save to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isCorrectionModalOpen && correctionFieldKey ? (
        <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4'>
          <div className='w-full max-w-[460px] border border-kira-warmgray/60 bg-kira-offwhite p-5 shadow-2xl'>
            <div className='flex items-start justify-between gap-4 border-b border-kira-warmgray/50 pb-3'>
              <div>
                <h3 className='font-serif text-2xl font-semibold text-kira-black'>Correction Feedback</h3>
                <p className='mt-1 text-sm text-kira-midgray'>
                  Tell AI why <span className='font-semibold text-kira-black'>{AI_FIELD_LABELS[correctionFieldKey]}</span> was incorrect.
                </p>
              </div>
              <button
                type='button'
                className='kira-focus-ring inline-flex h-8 w-8 items-center justify-center text-kira-midgray hover:text-kira-black'
                onClick={() => setIsCorrectionModalOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>
            <form className='mt-4 space-y-4' onSubmit={handleSubmitCorrectionModal}>
              <div>
                <label className='text-xs font-semibold uppercase tracking-[0.08em] text-kira-midgray'>Reason</label>
                <select
                  className='kira-focus-ring mt-1 w-full border border-kira-warmgray/55 bg-kira-offwhite px-3 py-2 text-sm text-kira-darkgray'
                  value={correctionReasonCode}
                  onChange={(event) => setCorrectionReasonCode(event.target.value)}
                >
                  {CORRECTION_REASON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='text-xs font-semibold uppercase tracking-[0.08em] text-kira-midgray'>
                  Details (helps AI learn)
                </label>
                <textarea
                  className='kira-focus-ring mt-1 min-h-[100px] w-full border border-kira-warmgray/55 bg-kira-offwhite px-3 py-2 text-sm text-kira-black'
                  placeholder='What should AI look at next time?'
                  value={correctionNotes}
                  onChange={(event) => setCorrectionNotes(event.target.value)}
                />
              </div>
              <div className='flex justify-end gap-3 border-t border-kira-warmgray/45 pt-3'>
                <button
                  type='button'
                  className='kira-focus-ring border border-kira-warmgray/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-kira-darkgray'
                  onClick={() => setIsCorrectionModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isFeedbackSubmitting}
                  className='kira-focus-ring bg-kira-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-kira-offwhite disabled:opacity-60'
                >
                  {isFeedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
