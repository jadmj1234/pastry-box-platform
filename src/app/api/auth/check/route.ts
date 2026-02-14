import { NextRequest, NextResponse } from "next/server";
import { isManagerAuthenticatedRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authenticated = isManagerAuthenticatedRequest(request);
  return NextResponse.json({ authenticated });
}
