/**
 * Formats a date string or Date object to dd-mm-yy format
 * @param date - Date string or Date object
 * @returns Formatted date string (dd-mm-yy)
 */
export const formatDate = (date: string | Date | undefined): string => {
    if (!date) return 'N/A';

    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);

    return `${day}-${month}-${year}`;
};
