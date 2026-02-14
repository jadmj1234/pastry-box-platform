/**
 * Centralized pricing and settings.
 * Admin can override price per order in manager.
 */

export type ProductType = "BOX_35" | "BOX_50" | "BOX_70";

export const DEFAULT_PRICES: Record<ProductType, number> = {
  BOX_35: 280,
  BOX_50: 350, // TBD – admin can override per order
  BOX_70: 450, // TBD – admin can override per order
};

export const UNITS_PER_BOX: Record<ProductType, number> = {
  BOX_35: 35,
  BOX_50: 50,
  BOX_70: 70,
};

export function getDefaultPrice(productType: ProductType): number {
  return DEFAULT_PRICES[productType];
}

export function getUnitsPerBox(productType: ProductType): number {
  return UNITS_PER_BOX[productType];
}

/** Default delivery window (for display / future use) */
export const DEFAULT_DELIVERY_WINDOW = "11:00–14:00";

/**
 * WhatsApp contact number for "Contact us" (e.g. 972501234567 for Israel).
 * Set env NEXT_PUBLIC_WHATSAPP_NUMBER so the customer page can open WhatsApp.
 */
export function getWhatsAppNumber(): string {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
}

/** Build WhatsApp chat URL (wa.me). Use only when number is set. */
export function getWhatsAppContactUrl(number: string, prefillText?: string): string {
  const clean = number.replace(/\D/g, "");
  if (!clean) return "#";
  const base = `https://wa.me/${clean}`;
  if (prefillText) return `${base}?text=${encodeURIComponent(prefillText)}`;
  return base;
}
