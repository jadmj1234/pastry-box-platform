import { NextRequest } from "next/server";

/** Cookie name for manager session. Password is read from process.env.MANAGER_PASSWORD at request time in the login API. */
export const COOKIE_NAME = "manager_auth";
const SESSION_TOKEN = "pastry_manager_secure_session";

export function isManagerAuthenticatedRequest(request: NextRequest): boolean {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  return token === SESSION_TOKEN;
}

export function getSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: SESSION_TOKEN,
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax" as const,
  };
}
