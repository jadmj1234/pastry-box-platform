import { NextRequest, NextResponse } from "next/server";
import { MANAGER_PASSWORD, getSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = body?.password ?? "";

    if (password !== MANAGER_PASSWORD) {
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
