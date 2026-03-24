export interface ProductSnapshot {
  id: string;
  sku: string;
  title: string;
  brand: string;
  category: string;
  color: string;
  primary_image_url: string | null;
}

export interface POColorway {
  id: string;
  po_request_item_id: string;
  letter: string;
  color_name: string;
  created_at: string;
  updated_at: string;
}

export interface POAttributeValue {
  value: string;
  confidence: number | null;
}

export interface POExtractedAttributes {
  fields: Record<string, POAttributeValue>;
  review_required: boolean;
}

export interface PORequestItem {
  id: string;
  po_request_id: string;
  product_id: string;
  po_price: number | null;
  osp_inside_price: number | null;
  fabric_composition: string | null;
  size_ratio: Record<string, number>;
  extracted_attributes: POExtractedAttributes;
  colorways: POColorway[];
  product: ProductSnapshot | null;
  created_at: string;
  updated_at: string;
}

export interface PORequestRow {
  id: string;
  po_request_id: string;
  po_request_item_id: string;
  product_id: string;
  row_index: number;
  sku_id: string;
  brand_name: string;
  category_type: string;
  styli_sku_id: string | null;
  color: string;
  size: string;
  colorway_letter: string;
  l1: string;
  fibre_composition: string | null;
  coo: string;
  po_price: number | null;
  osp_in_sar: number | null;
  po_qty: number;
  knitted_woven: string | null;
  product_name: string | null;
  dress_print: string | null;
  dress_length: string | null;
  dress_shape: string | null;
  sleeve_length: string | null;
  neck_women: string | null;
  sleeve_styling: string | null;
  created_at: string;
  updated_at: string;
}

export interface PORequestResponse {
  id: string;
  company_id: string;
  status: "draft" | "analyzing" | "ready" | "generated" | "failed";
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  items: PORequestItem[];
  rows: PORequestRow[];
}

export const SIZE_KEYS = ["S", "M", "L", "XL", "XXL"] as const;
export type SizeKey = (typeof SIZE_KEYS)[number];

export const DRESS_ATTRIBUTE_OPTIONS: Record<string, string[]> = {
  dress_print: [
    "Abstract",
    "Animal",
    "AOP",
    "Aztec",
    "Bohemian",
    "Camouflage",
    "Chain",
    "Checked",
    "Color Block",
    "Conversational",
    "Denim",
    "Ditsy Print",
    "Embellished",
    "Embroidered",
    "Floral",
    "Geometric",
    "Gingham checks",
    "Graphic",
    "Lace",
    "Other",
    "Paisley",
    "Plain",
    "Polka Dot",
    "Scarf",
    "Self Design",
    "Sequin",
    "Slogan",
    "Snake Print",
    "Spot",
    "Stars & Moons",
    "Striped",
    "Tie and Dye",
    "Tribal",
    "Tropical",
    "Houndstooth",
    "Foil",
    "Logo",
  ],
  dress_length: ["Maxi", "Midi", "Mini", "Knee Length"],
  dress_shape: [
    "A-Line",
    "Blazer",
    "Bodycon",
    "Cape",
    "Jumper",
    "Pinafore",
    "Sheath",
    "Shift",
    "Shirt",
    "Skater",
    "Slip",
    "Smock",
    "Sweater",
    "Swing",
    "Tea Dress",
    "Tiered",
    "T-Shirt",
    "Tunic",
    "Wiggle",
    "Wrap",
    "Kaftan",
  ],
  sleeve_length: [
    "3/4 Sleeves",
    "Long Sleeves",
    "One Sleeve",
    "Short Sleeves",
    "Sleeveless",
    "Strapless",
    "Strappy",
  ],
  neck_women: [
    "Asymmetric Neck",
    "Bandeau Neck",
    "Bardot Neck",
    "Boat Neck",
    "Collared",
    "Cowl Neck",
    "Halter Neck",
    "High Neck",
    "Keyhole Neck",
    "Off Shoulder Neck",
    "One Shoulder Neck",
    "Polo Neck",
    "Racer Neck",
    "Roll Neck",
    "Round Neck",
    "Scoop Neck",
    "Square Neck",
    "Sweetheart Neck",
    "Tie-Up Neck",
    "Turtle Neck",
    "V Neck",
    "Hooded",
    "Notch Neck",
    "Peter Pan",
    "Wide Neck",
  ],
  sleeve_styling: [
    "Angel Sleeve",
    "Bell Sleeve",
    "Cap Sleeve",
    "Cape Sleeve",
    "Cold Shoulder Sleeve",
    "Cuffed Sleeve",
    "Kimono Sleeve",
    "Puff Sleeve",
    "Raglan Sleeve",
    "Regular Sleeve",
    "Roll-Up Sleeve",
    "Ruched Sleeve",
    "Slit Sleeve",
    "No Sleeve",
    "Bishop Sleeve",
    "Ruffled",
    "Batwing Sleeve",
    "Flute Sleeve",
    "Balloon Sleeve",
    "Tie Sleeve",
    "Marie Sleeves",
    "One Sleeve",
    "Frill Sleeve",
    "Tulip Sleeve",
  ],
};

export const ATTRIBUTE_LABELS: Record<string, string> = {
  dress_print: "Dress print",
  dress_length: "Dress length",
  dress_shape: "Dress shape",
  sleeve_length: "Sleeve length",
  neck_women: "Neck",
  sleeve_styling: "Sleeve styling",
};

export function getNextColorwayLetter(colorways: Pick<POColorway, "letter">[]): string {
  if (colorways.length === 0) {
    return "A";
  }
  const latest = colorways[colorways.length - 1]?.letter ?? "A";
  const code = latest.charCodeAt(0);
  if (Number.isNaN(code)) {
    return "A";
  }
  return String.fromCharCode(Math.min(code + 1, 90));
}

export function getTotalPieces(rows: PORequestRow[]): number {
  return rows.reduce((sum, row) => sum + row.po_qty, 0);
}

export function getStyleRowCount(item: PORequestItem): number {
  const colorwayCount = item.colorways.length || 1;
  const sizeCount = Object.values(item.size_ratio).filter((value) => value > 0).length;
  return colorwayCount * sizeCount;
}

export function getLowConfidenceFields(attributes: POExtractedAttributes): string[] {
  return Object.entries(attributes.fields)
    .filter(([, value]) => typeof value.confidence === "number" && value.confidence < 75)
    .map(([field]) => field);
}
