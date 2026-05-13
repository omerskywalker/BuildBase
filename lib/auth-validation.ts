/** Returns an error string or null if valid */
export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  return null;
}

/** Returns an error string or null if valid */
export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

/** Returns an error string or null if passwords match */
export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) return "Passwords do not match.";
  return null;
}

/** Validates login form fields; returns first error or null */
export function validateLoginForm(email: string, password: string): string | null {
  return validateEmail(email) ?? validatePassword(password);
}

/** Validates signup form fields; returns first error or null */
export function validateSignupForm(
  email: string,
  password: string,
  confirm: string
): string | null {
  return (
    validateEmail(email) ??
    validatePassword(password) ??
    validatePasswordMatch(password, confirm)
  );
}
