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

const MAX_BULK_FILES_PER_BATCH = 20;
const MAX_BULK_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_ITEM_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_TECHPACK_FILE_SIZE_BYTES = 12 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_TECHPACK_TYPES = ['application/pdf'];

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

interface CatalogProduct {
  id: string;
  sku: string;
  title: string;
  category: string | null;
  color?: string | null;
  primary_image_url?: string | null;
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
}

interface ProductImageResponse {
  id: string;
  file_name: string;
  file_url: string;
  processing_status: string;
}

interface TechPackMeasurement {
  measurement_key: string;
  measurement_value: number;
  unit: string;
  confidence_score?: number | null;
  needs_review?: boolean;
  notes?: string | null;
}

interface TechPackResult {
  measurements?: TechPackMeasurement[];
  validation_flags?: string[];
  extracted_count?: number;
  ocr_text_preview?: string;
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

function FieldLabel({ children }: { children: string }): JSX.Element {
  return <label className='text-sm uppercase tracking-[0.08em] text-kira-midgray'>{children}</label>;
}

export function CatalogView(): JSX.Element {
  const [catalogRows, setCatalogRows] = useState<CatalogRow[]>(sampleCatalogRows);
  const [catalogNotice, setCatalogNotice] = useState<string | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);

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
  const [selectedTechPackProductId, setSelectedTechPackProductId] = useState('');
  const [techPackFileName, setTechPackFileName] = useState('');
  const [techPackError, setTechPackError] = useState<string | null>(null);
  const [isTechPackAnalyzing, setIsTechPackAnalyzing] = useState(false);
  const [techPackResult, setTechPackResult] = useState<TechPackResult | null>(null);
  const [exportHistory, setExportHistory] = useState<MarketplaceExportRecord[]>([]);
  const [isExportHistoryLoading, setIsExportHistoryLoading] = useState(false);
  const [isCreatingExport, setIsCreatingExport] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportMarketplace, setExportMarketplace] = useState<string>(MARKETPLACE_OPTIONS[0]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
  const [exportStatusFilter, setExportStatusFilter] = useState<'all' | ExportStatus>('all');
  const [isExportPanelOpen, setIsExportPanelOpen] = useState(false);
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const techPackInputRef = useRef<HTMLInputElement | null>(null);
  const queueRef = useRef<UploadItem[]>([]);
  const queueRunningRef = useRef(false);
  const selectedUploadProductIdRef = useRef('');
  const selectedTechPackFileRef = useRef<File | null>(null);
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
        return;
      }

      setIsCatalogLoading(true);
      try {
        const response = await apiRequest<CatalogListResponse>('/catalog/products?limit=50');
        if (!mounted) return;

        if (response.items.length === 0) {
          setCatalogNotice('No catalog records yet. Showing sample data.');
          setCatalogRows(sampleCatalogRows);
          return;
        }

        const mappedRows: CatalogRow[] = response.items.map((item) => ({
          id: item.id,
          primary_image_url: getImageUrl(item.primary_image_url) ?? undefined,
          styleNo: item.sku,
          name: item.title,
          category: normalizeCategory(item.category),
          color: item.color ?? 'Blue',
          fabric: 'Poly Georgette',
          composition: '100% Polyester',
          wovenKnits: 'Woven',
          units: '24',
          poPrice: '600',
          price: 'SAR 95',
          status: item.status,
          persisted: true,
        }));
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

  useEffect(() => {
    if (!selectedTechPackProductId && persistedProducts.length > 0) {
      const first = persistedProducts[0];
      if (first) setSelectedTechPackProductId(first.id);
    }
  }, [selectedTechPackProductId, persistedProducts]);

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

    const selectedId = selectedUploadProductIdRef.current;
    const canPersist =
      hasAccessToken() &&
      selectedId !== '' &&
      persistedProductsRef.current.some((product) => product.id === selectedId);

    if (canPersist) {
      try {
        const file = item.file;
        if (!file) {
          throw new Error('File data missing for upload.');
        }

        const formData = new FormData();
        formData.append('file', file);

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
          headers.Authorization = `Bearer ${decodeURIComponent(accessToken)}`;
        }

        const uploadRes = await fetch(`${normalizedApiUrl}/uploads/`, {
          method: 'POST',
          headers,
          body: formData,
        });
        if (!uploadRes.ok) {
          const uploadMessage = await uploadRes.text();
          throw new Error(uploadMessage || 'Upload API failed.');
        }
        const uploadData = (await uploadRes.json()) as { url: string; filename: string };
        const baseUrl = normalizedApiUrl.replace('/api/v1', '').replace(/\/+$/, '');
        const fullImageUrl = uploadData.url.startsWith('/static')
          ? `${baseUrl}${uploadData.url}`
          : uploadData.url;

        await apiRequest(`/catalog/products/${selectedId}/images`, {
          method: 'POST',
          body: JSON.stringify({
            file_name: uploadData.filename,
            file_url: fullImageUrl,
            mime_type: item.type,
            file_size_bytes: item.size,
            processing_status: 'uploaded',
          }),
        });
        setCatalogRows((rows) =>
          rows.map((row) => (row.id === selectedId ? { ...row, primary_image_url: fullImageUrl } : row)),
        );
        updateUploadItem(item.id, (current) => ({ ...current, status: 'completed', progress: 100 }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'API upload failed.';
        updateUploadItem(item.id, (current) => ({
          ...current,
          status: 'failed',
          progress: 100,
          error: message,
        }));
      }
      return;
    }

    updateUploadItem(item.id, (current) => ({ ...current, status: 'completed_local', progress: 100 }));
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

  function handleTechPackFileInput(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null;
    event.currentTarget.value = '';
    setTechPackError(null);
    setTechPackResult(null);
    if (!file) {
      selectedTechPackFileRef.current = null;
      setTechPackFileName('');
      return;
    }
    if (!ALLOWED_TECHPACK_TYPES.includes(file.type)) {
      setTechPackError('Only PDF files are allowed for tech-pack OCR.');
      return;
    }
    if (file.size > MAX_TECHPACK_FILE_SIZE_BYTES) {
      setTechPackError(`Tech-pack exceeds ${formatBytes(MAX_TECHPACK_FILE_SIZE_BYTES)}.`);
      return;
    }
    selectedTechPackFileRef.current = file;
    setTechPackFileName(file.name);
  }

  async function handleAnalyzeTechPack(): Promise<void> {
    setTechPackError(null);
    if (!hasAccessToken()) {
      setTechPackError('You must be signed in to run tech-pack OCR.');
      return;
    }
    if (!selectedTechPackProductId) {
      setTechPackError('Select a catalog product first.');
      return;
    }
    if (!selectedTechPackFileRef.current) {
      setTechPackError('Select a PDF tech-pack first.');
      return;
    }

    setIsTechPackAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedTechPackFileRef.current);

      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const normalizedApiUrl = rawApiUrl.endsWith('/api/v1')
        ? rawApiUrl
        : `${rawApiUrl.replace(/\/+$/, '')}/api/v1`;
      const baseUrl = normalizedApiUrl.replace('/api/v1', '').replace(/\/+$/, '');

      const uploadRes = await fetch(`${normalizedApiUrl}/uploads/tech-pack`, {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) {
        const message = await uploadRes.text();
        throw new Error(message || 'Failed to upload tech-pack.');
      }
      const uploadData = (await uploadRes.json()) as { url: string; filename: string };
      const techpackUrl = uploadData.url.startsWith('/static') ? `${baseUrl}${uploadData.url}` : uploadData.url;

      const job = await apiRequest<{ id: string; status: string }>(`/catalog/jobs`, {
        method: 'POST',
        body: JSON.stringify({
          job_type: 'techpack_ocr',
          product_id: selectedTechPackProductId,
          input_ref: techpackUrl,
          payload: {
            techpack_url: techpackUrl,
            file_name: uploadData.filename,
          },
        }),
      });

      let finalResult: TechPackResult | null = null;
      for (let attempts = 0; attempts < 45; attempts += 1) {
        await wait(1000);
        const jobStatus = await apiRequest<{ status: string; result: TechPackResult; error_message?: string }>(
          `/catalog/jobs/${job.id}`,
        );
        if (jobStatus.status === 'completed') {
          finalResult = jobStatus.result;
          break;
        }
        if (jobStatus.status === 'failed') {
          throw new Error(jobStatus.error_message || 'Tech-pack OCR job failed.');
        }
      }

      if (!finalResult) {
        throw new Error('Tech-pack OCR timed out. Try again.');
      }

      setTechPackResult(finalResult);
      const hasFlags = (finalResult.validation_flags?.length ?? 0) > 0;
      setCatalogRows((rows) =>
        rows.map((row) =>
          row.id === selectedTechPackProductId ? { ...row, status: hasFlags ? 'needs_review' : 'ready' } : row,
        ),
      );
      setCatalogNotice(
        hasFlags
          ? 'Tech-pack OCR completed with validation flags. Review extracted measurements.'
          : 'Tech-pack OCR completed. Measurements extracted successfully.',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to process tech-pack OCR.';
      setTechPackError(message);
    } finally {
      setIsTechPackAnalyzing(false);
    }
  }

  async function handleEditRow(row: CatalogRow): Promise<void> {
    setAddItemError(null);
    setItemImageError(null);
    
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
    setAddItemError(null);
    setItemImageError(null);
    setImagePreviewUrl(null); // Reset preview
    selectedImageFileRef.current = null;
    setEditingRowId(null);
    setPendingAnalyzeProductId(null);
    setItemImageName('');
    setItemStyleNo('');
    setItemCategory(CATEGORY_OPTIONS[0]);
    setItemStyleName(STYLE_NAME_OPTIONS[0]);
    setItemColor(COLOR_OPTIONS[1]);
    setItemFabric(FABRIC_OPTIONS[0]);
    setItemComposition(COMPOSITION_OPTIONS[1]);
    setItemWovenKnits(WOVEN_KNITS_OPTIONS[1]);
    setItemTotalUnits(TOTAL_UNITS_OPTIONS[0]);
    setItemPoPrice(PO_PRICE_OPTIONS[2]);
    setItemOspSar(OSP_OPTIONS[1]);
    setIsAddModalOpen(true);
  }

  function closeAddModal(): void {
    setIsAddModalOpen(false);
    setEditingRowId(null);
    setPendingAnalyzeProductId(null);
    setAddItemError(null);
    setItemImageError(null);
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

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);
  }

  async function handleAnalyzeImage(): Promise<void> {
    if (!selectedImageFileRef.current) {
      setItemImageError('Please select an image first.');
      return;
    }

    setIsAnalyzing(true);
    setAddItemError(null);

    try {
      if (!hasAccessToken()) {
        throw new Error('You must be signed in to use AI analysis.');
      }

      // 1. Ensure we have a product context
      let productId = editingRowId ?? pendingAnalyzeProductId;
      if (!productId) {
        const res = await apiRequest<ProductResponse>('/catalog/products', {
          method: 'POST',
          body: JSON.stringify({
            title: 'New Item (Analyzing...)',
            // Use a temporary SKU if required, or let backend generate
            // Backend generates if not provided, but create_product requires SKU in some paths?
            // Checked catalog.py: if payload.sku is missing, it generates.
            // But ProductCreateRequest requires title.
            status: 'draft'
          }),
        });
        productId = res.id;
        setPendingAnalyzeProductId(productId);
      }

      // 2. Upload Image
      // Get file data
      const file = selectedImageFileRef.current;
      // The API expects JSON with file_url? 
      // Wait, standard upload usually is multipart/form-data.
      // But `add_product_image` in catalog.py takes `ProductImageCreateRequest` identifying `file_url`.
      // It seems the backend expects the file to be already uploaded to R2/S3 and we pass the URL, 
      // OR we implemented a specific upload endpoint?
      // `runSingleUpload` in catalog-view.tsx uses `uploaded://${encodeURIComponent(item.name)}`.
      // This suggests the backend might fetch it or it's a mock?
      // Ah, `ProductImage` model has `file_url`.
      // If I pass `file_url`, the backend uses it.
      // But I need to allow the AI to access it. 
      // If I pass `uploaded://...`, `AIService` needs to be able to resolve it.
      // `AIService.analyze_image` uses `image_url` passed to OpenAI.
      // OpenAI CANNOT access `uploaded://`.
      // I need to send Base64 Data URL to `AIService` if URL is not public.
      // But `ProductImage` stores the URL.
      // I should probably convert file to Base64 data URL and pass THAT as `file_url`?
      // `file_url` column is 512 chars. Base64 is much larger.
      // I need to upload to R2/S3.
      // BUT my task list didn't include implementing S3 upload.
      // I checked `catalog.py`: `ProductImageCreateRequest` takes `file_url`.
      // I checked `runSingleUpload`: sends `uploaded://...`.
      // This implies the current system is mocking storage.

      // FOR AI VISUAL ANALYSIS TO WORK:
      // OpenAI needs a public URL or Base64.
      // Since I don't have real S3, I MUST use Base64.
      // But `file_url` is too short (512).
      // `AIService` reads `ProductImage.file_url`.

      // WORKAROUND:
      // I will READ the file as Base64 in frontend.
      // I cannot store it in `ProductImage.file_url` (too short at 512).
      // I can pass it in `input_ref` or `payload` of the JOB? 
      // The job payload is Text, usually large enough? `payload_json` is Text.
      // Yes, `ProcessingJob.payload_json` is Text (unlimited in Postgres).

      // Re-plan:
      // 1. Upload logic: Just set `file_url` to a placeholder like `data:image/jpeg;base64...` (TRUNCATED) ? No.
      // 2. I'll read file as Data URL.
      // 3. Create ProductImage with `file_url='placeholder'`.
      // 4. Create Job with payload `{ image_id: ..., image_data: <BASE64_STRING> }`.
      // 5. Update `process_image_analysis_job` to prefer `image_data` from payload if present.

      // Wait, I already modified/wrote `process_image_analysis_job` in `services/ai.py` in Step 74.
      // It does: `image_id = payload.get('image_id')` -> `image = db...` -> `ai_service.analyze_image(image.file_url)`.
      // It accesses `image.file_url`.

      // If `file_url` is local/mock, OpenAI will fail.

      // I MUST update `process_image_analysis_job` in `ai.py` to handle `image_data` in payload.
      // OR I update `ProductImage.file_url` size? No, database schema change is heavy.

      // Safest: Update `ai.py` to check `payload.get('image_data')` and usage that instead of `image.file_url`.

      // I will assume I can do that.
      // So, frontend will:
      // read file -> base64.
      // Create ProductImage with dummy URL.
      // Create Job with `image_id` AND `image_data: base64`.

      // 2. Upload Image
      const formData = new FormData();
      formData.append('file', selectedImageFileRef.current);

      interface UploadResponse {
        url: string;
        filename: string;
      }

      // Normalize API URL to include /api/v1 if not present
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const normalizedApiUrl = rawApiUrl.endsWith('/api/v1') 
        ? rawApiUrl 
        : `${rawApiUrl.replace(/\/+$/, '')}/api/v1`;

      // Upload to /uploads endpoint
      const headers: HeadersInit = {};
      const accessToken = hasAccessToken() ? document.cookie
        .split(';')
        .map((entry) => entry.trim())
        .find((entry) => entry.startsWith('kira_access_token='))
        ?.split('=')[1] : null;
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${decodeURIComponent(accessToken)}`;
      }

      const uploadRes = await fetch(`${normalizedApiUrl}/uploads/`, {
        method: 'POST',
        headers,
        body: formData,
        // No Content-Type header; fetch adds boundary for FormData
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        let errorMessage = 'Failed to upload image';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const uploadData = await uploadRes.json() as UploadResponse;
      // Prepend API URL if it's a relative path starting with /static
      // We need the BASE url (without /api/v1) for static files if they are mounted at root /static
      const baseUrl = normalizedApiUrl.replace('/api/v1', '').replace(/\/+$/, '');
      const fullImageUrl = uploadData.url.startsWith('/static')
        ? `${baseUrl}${uploadData.url}`
        : uploadData.url;

      // 3. Create ProductImage Record with REAL URL
      const imageRes = await apiRequest<ProductImageResponse>(`/catalog/products/${productId}/images`, {
        method: 'POST',
        body: JSON.stringify({
          file_name: uploadData.filename,
          file_url: fullImageUrl,
          processing_status: 'uploaded'
        })
      });

      // Update the preview URL to show the uploaded image
      setImagePreviewUrl(getImageUrl(fullImageUrl));

      // If editing an existing row, keep its image in sync after upload.
      setCatalogRows((rows) =>
        rows.map((row) => (row.id === productId ? { ...row, primary_image_url: fullImageUrl } : row)),
      );

      // 4. Trigger Job
      // We still pass Base64 to AI because typically local URLs aren't accessible to OpenAI
      // UNLESS we use ngrok. 
      // User said "I CANT SEE IMAGES". 
      // The issue was the Frontend couldn't see 'pending_real_upload'. 
      // Now Frontend CAN see fullImageUrl because we serve it.

      // For AI:
      // If we don't have public URL, we MUST pass Base64 to OpenAI.
      // So we keep reading Base64 for the job payload.

      const fileReader = new FileReader();
      fileReader.readAsDataURL(selectedImageFileRef.current);
      const base64Data = await new Promise<string>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as string);
        fileReader.onerror = reject;
      });

      const jobRes = await apiRequest<{ id: string, status: string }>(`/catalog/jobs`, {
        method: 'POST',
        body: JSON.stringify({
          job_type: 'image_analysis',
          product_id: productId,
          payload: { image_id: imageRes.id, image_data: base64Data }
        })
      });

      // Poll
      let attempts = 0;
      while (attempts < 30) { // 30 seconds timeout
        await wait(1000);
        attempts++;
        const job = await apiRequest<{ status: string, result: any }>(`/catalog/jobs/${jobRes.id}`);
        if (job.status === 'completed') {
          const result = job.result;
          if (result.category) setItemCategory(normalizeCategory(result.category));
          if (result.color) setItemColor(result.color);
          // Also map other fields if they match options
          // ...
          break;
        } else if (job.status === 'failed') {
          throw new Error('AI analysis failed.');
        }
      }

    } catch (e: any) {
      setAddItemError(e.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
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
            await apiRequest<ProductImageResponse>(`/catalog/products/${response.id}/images`, {
              method: 'POST',
              body: JSON.stringify({
                file_name: uploadData.filename,
                file_url: imageUrl,
                processing_status: 'uploaded'
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
    <DashboardShell hideHeader>
      <section className='surface-card p-6 md:p-8'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            <h1 className='font-serif text-5xl font-semibold leading-tight'>Catalog</h1>
            <p className='mt-2 text-lg text-kira-midgray'>Manage your clothing inventory</p>
          </div>
          <div className='flex items-center gap-3'>
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

        {isBulkUploadOpen ? (
          <div className='mt-6 space-y-3 rounded-none border border-kira-warmgray/55 p-5'>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
              <div className='md:col-span-2'>
                <label className='mb-1 block text-sm font-medium text-kira-darkgray'>Attach Uploads To Product</label>
                <select
                  className='kira-focus-ring w-full border border-kira-warmgray/55 bg-kira-offwhite px-3 py-2 text-sm text-kira-black'
                  onChange={(event) => setSelectedUploadProductId(event.target.value)}
                  value={selectedUploadProductId}
                >
                  <option value=''>Local only (not linked)</option>
                  {persistedProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.styleNo} • {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className='text-sm text-kira-darkgray'>
                <p>Max {MAX_BULK_FILES_PER_BATCH} files per batch</p>
                <p>Max file size {formatBytes(MAX_BULK_FILE_SIZE_BYTES)}</p>
                <p>Formats: JPG, PNG, WEBP</p>
              </div>
            </div>

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
                'cursor-pointer border-2 border-dashed p-6 text-center text-sm transition-colors',
                isDropActive
                  ? 'border-kira-brown bg-kira-brown/10 text-kira-black'
                  : 'border-kira-warmgray/60 bg-kira-offwhite text-kira-darkgray',
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDropActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDropActive(false);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDropActive(true);
              }}
              onDrop={handleBulkDrop}
            >
              Drop images here or click to browse files
            </div>

            {uploadMessage ? (
              <p className='rounded-md bg-kira-warmgray/20 px-3 py-2 text-sm text-kira-black'>{uploadMessage}</p>
            ) : null}

            {uploadItems.length > 0 ? (
              <div className='rounded-none border border-kira-warmgray/50 p-3'>
                <div className='mb-2 flex items-center justify-between'>
                  <p className='text-sm font-semibold text-kira-black'>
                    Upload Queue ({uploadItems.length}) {isUploadProcessing ? '• Processing' : ''}
                  </p>
                  <Button className='px-2 py-1 text-xs' onClick={clearFinishedUploads} variant='text'>
                    Clear Finished
                  </Button>
                </div>
                <ul className='space-y-2'>
                  {uploadItems.map((item) => (
                    <li className='border border-kira-warmgray/40 p-2' key={item.id}>
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <p className='text-sm text-kira-black'>
                          {item.name} ({formatBytes(item.size)})
                        </p>
                        <p className='text-xs text-kira-midgray'>{item.status}</p>
                      </div>
                      <div className='mt-2 h-2 rounded-full bg-kira-warmgray/30'>
                        <div className='h-2 rounded-full bg-kira-brown transition-[width] duration-150' style={{ width: `${item.progress}%` }} />
                      </div>
                      {item.error ? <p className='mt-1 text-xs text-rose-700'>{item.error}</p> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
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
                <th className='px-4 py-4 text-sm font-medium uppercase tracking-[0.06em]'>Name</th>
                <th className='px-4 py-4 text-sm font-medium uppercase tracking-[0.06em]'>Category</th>
                <th className='px-4 py-4 text-sm font-medium uppercase tracking-[0.06em]'>Color</th>
                <th className='px-4 py-4 text-sm font-medium uppercase tracking-[0.06em]'>Fabric</th>
                <th className='px-4 py-4 text-sm font-medium uppercase tracking-[0.06em]'>Units</th>
                <th className='px-4 py-4 text-sm font-medium uppercase tracking-[0.06em]'>Price</th>
                <th className='px-4 py-4 text-sm font-medium uppercase tracking-[0.06em]'>Status</th>
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
                  <td className='px-4 py-4 text-kira-black'>
                    <select
                      className='kira-focus-ring border border-kira-warmgray/50 bg-kira-offwhite px-2 py-1 text-xs uppercase tracking-[0.06em] text-kira-darkgray'
                      onChange={(event) => void handleRowStatusTransition(row, event.target.value as CatalogStatus)}
                      value={row.status}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {formatStatusLabel(option)}
                        </option>
                      ))}
                    </select>
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
                  <td className='px-4 py-8 text-center text-sm text-kira-midgray' colSpan={11}>
                    No catalog rows match current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className='mt-6 rounded-none border border-kira-warmgray/55 bg-kira-offwhite p-5'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <h3 className='text-lg font-semibold text-kira-black'>Tech-Pack PDF OCR</h3>
              <p className='text-sm text-kira-midgray'>
                Upload a PDF tech-pack to extract measurements and validation flags.
              </p>
            </div>
            <p className='text-xs text-kira-midgray'>PDF only • Max {formatBytes(MAX_TECHPACK_FILE_SIZE_BYTES)}</p>
          </div>
          <div className='mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]'>
            <select
              className='kira-focus-ring border border-kira-warmgray/55 bg-kira-offwhite px-3 py-2 text-sm text-kira-black'
              onChange={(event) => setSelectedTechPackProductId(event.target.value)}
              value={selectedTechPackProductId}
            >
              <option value=''>Select product</option>
              {persistedProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.styleNo} • {product.name}
                </option>
              ))}
            </select>
            <input
              accept='.pdf'
              className='hidden'
              onChange={handleTechPackFileInput}
              ref={techPackInputRef}
              type='file'
            />
            <button
              className='kira-focus-ring border border-kira-warmgray/60 bg-kira-offwhite px-4 py-2 text-sm font-semibold uppercase tracking-[0.06em] text-kira-darkgray'
              onClick={() => techPackInputRef.current?.click()}
              type='button'
            >
              {techPackFileName ? 'Change PDF' : 'Choose PDF'}
            </button>
            <button
              className='kira-focus-ring bg-kira-black px-4 py-2 text-sm font-semibold uppercase tracking-[0.06em] text-kira-offwhite disabled:cursor-not-allowed disabled:opacity-60'
              disabled={isTechPackAnalyzing}
              onClick={() => void handleAnalyzeTechPack()}
              type='button'
            >
              {isTechPackAnalyzing ? 'Analyzing...' : 'Run OCR'}
            </button>
          </div>
          {techPackFileName ? <p className='mt-2 text-sm text-kira-darkgray'>Selected: {techPackFileName}</p> : null}
          {techPackError ? <p className='mt-2 text-sm text-rose-700'>{techPackError}</p> : null}

          {techPackResult ? (
            <div className='mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2'>
              <div className='border border-kira-warmgray/50'>
                <div className='border-b border-kira-warmgray/50 bg-kira-warmgray/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-kira-darkgray'>
                  Extracted Measurements ({techPackResult.extracted_count ?? 0})
                </div>
                <div className='max-h-56 overflow-auto'>
                  <table className='min-w-full text-sm'>
                    <thead>
                      <tr className='text-left text-kira-midgray'>
                        <th className='px-3 py-2'>Key</th>
                        <th className='px-3 py-2'>Value</th>
                        <th className='px-3 py-2'>Confidence</th>
                        <th className='px-3 py-2'>Review</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(techPackResult.measurements ?? []).map((measurement) => (
                        <tr className='border-t border-kira-warmgray/35 text-kira-black' key={measurement.measurement_key}>
                          <td className='px-3 py-2 capitalize'>{measurement.measurement_key}</td>
                          <td className='px-3 py-2'>
                            {measurement.measurement_value} {measurement.unit}
                          </td>
                          <td className='px-3 py-2'>{Math.round(Number(measurement.confidence_score ?? 0))}%</td>
                          <td className='px-3 py-2'>{measurement.needs_review ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className='border border-kira-warmgray/50'>
                <div className='border-b border-kira-warmgray/50 bg-kira-warmgray/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-kira-darkgray'>
                  Validation Flags
                </div>
                <ul className='space-y-2 p-3 text-sm text-kira-black'>
                  {(techPackResult.validation_flags ?? []).length === 0 ? (
                    <li className='text-kira-darkgray'>No validation flags.</li>
                  ) : (
                    (techPackResult.validation_flags ?? []).map((flag) => <li key={flag}>• {flag}</li>)
                  )}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {isAddModalOpen ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='kira-modal-open w-full max-w-[730px] border border-kira-warmgray/50 bg-kira-offwhite shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(6,6,6,0.24)]'>
            <div className='flex items-center justify-between border-b border-kira-warmgray/50 px-5 py-4'>
              <h2 className='font-serif text-3xl font-semibold'>{isEditMode ? 'Edit Item' : 'Add New Item'}</h2>
              <button
                className='kira-focus-ring inline-flex h-9 w-9 items-center justify-center text-kira-midgray hover:text-kira-black'
                onClick={closeAddModal}
                type='button'
              >
                <CloseIcon />
              </button>
            </div>

            <form className='px-5 py-5' onSubmit={handleSaveNewItem}>
              <div className='grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]'>
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
                      
                      {itemImageError ? <p className='text-sm text-rose-700'>{itemImageError}</p> : null}
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

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <FieldLabel>Style No</FieldLabel>
                    <input
                      className='kira-focus-ring w-full border-0 border-b border-kira-warmgray/70 bg-transparent px-0 pb-2 pt-1 text-xl text-kira-black outline-none placeholder:text-kira-midgray'
                      onChange={(event) => setItemStyleNo(event.target.value)}
                      placeholder='e.g., HRDS25001'
                      required
                      value={itemStyleNo}
                    />
                  </div>
                  <div className='space-y-2'>
                    <FieldLabel>Category</FieldLabel>
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
                    <FieldLabel>Style Name</FieldLabel>
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
                    <FieldLabel>Color</FieldLabel>
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
                    <FieldLabel>Fabric</FieldLabel>
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
                    <FieldLabel>Composition</FieldLabel>
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
                    <FieldLabel>Woven / Knits</FieldLabel>
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

              <div className='mt-5 flex justify-end gap-3 border-t border-kira-warmgray/50 pt-4'>
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
    </DashboardShell>
  );
}
