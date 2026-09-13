/**
 * Timezone-safe date utility functions to prevent off-by-one errors
 * when displaying or editing dates stored in PostgreSQL DATE format.
 */

/**
 * Extracts YYYY-MM-DD string from any date input without UTC shifting.
 * Safe for <input type="date"> values.
 */
export const toDateInputValue = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    // Check for YYYY-MM-DD prefix directly
    const match = dateInput.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) {
      return match[1];
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a date string (YYYY-MM-DD or ISO) into Indian locale format (e.g., '2 Jan 2026')
 * without timezone off-by-one shifts.
 */
export const formatDate = (
  dateInput: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateInput) return '-';

  if (typeof dateInput === 'string') {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      const localDate = new Date(year, month, day);
      return localDate.toLocaleDateString(
        'en-IN',
        options || {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }
      );
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString(
    'en-IN',
    options || {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );
};
