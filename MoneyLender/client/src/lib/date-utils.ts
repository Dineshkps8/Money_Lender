import { addWeeks, format } from "date-fns";

export function calculateEndDate(startDate: string, weeks: number = 10): string {
  const start = new Date(startDate);
  const end = addWeeks(start, weeks);
  return format(end, "yyyy-MM-dd");
}

export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '₹0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numAmount);
}

export function getCurrentDate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatDate(date: string): string {
  return format(new Date(date), "dd.MM.yyyy");
}

export function getDayName(date: string): string {
  return format(new Date(date), "EEEE");
}

export function getCurrentCollectionLine(): string {
  const now = new Date();
  const dayName = format(now, "EEEE").toLowerCase();
  const hour = now.getHours();
  
  switch (dayName) {
    case "monday":
    case "wednesday":
      return hour < 16 ? `${dayName}-morning` : `${dayName}-evening`;
    case "tuesday":
    case "thursday":
      return `${dayName}-morning`;
    default:
      return "monday-morning"; // Default fallback
  }
}

export function getCollectionLineDisplay(line: string): string {
  const [day, time] = line.split('-');
  const dayCapitalized = day.charAt(0).toUpperCase() + day.slice(1);
  const timeCapitalized = time ? time.charAt(0).toUpperCase() + time.slice(1) : '';
  return `${dayCapitalized} ${timeCapitalized}`.trim();
}
