import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = body?.password ?? "";
    // Read at request time so server env var is used (not inlined at build)
    const expectedPassword = process.env.MANAGER_PASSWORD ?? "";

    if (!expectedPassword || password !== expectedPassword) {
      return NextResponse.json({ error: "סיסמה שגויה", ok: false }, { status: 401 });
    }

    const cookie = getSessionCookie();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(cookie.name, cookie.value, {
      httpOnly: true,
      path: cookie.path,
      maxAge: cookie.maxAge,
      sameSite: cookie.sameSite,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "שגיאה", ok: false }, { status: 500 });
  }
}
