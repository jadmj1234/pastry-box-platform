import path from "path";
import fs from "fs";
import type { ProductType } from "@/lib/settings";
import { getDefaultPrice, getUnitsPerBox } from "@/lib/settings";

/** @deprecated Use productType + boxCount. Kept for backward compatibility. */
export type BoxSize = 35 | 50 | 70;

export type AttachmentType = "bit" | "receipt" | "other";

export interface OrderAttachment {
  filename: string;
  storedAs: string;
  type: AttachmentType;
  uploadedAt: string;
}

export interface Order {
  id: string;
  /** Product variant: BOX_35, BOX_50, BOX_70 */
  productType: ProductType;
  /** Units per box (35 / 50 / 70) – derived from productType */
  unitsPerBox: number;
  /** Number of boxes */
  boxCount: number;
  /** totalUnits = unitsPerBox * boxCount */
  totalUnits: number;
  /** Price per box (default from product; admin can override) */
  pricePerBox: number;
  /** totalPrice = boxCount * pricePerBox */
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryDate: string;
  notes?: string;
  createdAt: string;
  status: "new" | "confirmed" | "delivered";
  attachments?: OrderAttachment[];
}

/** Legacy order shape (boxSize + quantity) for backward compatibility when reading DB */
export interface LegacyOrder extends Omit<Order, "productType" | "unitsPerBox" | "boxCount" | "totalUnits" | "pricePerBox" | "totalPrice"> {
  boxSize?: BoxSize;
  quantity?: number;
}

const PRODUCT_BY_BOX_SIZE: Record<number, ProductType> = {
  35: "BOX_35",
  50: "BOX_50",
  70: "BOX_70",
};

function productTypeFromBoxSize(boxSize: number): ProductType {
  return PRODUCT_BY_BOX_SIZE[boxSize] ?? "BOX_35";
}

/** Normalize legacy orders (boxSize + quantity) to new Order shape (productType, boxCount, totals). */
export function normalizeOrder(raw: Order | LegacyOrder): Order {
  if ("productType" in raw && raw.productType && "boxCount" in raw && typeof raw.boxCount === "number") {
    const o = raw as Order;
    const unitsPerBox = o.unitsPerBox ?? getUnitsPerBox(o.productType);
    const totalUnits = o.totalUnits ?? unitsPerBox * o.boxCount;
    const pricePerBox = typeof o.pricePerBox === "number" && o.pricePerBox >= 0 ? o.pricePerBox : getDefaultPrice(o.productType);
    const totalPrice = o.totalPrice ?? o.boxCount * pricePerBox;
    return {
      ...o,
      unitsPerBox,
      totalUnits,
      pricePerBox,
      totalPrice,
    };
  }
  const boxSize = (raw as LegacyOrder).boxSize ?? 35;
  let quantity = (raw as LegacyOrder).quantity ?? 1;
  const productType = productTypeFromBoxSize(boxSize);
  const unitsPerBox = getUnitsPerBox(productType);
  if (quantity > 100 && [35, 50, 70].includes(boxSize)) {
    const inferredBoxCount = Math.round(quantity / boxSize);
    if (inferredBoxCount >= 1) quantity = inferredBoxCount;
  }
  const boxCount = Math.max(1, Math.floor(quantity));
  const pricePerBox = getDefaultPrice(productType);
  const totalUnits = unitsPerBox * boxCount;
  const totalPrice = boxCount * pricePerBox;
  const { boxSize: _bs, quantity: _q, ...rest } = raw as LegacyOrder;
  return {
    ...rest,
    productType,
    unitsPerBox,
    boxCount,
    totalUnits,
    pricePerBox,
    totalPrice,
  } as Order;
}

const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json");

function ensureDataDir() {
  const dir = path.dirname(ORDERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readOrdersRaw(): (Order | LegacyOrder)[] {
  ensureDataDir();
  if (!fs.existsSync(ORDERS_FILE)) return [];
  try {
    const data = fs.readFileSync(ORDERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function readOrders(): Order[] {
  return readOrdersRaw().map(normalizeOrder);
}

function writeOrders(orders: Order[]) {
  ensureDataDir();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
}

export function getAllOrders(): Order[] {
  return readOrders().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export type CreateOrderInput = Omit<Order, "id" | "createdAt" | "status">;

export function createOrder(order: CreateOrderInput): Order {
  const orders = readOrders();
  const newOrder: Order = {
    ...order,
    id: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    status: "new",
  };
  orders.push(newOrder);
  writeOrders(orders);
  return newOrder;
}

export function updateOrderStatus(id: string, status: Order["status"]) {
  const orders = readOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) return null;
  orders[index].status = status;
  writeOrders(orders);
  return orders[index];
}

/** Update order (e.g. admin override pricePerBox). Recomputes totalPrice. */
export function updateOrder(id: string, updates: Partial<Pick<Order, "status" | "pricePerBox" | "productType" | "boxCount">>): Order | null {
  const orders = readOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) return null;
  const order = orders[index];
  if (updates.status !== undefined) order.status = updates.status;
  if (updates.pricePerBox !== undefined) order.pricePerBox = Math.max(0, updates.pricePerBox);
  if (updates.productType !== undefined) {
    order.productType = updates.productType;
    order.unitsPerBox = getUnitsPerBox(updates.productType);
    order.totalUnits = order.unitsPerBox * order.boxCount;
  }
  if (updates.boxCount !== undefined) {
    order.boxCount = Math.max(1, Math.floor(updates.boxCount));
    order.totalUnits = order.unitsPerBox * order.boxCount;
  }
  order.totalPrice = order.boxCount * order.pricePerBox;
  writeOrders(orders);
  return order;
}

export function getOrderById(id: string): Order | null {
  const raw = readOrdersRaw().find((o) => o.id === id);
  return raw ? normalizeOrder(raw) : null;
}

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

export function getOrderUploadDir(orderId: string): string {
  return path.join(UPLOADS_DIR, orderId);
}

export function addOrderAttachment(
  orderId: string,
  attachment: OrderAttachment
): Order | null {
  const orders = readOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) return null;
  const order = orders[index];
  if (!order.attachments) order.attachments = [];
  order.attachments.push(attachment);
  writeOrders(orders);
  return order;
}

export function removeOrderAttachment(orderId: string, storedAs: string): Order | null {
  const orders = readOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) return null;
  const order = orders[index];
  if (!order.attachments) return order;
  const attIndex = order.attachments.findIndex((a) => a.storedAs === storedAs);
  if (attIndex === -1) return order;
  const dir = getOrderUploadDir(orderId);
  const filePath = path.join(dir, storedAs);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // ignore if file already gone
    }
  }
  order.attachments.splice(attIndex, 1);
  writeOrders(orders);
  return order;
}
