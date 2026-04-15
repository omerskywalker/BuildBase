import { NextResponse } from "next/server";
import { MONITOR_COOKIE } from "@/lib/constants";

export async function POST(request: Request) {
  const body = await request.json() as { pin?: string };
  const pin = body.pin?.toString().trim();

  if (!pin || pin !== process.env.ROADMAP_PIN) {
    return NextResponse.json({ success: false, error: "Incorrect PIN" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(MONITOR_COOKIE, "1", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return response;
}
