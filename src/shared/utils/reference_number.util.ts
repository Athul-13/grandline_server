/**
 * Reference number utility functions
 * Generates unique reference numbers for quotes and reservations
 */
export function generateReferenceNumber(
  prefix: 'QOT' | 'RSV'
): string {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  const random = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}-${yy}${mm}${dd}${random}`;
}

