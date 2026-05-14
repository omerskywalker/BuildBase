import { NextResponse } from "next/server";
import { MONITOR_COOKIE } from "@/lib/constants";
import { safeEqual, signSession } from "@/lib/monitor-auth";

export async function POST(request: Request) {
  const body = await request.json() as { pin?: string };
  const pin = body.pin?.toString().trim() ?? "";
  const storedPin = process.env.ROADMAP_PIN ?? "";

  // safeEqual uses crypto.timingSafeEqual — always takes the same time
  // regardless of where the strings differ, so timing attacks can't be used
  // to guess the PIN one character at a time.
  if (!pin || !safeEqual(pin, storedPin)) {
    // Log the attempt but never the PIN itself — useful for spotting bot probing in Vercel logs
    console.warn(`[monitor/login] failed attempt ip=${request.headers.get("x-forwarded-for") ?? "unknown"}`);
    return NextResponse.json({ success: false, error: "Incorrect PIN" }, { status: 401 });
  }

  // Issue a signed session token: nonce.HMAC(nonce, PIN)
  // The raw PIN never goes into the cookie — only a derived proof of it.
  // Rotating ROADMAP_PIN invalidates all existing sessions automatically.
  const token = signSession(storedPin);

  const response = NextResponse.json({ success: true });
  response.cookies.set(MONITOR_COOKIE, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return response;
}
