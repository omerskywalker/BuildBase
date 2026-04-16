/**
 * Monitor authentication helpers.
 *
 * THREE PRINCIPLES APPLIED HERE:
 *
 * 1. Timing-safe comparison — never use `===` to compare secrets. Plain
 *    string equality short-circuits on the first mismatched character, so an
 *    attacker can measure response time to guess the secret one character at a
 *    time. `crypto.timingSafeEqual` always takes the same time regardless of
 *    where the strings differ.
 *
 * 2. HMAC-signed session tokens — after the user enters the correct PIN, we
 *    issue a token: `nonce.HMAC-SHA256(nonce, PIN)`. The nonce makes every
 *    session unique; the HMAC makes it unforgeable without the PIN. The raw
 *    PIN never touches the cookie — only a derived, verifiable proof of it.
 *
 * 3. Separation of credentials — the human-facing PIN and the machine-to-
 *    machine API key are separate secrets. A leaked workflow log exposing
 *    MONITOR_API_KEY doesn't compromise the monitor login, and vice versa.
 */

import { createHmac, randomBytes, timingSafeEqual } from "crypto";

/** Timing-safe string comparison. Both args are UTF-8 encoded before compare. */
export function safeEqual(a: string, b: string): boolean {
  // Strings must be the same byte length for timingSafeEqual — pad the
  // shorter one so we don't leak length info via an early error/exception.
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    // Still run the comparison on same-length buffers to keep constant time,
    // then return false. We compare bufA against itself so the call isn't
    // optimised away.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Issue a signed session token: `<hex-nonce>.<hex-HMAC>`.
 * The PIN is used as the HMAC key, so the token proves the holder knew the
 * PIN at the time of issue — without storing the PIN in the cookie.
 */
export function signSession(pin: string): string {
  const nonce = randomBytes(16).toString("hex");
  const mac = createHmac("sha256", pin).update(nonce).digest("hex");
  return `${nonce}.${mac}`;
}

/**
 * Verify a session token issued by `signSession`.
 * Re-derives the expected HMAC and compares with timingSafeEqual.
 */
export function verifySession(token: string, pin: string): boolean {
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const nonce = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = createHmac("sha256", pin).update(nonce).digest("hex");
  return safeEqual(mac, expected);
}
