import { NextRequest, NextResponse } from "next/server";
import { deleteOrder } from "@/lib/orders";
import { isManagerAuthenticatedRequest } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  if (!isManagerAuthenticatedRequest(_request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orderId = params?.orderId;
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }
  try {
    const deleted = deleteOrder(orderId);
    if (!deleted) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
