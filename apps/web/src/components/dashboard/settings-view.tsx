"use client";

import { useEffect, useState } from "react";

import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { PackingRulesPanel } from "@/src/components/dashboard/packing-rules-panel";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { InputField } from "@/src/components/ui/input-field";
import {
  createBuyerDocumentTemplate,
  deleteBuyerDocumentTemplate,
  type BrandProfileInput,
  type BuyerDocumentTemplate,
  type BuyerDocumentTemplateDefaults,
  type BuyerDocumentTemplateInput,
  type POBuilderDefaultsInput,
  getBrandProfile,
  getPOBuilderDefaults,
  listBuyerDocumentTemplates,
  resolveSettingsAssetUrl,
  uploadBrandStamp,
  updateBuyerDocumentTemplate,
  updateBrandProfile,
  updatePOBuilderDefaults,
} from "@/src/lib/settings";

const EMPTY_BRAND_PROFILE: BrandProfileInput = {
  supplier_name: "",
  address: "",
  gst_number: "",
  pan_number: "",
  fbs_name: "",
  vendor_company_name: "",
  supplier_city: "",
  supplier_state: "",
  supplier_pincode: "",
  delivery_from_name: "",
  delivery_from_address: "",
  delivery_from_city: "",
  delivery_from_pincode: "",
  origin_country: "",
  origin_state: "",
  origin_district: "",
  bill_to_name: "",
  bill_to_address: "",
  bill_to_gst: "",
  bill_to_pan: "",
  ship_to_name: "",
  ship_to_address: "",
  ship_to_gst: "",
  stamp_image_url: "",
  instagram_handle: "",
  website_url: "",
  facebook_handle: "",
  snapchat_handle: "",
  invoice_prefix: "",
  default_igst_rate: 0,
};

const EMPTY_PO_BUILDER_DEFAULTS: POBuilderDefaultsInput = {
  default_po_price: 600,
  default_osp_in_sar: 95,
  default_fabric_composition: "100% Polyester",
  default_size_ratio: { S: 4, M: 7, L: 7, XL: 4, XXL: 4 },
};

const SIZE_KEYS = ["S", "M", "L", "XL", "XXL"] as const;
const EMPTY_BUYER_TEMPLATE_DEFAULTS: BuyerDocumentTemplateDefaults = {
  marketplace_name: "",
  supplier_name: "",
  address: "",
  gst_number: "",
  pan_number: "",
  fbs_name: "",
  vendor_company_name: "",
  supplier_city: "",
  supplier_state: "",
  supplier_pincode: "",
  delivery_from_name: "",
  delivery_from_address: "",
  delivery_from_city: "",
  delivery_from_pincode: "",
  origin_country: "",
  origin_state: "",
  origin_district: "",
  bill_to_name: "",
  bill_to_address: "",
  bill_to_gst: "",
  bill_to_pan: "",
  ship_to_name: "",
  ship_to_address: "",
  ship_to_gst: "",
  stamp_image_url: "",
};
const EMPTY_BUYER_TEMPLATE: BuyerDocumentTemplateInput = {
  name: "",
  buyer_key: "",
  document_type: "invoice",
  layout_key: "default_v1",
  defaults: EMPTY_BUYER_TEMPLATE_DEFAULTS,
  is_default: false,
  is_active: true,
};

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

function SectionHeader({ eyebrow, title, description }: SectionHeaderProps): JSX.Element {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-kira-midgray">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold text-kira-black">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-kira-darkgray">{description}</p>
      ) : null}
    </div>
  );
}

export function SettingsView(): JSX.Element {
  const [brandProfile, setBrandProfile] = useState<BrandProfileInput>(EMPTY_BRAND_PROFILE);
  const [poBuilderDefaults, setPOBuilderDefaults] =
    useState<POBuilderDefaultsInput>(EMPTY_PO_BUILDER_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [buyerTemplates, setBuyerTemplates] = useState<BuyerDocumentTemplate[]>([]);
  const [selectedBuyerTemplateId, setSelectedBuyerTemplateId] = useState<string | null>(null);
  const [buyerTemplateDraft, setBuyerTemplateDraft] =
    useState<BuyerDocumentTemplateInput>(EMPTY_BUYER_TEMPLATE);
  const [savingBrandIdentity, setSavingBrandIdentity] = useState(false);
  const [savingInvoiceDefaults, setSavingInvoiceDefaults] = useState(false);
  const [savingPOBuilderDefaults, setSavingPOBuilderDefaults] = useState(false);
  const [savingBuyerTemplate, setSavingBuyerTemplate] = useState(false);
  const [deletingBuyerTemplate, setDeletingBuyerTemplate] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      try {
        const [profile, builderDefaults, templates] = await Promise.all([
          getBrandProfile(),
          getPOBuilderDefaults(),
          listBuyerDocumentTemplates(),
        ]);
        if (!active) {
          return;
        }
        setBrandProfile({
          supplier_name: profile.supplier_name,
          address: profile.address,
          gst_number: profile.gst_number,
          pan_number: profile.pan_number,
          fbs_name: profile.fbs_name,
          vendor_company_name: profile.vendor_company_name,
          supplier_city: profile.supplier_city,
          supplier_state: profile.supplier_state,
          supplier_pincode: profile.supplier_pincode,
          delivery_from_name: profile.delivery_from_name,
          delivery_from_address: profile.delivery_from_address,
          delivery_from_city: profile.delivery_from_city,
          delivery_from_pincode: profile.delivery_from_pincode,
          origin_country: profile.origin_country,
          origin_state: profile.origin_state,
          origin_district: profile.origin_district,
          bill_to_name: profile.bill_to_name,
          bill_to_address: profile.bill_to_address,
          bill_to_gst: profile.bill_to_gst,
          bill_to_pan: profile.bill_to_pan,
          ship_to_name: profile.ship_to_name,
          ship_to_address: profile.ship_to_address,
          ship_to_gst: profile.ship_to_gst,
          stamp_image_url: profile.stamp_image_url,
          instagram_handle: profile.instagram_handle,
          website_url: profile.website_url,
          facebook_handle: profile.facebook_handle,
          snapchat_handle: profile.snapchat_handle,
          invoice_prefix: profile.invoice_prefix,
          default_igst_rate: profile.default_igst_rate,
        });
        setPOBuilderDefaults({
          default_po_price: builderDefaults.default_po_price,
          default_osp_in_sar: builderDefaults.default_osp_in_sar,
          default_fabric_composition: builderDefaults.default_fabric_composition,
          default_size_ratio: builderDefaults.default_size_ratio,
        });
        setBuyerTemplates(templates);
        const initialTemplate =
          templates.find((template) => template.is_default) ?? templates[0] ?? null;
        setSelectedBuyerTemplateId(initialTemplate?.id ?? null);
        setBuyerTemplateDraft(
          initialTemplate
            ? {
                name: initialTemplate.name,
                buyer_key: initialTemplate.buyer_key,
                document_type: initialTemplate.document_type,
                layout_key: initialTemplate.layout_key,
                defaults: initialTemplate.defaults,
                is_default: initialTemplate.is_default,
                is_active: initialTemplate.is_active,
              }
            : EMPTY_BUYER_TEMPLATE,
        );
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Failed to load settings.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const selectedBuyerTemplate =
    buyerTemplates.find((template) => template.id === selectedBuyerTemplateId) ?? null;

  const handleSaveBrandIdentity = async (): Promise<void> => {
    try {
      setSavingBrandIdentity(true);
      setError(null);
      setMessage(null);
      const saved = await updateBrandProfile({
        ...brandProfile,
        default_igst_rate: Number(brandProfile.default_igst_rate) || 0,
      });
      setBrandProfile({
        supplier_name: saved.supplier_name,
        address: saved.address,
        gst_number: saved.gst_number,
        pan_number: saved.pan_number,
        fbs_name: saved.fbs_name,
        vendor_company_name: saved.vendor_company_name,
        supplier_city: saved.supplier_city,
        supplier_state: saved.supplier_state,
        supplier_pincode: saved.supplier_pincode,
        delivery_from_name: saved.delivery_from_name,
        delivery_from_address: saved.delivery_from_address,
        delivery_from_city: saved.delivery_from_city,
        delivery_from_pincode: saved.delivery_from_pincode,
        origin_country: saved.origin_country,
        origin_state: saved.origin_state,
        origin_district: saved.origin_district,
        bill_to_name: saved.bill_to_name,
        bill_to_address: saved.bill_to_address,
        bill_to_gst: saved.bill_to_gst,
        bill_to_pan: saved.bill_to_pan,
        ship_to_name: saved.ship_to_name,
        ship_to_address: saved.ship_to_address,
        ship_to_gst: saved.ship_to_gst,
        stamp_image_url: saved.stamp_image_url,
        instagram_handle: saved.instagram_handle,
        website_url: saved.website_url,
        facebook_handle: saved.facebook_handle,
        snapchat_handle: saved.snapchat_handle,
        invoice_prefix: saved.invoice_prefix,
        default_igst_rate: saved.default_igst_rate,
      });
      setMessage("Brand identity saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save brand identity.");
    } finally {
      setSavingBrandIdentity(false);
    }
  };

  const handleSaveInvoiceDefaults = async (): Promise<void> => {
    try {
      setSavingInvoiceDefaults(true);
      setError(null);
      setMessage(null);
      const saved = await updateBrandProfile({
        ...brandProfile,
        default_igst_rate: Number(brandProfile.default_igst_rate) || 0,
      });
      setBrandProfile({
        supplier_name: saved.supplier_name,
        address: saved.address,
        gst_number: saved.gst_number,
        pan_number: saved.pan_number,
        fbs_name: saved.fbs_name,
        vendor_company_name: saved.vendor_company_name,
        supplier_city: saved.supplier_city,
        supplier_state: saved.supplier_state,
        supplier_pincode: saved.supplier_pincode,
        delivery_from_name: saved.delivery_from_name,
        delivery_from_address: saved.delivery_from_address,
        delivery_from_city: saved.delivery_from_city,
        delivery_from_pincode: saved.delivery_from_pincode,
        origin_country: saved.origin_country,
        origin_state: saved.origin_state,
        origin_district: saved.origin_district,
        bill_to_name: saved.bill_to_name,
        bill_to_address: saved.bill_to_address,
        bill_to_gst: saved.bill_to_gst,
        bill_to_pan: saved.bill_to_pan,
        ship_to_name: saved.ship_to_name,
        ship_to_address: saved.ship_to_address,
        ship_to_gst: saved.ship_to_gst,
        stamp_image_url: saved.stamp_image_url,
        instagram_handle: saved.instagram_handle,
        website_url: saved.website_url,
        facebook_handle: saved.facebook_handle,
        snapchat_handle: saved.snapchat_handle,
        invoice_prefix: saved.invoice_prefix,
        default_igst_rate: saved.default_igst_rate,
      });
      setMessage("Invoice defaults saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save invoice defaults.");
    } finally {
      setSavingInvoiceDefaults(false);
    }
  };

  const handleStampUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      setUploadingStamp(true);
      setError(null);
      setMessage(null);
      const uploaded = await uploadBrandStamp(file);
      setBrandProfile((current) => ({ ...current, stamp_image_url: uploaded.url }));
      setMessage("Stamp uploaded. Save invoice defaults to use it on invoice PDFs.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Failed to upload stamp image.",
      );
    } finally {
      setUploadingStamp(false);
      event.target.value = "";
    }
  };

  const handleSavePOBuilderDefaults = async (): Promise<void> => {
    try {
      setSavingPOBuilderDefaults(true);
      setError(null);
      setMessage(null);
      const saved = await updatePOBuilderDefaults({
        ...poBuilderDefaults,
        default_po_price: Number(poBuilderDefaults.default_po_price) || 0,
        default_osp_in_sar: Number(poBuilderDefaults.default_osp_in_sar) || 0,
        default_size_ratio: Object.fromEntries(
          Object.entries(poBuilderDefaults.default_size_ratio).map(([size, value]) => [
            size,
            Number(value) || 0,
          ]),
        ),
      });
      setPOBuilderDefaults({
        default_po_price: saved.default_po_price,
        default_osp_in_sar: saved.default_osp_in_sar,
        default_fabric_composition: saved.default_fabric_composition,
        default_size_ratio: saved.default_size_ratio,
      });
      setMessage("PO builder defaults saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save PO builder defaults.",
      );
    } finally {
      setSavingPOBuilderDefaults(false);
    }
  };

  const handleSelectBuyerTemplate = (template: BuyerDocumentTemplate | null): void => {
    setSelectedBuyerTemplateId(template?.id ?? null);
    setBuyerTemplateDraft(
      template
        ? {
            name: template.name,
            buyer_key: template.buyer_key,
            document_type: template.document_type,
            layout_key: template.layout_key,
            defaults: template.defaults,
            is_default: template.is_default,
            is_active: template.is_active,
          }
        : EMPTY_BUYER_TEMPLATE,
    );
  };

  const handleSaveBuyerTemplate = async (): Promise<void> => {
    try {
      setSavingBuyerTemplate(true);
      setError(null);
      setMessage(null);
      const payload: BuyerDocumentTemplateInput = {
        ...buyerTemplateDraft,
        name: buyerTemplateDraft.name.trim(),
        buyer_key: buyerTemplateDraft.buyer_key.trim(),
      };
      const saved = selectedBuyerTemplate
        ? await updateBuyerDocumentTemplate(selectedBuyerTemplate.id, payload)
        : await createBuyerDocumentTemplate(payload);
      const templates = await listBuyerDocumentTemplates();
      setBuyerTemplates(templates);
      handleSelectBuyerTemplate(templates.find((template) => template.id === saved.id) ?? saved);
      setMessage(selectedBuyerTemplate ? "Buyer template saved." : "Buyer template created.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save buyer template.");
    } finally {
      setSavingBuyerTemplate(false);
    }
  };

  const handleDeleteBuyerTemplate = async (): Promise<void> => {
    if (!selectedBuyerTemplate) {
      return;
    }
    try {
      setDeletingBuyerTemplate(true);
      setError(null);
      setMessage(null);
      await deleteBuyerDocumentTemplate(selectedBuyerTemplate.id);
      const templates = await listBuyerDocumentTemplates();
      setBuyerTemplates(templates);
      const nextTemplate =
        templates.find((template) => template.is_default) ?? templates[0] ?? null;
      handleSelectBuyerTemplate(nextTemplate);
      setMessage("Buyer template deleted.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete buyer template.",
      );
    } finally {
      setDeletingBuyerTemplate(false);
    }
  };

  return (
    <DashboardShell
      subtitle="Centralize operational defaults for documents, packing, and the upgraded PO builder."
      title="Settings"
    >
      <div className="space-y-6">
        {error ? (
          <Card className="border border-kira-warmgray/40 p-4 text-sm text-kira-warmgray">
            {error}
          </Card>
        ) : null}
        {message ? (
          <Card className="border border-kira-midgray/30 p-4 text-sm text-kira-darkgray">
            {message}
          </Card>
        ) : null}

        <Card className="p-5 md:p-6">
          <SectionHeader
            description="Your legal and company identity. This is the business profile the rest of the operational flows build from."
            eyebrow="Identity"
            title="Brand identity"
          />
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <InputField
              disabled={loading}
              label="FBS name"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, fbs_name: event.target.value }))
              }
              value={brandProfile.fbs_name}
            />
            <InputField
              disabled={loading}
              label="Vendor company name"
              onChange={(event) =>
                setBrandProfile((current) => ({
                  ...current,
                  vendor_company_name: event.target.value,
                }))
              }
              value={brandProfile.vendor_company_name}
            />
            <InputField
              disabled={loading}
              label="Supplier name"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, supplier_name: event.target.value }))
              }
              value={brandProfile.supplier_name}
            />
            <InputField
              disabled={loading}
              label="GST number"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, gst_number: event.target.value }))
              }
              value={brandProfile.gst_number}
            />
            <InputField
              disabled={loading}
              label="PAN number"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, pan_number: event.target.value }))
              }
              value={brandProfile.pan_number}
            />
            <InputField
              disabled={loading}
              label="Supplier city"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, supplier_city: event.target.value }))
              }
              value={brandProfile.supplier_city}
            />
            <InputField
              disabled={loading}
              label="Supplier state"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, supplier_state: event.target.value }))
              }
              value={brandProfile.supplier_state}
            />
            <InputField
              disabled={loading}
              label="Supplier pincode"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, supplier_pincode: event.target.value }))
              }
              value={brandProfile.supplier_pincode}
            />
            <InputField
              disabled={loading}
              label="Instagram handle"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, instagram_handle: event.target.value }))
              }
              value={brandProfile.instagram_handle}
            />
            <InputField
              disabled={loading}
              label="Website"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, website_url: event.target.value }))
              }
              value={brandProfile.website_url}
            />
            <InputField
              disabled={loading}
              label="Facebook handle"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, facebook_handle: event.target.value }))
              }
              value={brandProfile.facebook_handle}
            />
            <InputField
              disabled={loading}
              label="Snapchat handle"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, snapchat_handle: event.target.value }))
              }
              value={brandProfile.snapchat_handle}
            />
            <div className="md:col-span-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-kira-darkgray">
                  Registered address
                </span>
                <textarea
                  className="kira-focus-ring min-h-28 w-full rounded-xl border border-kira-warmgray/35 bg-transparent px-3 py-3 text-kira-black"
                  disabled={loading}
                  onChange={(event) =>
                    setBrandProfile((current) => ({ ...current, address: event.target.value }))
                  }
                  value={brandProfile.address}
                />
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button disabled={loading || savingBrandIdentity} onClick={handleSaveBrandIdentity}>
              {savingBrandIdentity ? "Saving..." : "Save brand identity"}
            </Button>
          </div>
        </Card>

        <Card className="p-5 md:p-6">
          <SectionHeader
            description="These defaults prefill the PO Format Builder so teams start from the same ratio, commercial inputs, and fabric assumptions every time."
            eyebrow="PO Builder"
            title="PO builder defaults"
          />
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <InputField
              disabled={loading}
              label="Default PO price"
              min="0"
              onChange={(event) =>
                setPOBuilderDefaults((current) => ({
                  ...current,
                  default_po_price: Number(event.target.value) || 0,
                }))
              }
              step="0.01"
              type="number"
              value={poBuilderDefaults.default_po_price}
            />
            <InputField
              disabled={loading}
              label="Default OSP in SAR"
              min="0"
              onChange={(event) =>
                setPOBuilderDefaults((current) => ({
                  ...current,
                  default_osp_in_sar: Number(event.target.value) || 0,
                }))
              }
              step="0.01"
              type="number"
              value={poBuilderDefaults.default_osp_in_sar}
            />
            <div className="md:col-span-2">
              <InputField
                disabled={loading}
                label="Default fibre composition"
                onChange={(event) =>
                  setPOBuilderDefaults((current) => ({
                    ...current,
                    default_fabric_composition: event.target.value,
                  }))
                }
                value={poBuilderDefaults.default_fabric_composition}
              />
            </div>
            <div className="md:col-span-2">
              <div className="rounded-2xl border border-kira-warmgray/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-kira-black">Default size ratio</p>
                    <p className="mt-1 text-xs text-kira-midgray">
                      Used when the builder creates a new style before anyone edits it.
                    </p>
                  </div>
                  <div className="rounded-full bg-kira-warmgray/20 px-3 py-1 text-xs font-semibold text-kira-darkgray">
                    {Object.values(poBuilderDefaults.default_size_ratio).reduce(
                      (sum, value) => sum + value,
                      0,
                    )}{" "}
                    pieces / colorway
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-5 gap-3">
                  {SIZE_KEYS.map((size) => (
                    <label className="space-y-2 text-center" key={size}>
                      <span className="block text-sm font-medium text-kira-darkgray">{size}</span>
                      <input
                        className="kira-focus-ring w-full rounded-xl border border-kira-warmgray/35 bg-transparent px-2 py-2 text-center text-kira-black"
                        disabled={loading}
                        min="0"
                        onChange={(event) =>
                          setPOBuilderDefaults((current) => ({
                            ...current,
                            default_size_ratio: {
                              ...current.default_size_ratio,
                              [size]: Number(event.target.value) || 0,
                            },
                          }))
                        }
                        type="number"
                        value={poBuilderDefaults.default_size_ratio[size] ?? 0}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              disabled={loading || savingPOBuilderDefaults}
              onClick={handleSavePOBuilderDefaults}
            >
              {savingPOBuilderDefaults ? "Saving..." : "Save PO builder defaults"}
            </Button>
          </div>
        </Card>

        <Card className="p-5 md:p-6">
          <SectionHeader description="" eyebrow="Invoice" title="Invoice defaults" />
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <InputField
              disabled={loading}
              label="Invoice prefix"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, invoice_prefix: event.target.value }))
              }
              value={brandProfile.invoice_prefix}
            />
            <InputField
              disabled={loading}
              label="Default IGST rate"
              min="0"
              onChange={(event) =>
                setBrandProfile((current) => ({
                  ...current,
                  default_igst_rate: Number(event.target.value) || 0,
                }))
              }
              step="0.01"
              type="number"
              value={brandProfile.default_igst_rate}
            />
            <InputField
              disabled={loading}
              label="Bill To name"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, bill_to_name: event.target.value }))
              }
              value={brandProfile.bill_to_name}
            />
            <InputField
              disabled={loading}
              label="Bill To GST"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, bill_to_gst: event.target.value }))
              }
              value={brandProfile.bill_to_gst}
            />
            <InputField
              disabled={loading}
              label="Bill To PAN"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, bill_to_pan: event.target.value }))
              }
              value={brandProfile.bill_to_pan}
            />
            <InputField
              disabled={loading}
              label="Ship To name"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, ship_to_name: event.target.value }))
              }
              value={brandProfile.ship_to_name}
            />
            <InputField
              disabled={loading}
              label="Ship To GST"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, ship_to_gst: event.target.value }))
              }
              value={brandProfile.ship_to_gst}
            />
            <InputField
              disabled={loading}
              label="Delivery from name"
              onChange={(event) =>
                setBrandProfile((current) => ({
                  ...current,
                  delivery_from_name: event.target.value,
                }))
              }
              value={brandProfile.delivery_from_name}
            />
            <InputField
              disabled={loading}
              label="Delivery from city"
              onChange={(event) =>
                setBrandProfile((current) => ({
                  ...current,
                  delivery_from_city: event.target.value,
                }))
              }
              value={brandProfile.delivery_from_city}
            />
            <InputField
              disabled={loading}
              label="Delivery from pincode"
              onChange={(event) =>
                setBrandProfile((current) => ({
                  ...current,
                  delivery_from_pincode: event.target.value,
                }))
              }
              value={brandProfile.delivery_from_pincode}
            />
            <InputField
              disabled={loading}
              label="Origin country"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, origin_country: event.target.value }))
              }
              value={brandProfile.origin_country}
            />
            <InputField
              disabled={loading}
              label="Origin state"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, origin_state: event.target.value }))
              }
              value={brandProfile.origin_state}
            />
            <InputField
              disabled={loading}
              label="Origin district"
              onChange={(event) =>
                setBrandProfile((current) => ({ ...current, origin_district: event.target.value }))
              }
              value={brandProfile.origin_district}
            />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-kira-darkgray">
                Default Bill To address
              </span>
              <textarea
                className="kira-focus-ring min-h-28 w-full rounded-xl border border-kira-warmgray/35 bg-transparent px-3 py-3 text-kira-black"
                disabled={loading}
                onChange={(event) =>
                  setBrandProfile((current) => ({
                    ...current,
                    bill_to_address: event.target.value,
                  }))
                }
                value={brandProfile.bill_to_address}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-kira-darkgray">
                Default Ship To address
              </span>
              <textarea
                className="kira-focus-ring min-h-28 w-full rounded-xl border border-kira-warmgray/35 bg-transparent px-3 py-3 text-kira-black"
                disabled={loading}
                onChange={(event) =>
                  setBrandProfile((current) => ({
                    ...current,
                    ship_to_address: event.target.value,
                  }))
                }
                value={brandProfile.ship_to_address}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium text-kira-darkgray">
                Delivery from address
              </span>
              <textarea
                className="kira-focus-ring min-h-24 w-full rounded-xl border border-kira-warmgray/35 bg-transparent px-3 py-3 text-kira-black"
                disabled={loading}
                onChange={(event) =>
                  setBrandProfile((current) => ({
                    ...current,
                    delivery_from_address: event.target.value,
                  }))
                }
                value={brandProfile.delivery_from_address}
              />
            </label>
            <div className="md:col-span-2 rounded-2xl border border-kira-warmgray/35 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-kira-black">Stamp / signature</p>
                  <p className="mt-1 text-xs text-kira-midgray">
                    This image is placed in the invoice footer when available.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-kira-darkgray px-3 py-2 text-sm text-kira-darkgray hover:bg-kira-warmgray/18">
                  <input
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      void handleStampUpload(event);
                    }}
                    type="file"
                  />
                  <span>{uploadingStamp ? "Uploading..." : "Upload stamp"}</span>
                </label>
              </div>
              {brandProfile.stamp_image_url ? (
                <div className="mt-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Invoice stamp preview"
                    className="max-h-28 rounded-lg border border-kira-warmgray/35 bg-white object-contain p-2"
                    src={resolveSettingsAssetUrl(brandProfile.stamp_image_url) ?? ""}
                  />
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button disabled={loading || savingInvoiceDefaults} onClick={handleSaveInvoiceDefaults}>
              {savingInvoiceDefaults ? "Saving..." : "Save invoice defaults"}
            </Button>
          </div>
        </Card>

        <Card className="p-5 md:p-6">
          <SectionHeader
            description="Create buyer-specific invoice profiles so Landmark, Styli, or any other buyer can start from the right bill-to, ship-to, stamp, and layout defaults."
            eyebrow="Buyer Templates"
            title="Invoice buyer templates"
          />
          <div className="mt-6 grid gap-6 lg:grid-cols-[280px,minmax(0,1fr)]">
            <div className="space-y-3">
              <Button onClick={() => handleSelectBuyerTemplate(null)} variant="secondary">
                New buyer template
              </Button>
              <div className="space-y-2">
                {buyerTemplates.length === 0 ? (
                  <Card className="border border-dashed border-kira-warmgray/35 p-4 text-sm text-kira-midgray">
                    No buyer templates yet. Create one to auto-match invoice defaults by buyer.
                  </Card>
                ) : (
                  buyerTemplates.map((template) => (
                    <button
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        selectedBuyerTemplateId === template.id
                          ? "border-kira-black bg-kira-offwhite"
                          : "border-kira-warmgray/30 hover:border-kira-midgray/40"
                      }`}
                      key={template.id}
                      onClick={() => handleSelectBuyerTemplate(template)}
                      type="button"
                    >
                      <p className="text-sm font-medium text-kira-black">{template.name}</p>
                      <p className="mt-1 text-xs text-kira-midgray">
                        {template.buyer_key} · {template.layout_key}
                        {template.is_default ? " · default" : ""}
                        {!template.is_active ? " · inactive" : ""}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <InputField
                  disabled={loading || savingBuyerTemplate}
                  label="Template name"
                  onChange={(event) =>
                    setBuyerTemplateDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  value={buyerTemplateDraft.name}
                />
                <InputField
                  disabled={loading || savingBuyerTemplate}
                  hint="Used to auto-match the received PO distributor."
                  label="Buyer key"
                  onChange={(event) =>
                    setBuyerTemplateDraft((current) => ({
                      ...current,
                      buyer_key: event.target.value,
                    }))
                  }
                  value={buyerTemplateDraft.buyer_key}
                />
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-kira-darkgray">Layout</span>
                  <select
                    className="kira-focus-ring w-full rounded-xl border border-kira-warmgray/35 bg-transparent px-3 py-3 text-kira-black"
                    disabled={loading || savingBuyerTemplate}
                    onChange={(event) =>
                      setBuyerTemplateDraft((current) => ({
                        ...current,
                        layout_key: event.target.value as BuyerDocumentTemplateInput["layout_key"],
                      }))
                    }
                    value={buyerTemplateDraft.layout_key}
                  >
                    <option value="default_v1">Default invoice</option>
                    <option value="landmark_v1">Landmark invoice</option>
                  </select>
                </label>
                <div className="flex flex-wrap items-center gap-4 pt-7 text-sm text-kira-darkgray">
                  <label className="inline-flex items-center gap-2">
                    <input
                      checked={buyerTemplateDraft.is_default}
                      onChange={(event) =>
                        setBuyerTemplateDraft((current) => ({
                          ...current,
                          is_default: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    <span>Set as default</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      checked={buyerTemplateDraft.is_active}
                      onChange={(event) =>
                        setBuyerTemplateDraft((current) => ({
                          ...current,
                          is_active: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <InputField
                  disabled={loading || savingBuyerTemplate}
                  label="Marketplace label"
                  onChange={(event) =>
                    setBuyerTemplateDraft((current) => ({
                      ...current,
                      defaults: { ...current.defaults, marketplace_name: event.target.value },
                    }))
                  }
                  value={buyerTemplateDraft.defaults.marketplace_name}
                />
                <InputField
                  disabled={loading || savingBuyerTemplate}
                  label="Stamp image URL"
                  onChange={(event) =>
                    setBuyerTemplateDraft((current) => ({
                      ...current,
                      defaults: { ...current.defaults, stamp_image_url: event.target.value },
                    }))
                  }
                  value={buyerTemplateDraft.defaults.stamp_image_url}
                />
                <InputField
                  disabled={loading || savingBuyerTemplate}
                  label="Bill To name"
                  onChange={(event) =>
                    setBuyerTemplateDraft((current) => ({
                      ...current,
                      defaults: { ...current.defaults, bill_to_name: event.target.value },
                    }))
                  }
                  value={buyerTemplateDraft.defaults.bill_to_name}
                />
                <InputField
                  disabled={loading || savingBuyerTemplate}
                  label="Bill To GST"
                  onChange={(event) =>
                    setBuyerTemplateDraft((current) => ({
                      ...current,
                      defaults: { ...current.defaults, bill_to_gst: event.target.value },
                    }))
                  }
                  value={buyerTemplateDraft.defaults.bill_to_gst}
                />
                <InputField
                  disabled={loading || savingBuyerTemplate}
                  label="Bill To PAN"
                  onChange={(event) =>
                    setBuyerTemplateDraft((current) => ({
                      ...current,
                      defaults: { ...current.defaults, bill_to_pan: event.target.value },
                    }))
                  }
                  value={buyerTemplateDraft.defaults.bill_to_pan}
                />
                <InputField
                  disabled={loading || savingBuyerTemplate}
                  label="Ship To name"
                  onChange={(event) =>
                    setBuyerTemplateDraft((current) => ({
                      ...current,
                      defaults: { ...current.defaults, ship_to_name: event.target.value },
                    }))
                  }
                  value={buyerTemplateDraft.defaults.ship_to_name}
                />
                <InputField
                  disabled={loading || savingBuyerTemplate}
                  label="Ship To GST"
                  onChange={(event) =>
                    setBuyerTemplateDraft((current) => ({
                      ...current,
                      defaults: { ...current.defaults, ship_to_gst: event.target.value },
                    }))
                  }
                  value={buyerTemplateDraft.defaults.ship_to_gst}
                />
                <label className="block md:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-kira-darkgray">
                    Bill To address
                  </span>
                  <textarea
                    className="kira-focus-ring min-h-24 w-full rounded-xl border border-kira-warmgray/35 bg-transparent px-3 py-3 text-kira-black"
                    disabled={loading || savingBuyerTemplate}
                    onChange={(event) =>
                      setBuyerTemplateDraft((current) => ({
                        ...current,
                        defaults: { ...current.defaults, bill_to_address: event.target.value },
                      }))
                    }
                    value={buyerTemplateDraft.defaults.bill_to_address}
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-kira-darkgray">
                    Ship To address
                  </span>
                  <textarea
                    className="kira-focus-ring min-h-24 w-full rounded-xl border border-kira-warmgray/35 bg-transparent px-3 py-3 text-kira-black"
                    disabled={loading || savingBuyerTemplate}
                    onChange={(event) =>
                      setBuyerTemplateDraft((current) => ({
                        ...current,
                        defaults: { ...current.defaults, ship_to_address: event.target.value },
                      }))
                    }
                    value={buyerTemplateDraft.defaults.ship_to_address}
                  />
                </label>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                {selectedBuyerTemplate ? (
                  <Button
                    disabled={deletingBuyerTemplate}
                    onClick={handleDeleteBuyerTemplate}
                    variant="secondary"
                  >
                    {deletingBuyerTemplate ? "Deleting..." : "Delete template"}
                  </Button>
                ) : null}
                <Button
                  disabled={
                    loading ||
                    savingBuyerTemplate ||
                    !buyerTemplateDraft.name.trim() ||
                    !buyerTemplateDraft.buyer_key.trim()
                  }
                  onClick={handleSaveBuyerTemplate}
                >
                  {savingBuyerTemplate
                    ? "Saving..."
                    : selectedBuyerTemplate
                      ? "Save template"
                      : "Create template"}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 md:p-6">
          <SectionHeader
            description="Category-based carton assumptions for packing-list generation. These control how received PO quantities get split across cartons."
            eyebrow="Packing"
            title="Packing rules"
          />
          <PackingRulesPanel className="mt-6" />
        </Card>
      </div>
    </DashboardShell>
  );
}
