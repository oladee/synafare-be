export function daysUntilExpiry(expiry: string | Date): number {
  // Ensure expiry is a Date
  const expiryDate = expiry instanceof Date ? expiry : new Date(expiry);

  // Today's date (normalized to midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get the difference in milliseconds (using getTime() for TS type safety)
  const diffMs = expiryDate.getTime() - today.getTime();

  // Convert ms → days
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
