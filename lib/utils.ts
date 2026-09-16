// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const FRENCH_DAYS = [
  { key: "MONDAY", label: "Lundi", short: "Lun" },
  { key: "TUESDAY", label: "Mardi", short: "Mar" },
  { key: "WEDNESDAY", label: "Mercredi", short: "Mer" },
  { key: "THURSDAY", label: "Jeudi", short: "Jeu" },
  { key: "FRIDAY", label: "Vendredi", short: "Ven" },
  { key: "SATURDAY", label: "Samedi", short: "Sam" },
  { key: "SUNDAY", label: "Dimanche", short: "Dim" },
] as const;

export function formatWeekRangeFrench(startDate: Date, endDate: Date): string {
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const monthFormatter = new Intl.DateTimeFormat("fr-FR", { month: "short" });
  const yearFormatter = new Intl.DateTimeFormat("fr-FR", { year: "numeric" });

  const startMonth = monthFormatter.format(startDate);
  const endMonth = monthFormatter.format(endDate);
  const year = yearFormatter.format(endDate);

  if (startMonth === endMonth) {
    return `${startDay} → ${endDay} ${endMonth} ${year}`;
  }
  return `${startDay} ${startMonth} → ${endDay} ${endMonth} ${year}`;
}

export function formatDateFrench(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeFrench(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
