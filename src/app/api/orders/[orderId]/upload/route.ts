import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { isManagerAuthenticatedRequest } from "@/lib/auth";
import { getOrderById, getOrderUploadDir, addOrderAttachment } from "@/lib/orders";
import type { AttachmentType } from "@/lib/orders";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  if (!isManagerAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { orderId } = await params;
  const order = getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const type = (formData.get("type") as AttachmentType) || "other";

  if (!file || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const validTypes: AttachmentType[] = ["bit", "receipt", "other"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid type. Use bit, receipt, or other." }, { status: 400 });
  }

  const dir = getOrderUploadDir(orderId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const ext = path.extname(file.name) || "";
  const storedAs = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const filePath = path.join(dir, storedAs);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  fs.writeFileSync(filePath, buffer);

  const attachment = {
    filename: file.name,
    storedAs,
    type,
    uploadedAt: new Date().toISOString(),
  };
  addOrderAttachment(orderId, attachment);

  return NextResponse.json({ ok: true, attachment });
}
