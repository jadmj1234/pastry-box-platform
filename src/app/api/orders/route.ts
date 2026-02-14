import { NextRequest, NextResponse } from "next/server";
import { createOrder, getAllOrders, updateOrder, updateOrderStatus } from "@/lib/orders";
import { isManagerAuthenticatedRequest } from "@/lib/auth";
import { getDefaultPrice, getUnitsPerBox } from "@/lib/settings";
import type { ProductType } from "@/lib/settings";

const VALID_PRODUCT_TYPES: ProductType[] = ["BOX_35", "BOX_50", "BOX_70"];

function parseProductType(v: unknown): ProductType | null {
  if (typeof v !== "string") return null;
  return VALID_PRODUCT_TYPES.includes(v as ProductType) ? (v as ProductType) : null;
}

export async function GET(request: NextRequest) {
  if (!isManagerAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const orders = getAllOrders();
    return NextResponse.json(orders);
  } catch (e) {
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productType: productTypeRaw,
      boxCount: boxCountRaw,
      pricePerBox: pricePerBoxRaw,
      boxSize: boxSizeRaw,
      quantity: quantityRaw,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      deliveryDate,
      notes,
    } = body;

    let productType: ProductType;
    let boxCount: number;

    if (productTypeRaw != null && parseProductType(productTypeRaw)) {
      productType = parseProductType(productTypeRaw)!;
      boxCount = Math.max(1, Math.floor(Number(boxCountRaw)) || 1);
    } else if (boxSizeRaw != null && [35, 50, 70].includes(Number(boxSizeRaw))) {
      const boxSize = Number(boxSizeRaw) as 35 | 50 | 70;
      productType = boxSize === 35 ? "BOX_35" : boxSize === 50 ? "BOX_50" : "BOX_70";
      boxCount = Math.max(1, Math.floor(Number(quantityRaw)) || 1);
    } else {
      return NextResponse.json(
        { error: "Missing or invalid product: send productType (BOX_35, BOX_50, BOX_70) and boxCount, or legacy boxSize and quantity" },
        { status: 400 }
      );
    }

    if (
      !customerName ||
      !customerPhone ||
      !deliveryAddress ||
      !deliveryDate
    ) {
      return NextResponse.json(
        { error: "Missing required fields: customerName, customerPhone, deliveryAddress, deliveryDate" },
        { status: 400 }
      );
    }

    const unitsPerBox = getUnitsPerBox(productType);
    const defaultPrice = getDefaultPrice(productType);
    const pricePerBox =
      pricePerBoxRaw != null && Number(pricePerBoxRaw) >= 0
        ? Number(pricePerBoxRaw)
        : defaultPrice;
    const totalUnits = unitsPerBox * boxCount;
    const totalPrice = boxCount * pricePerBox;

    const order = createOrder({
      productType,
      unitsPerBox,
      boxCount,
      totalUnits,
      pricePerBox,
      totalPrice,
      customerName: String(customerName).trim(),
      customerPhone: String(customerPhone).trim(),
      customerEmail: customerEmail ? String(customerEmail).trim() : undefined,
      deliveryAddress: String(deliveryAddress).trim(),
      deliveryDate: String(deliveryDate).trim(),
      notes: notes ? String(notes).trim() : undefined,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isManagerAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { id, status, pricePerBox, productType, boxCount } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    const updates: Parameters<typeof updateOrder>[1] = {};
    if (status !== undefined) {
      if (!["new", "confirmed", "delivered"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = status;
    }
    if (pricePerBox !== undefined) {
      const p = Number(pricePerBox);
      if (p < 0 || Number.isNaN(p)) {
        return NextResponse.json({ error: "pricePerBox must be >= 0" }, { status: 400 });
      }
      updates.pricePerBox = p;
    }
    if (productType !== undefined) {
      if (!parseProductType(productType)) {
        return NextResponse.json({ error: "Invalid productType" }, { status: 400 });
      }
      updates.productType = productType as ProductType;
    }
    if (boxCount !== undefined) {
      const bc = Math.floor(Number(boxCount));
      if (bc < 1 || Number.isNaN(bc)) {
        return NextResponse.json({ error: "boxCount must be >= 1" }, { status: 400 });
      }
      updates.boxCount = bc;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates" }, { status: 400 });
    }

    const order = updateOrder(id, updates);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
