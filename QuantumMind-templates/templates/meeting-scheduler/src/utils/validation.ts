/**
 * Validate email format (basic check).
 * Must contain @ with at least one char before and one char after.
 */
export function isValidEmail(email: string): boolean {
  const atIndex = email.indexOf('@');
  return atIndex >= 1 && atIndex < email.length - 1;
}

/**
 * Check if the confirmation form is valid.
 * Valid when:
 *   - name contains at least 1 non-whitespace character
 *   - email contains @ with at least one character before and after
 */
export function isFormValid(name: string, email: string): boolean {
  return name.trim().length >= 1 && isValidEmail(email);
}
