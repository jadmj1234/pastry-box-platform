import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { isManagerAuthenticatedRequest } from "@/lib/auth";
import { getOrderById, getOrderUploadDir, removeOrderAttachment } from "@/lib/orders";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; filename: string }> }
) {
  if (!isManagerAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { orderId, filename } = await params;
  const order = getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const attachment = order.attachments?.find((a) => a.storedAs === filename);
  if (!attachment) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const dir = getOrderUploadDir(orderId);
  const filePath = path.join(dir, filename);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.filename)}"`,
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; filename: string }> }
) {
  if (!isManagerAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { orderId, filename } = await params;
  const order = getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const attachment = order.attachments?.find((a) => a.storedAs === filename);
  if (!attachment) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  removeOrderAttachment(orderId, filename);
  return NextResponse.json({ ok: true });
}
