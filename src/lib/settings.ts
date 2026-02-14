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
