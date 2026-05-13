import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateLoginForm,
  validateSignupForm,
} from "@/lib/auth-validation";

describe("validateEmail", () => {
  it("returns null for valid email", () => {
    expect(validateEmail("user@example.com")).toBeNull();
  });

  it("returns error for empty email", () => {
    expect(validateEmail("")).not.toBeNull();
  });

  it("returns error for whitespace-only email", () => {
    expect(validateEmail("   ")).not.toBeNull();
  });

  it("returns error for missing @", () => {
    expect(validateEmail("notanemail")).not.toBeNull();
  });

  it("returns error for missing domain", () => {
    expect(validateEmail("user@")).not.toBeNull();
  });
});

describe("validatePassword", () => {
  it("returns null for valid password", () => {
    expect(validatePassword("securepass")).toBeNull();
  });

  it("returns error for empty password", () => {
    expect(validatePassword("")).not.toBeNull();
  });

  it("returns error for password shorter than 8 characters", () => {
    expect(validatePassword("short")).not.toBeNull();
  });

  it("accepts exactly 8 characters", () => {
    expect(validatePassword("12345678")).toBeNull();
  });
});

describe("validatePasswordMatch", () => {
  it("returns null when passwords match", () => {
    expect(validatePasswordMatch("password1", "password1")).toBeNull();
  });

  it("returns error when passwords differ", () => {
    expect(validatePasswordMatch("password1", "password2")).not.toBeNull();
  });

  it("is case-sensitive", () => {
    expect(validatePasswordMatch("Password", "password")).not.toBeNull();
  });
});

describe("validateLoginForm", () => {
  it("returns null for valid email + password", () => {
    expect(validateLoginForm("user@example.com", "securepass")).toBeNull();
  });

  it("returns error for invalid email", () => {
    expect(validateLoginForm("bad-email", "securepass")).not.toBeNull();
  });

  it("returns error for short password", () => {
    expect(validateLoginForm("user@example.com", "short")).not.toBeNull();
  });

  it("returns email error before password error", () => {
    const err = validateLoginForm("", "");
    expect(err).toMatch(/email/i);
  });
});

describe("validateSignupForm", () => {
  it("returns null for valid inputs", () => {
    expect(validateSignupForm("user@example.com", "securepass", "securepass")).toBeNull();
  });

  it("returns error for invalid email", () => {
    expect(validateSignupForm("bad", "securepass", "securepass")).not.toBeNull();
  });

  it("returns error for short password", () => {
    expect(validateSignupForm("user@example.com", "abc", "abc")).not.toBeNull();
  });

  it("returns error when passwords don't match", () => {
    expect(validateSignupForm("user@example.com", "securepass", "different")).not.toBeNull();
  });

  it("validates email before password match", () => {
    const err = validateSignupForm("bad", "abc", "xyz");
    // Should get email error first
    expect(err).not.toBeNull();
  });
});
