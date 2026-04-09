import { ShowVenue } from '@/services/ai-chat';

export function formatCurrency(value: number) {
  return `\u20B9 ${value}`;
}

export function flattenShows(venues: ShowVenue[]) {
  return venues.map((venue) => ({
    ...venue,
    normalizedShows: Object.entries(venue.shows).flatMap(([format, timings]) =>
      timings.map((timing) => ({
        ...timing,
        format,
      }))
    ),
  }));
}

export function getAccentColor(format: string) {
  if (format === 'IMAX 3D') {
    return '#38A04A';
  }
  if (format === '3D') {
    return '#7A7A7A';
  }
  if (format === 'INSIGNIA') {
    return '#A12C7A';
  }
  return '#3E8C2E';
}

export function getFormatGradient(format: string): [string, string] {
  if (format.includes('IMAX')) {
    return ['#2E0699', '#00BFFF'];
  }
  if (format === '3D') {
    return ['#5E0694', '#FF003C'];
  }
  if (format === 'INSIGNIA') {
    return ['#5A2AA6', '#FF4FA2'];
  }
  return ['#6A6A6A', '#B9B9B9'];
}
