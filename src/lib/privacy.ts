export const PRIVACY_CONTACT = "info@makiwa.ke";
export const RETENTION = { visitsDays: 90, closedRequestsMonths: 12, financialYears: 7 } as const;

export function familyDisplayName(name: string, initialsOnly = false): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Family member";
  const initials = (words: string[]) => words.map(word => `${Array.from(word)[0].toUpperCase()}.`).join("");
  return initialsOnly ? initials(parts) : `${parts[0]}${parts.length > 1 ? ` ${initials(parts.slice(1))}` : ""}`;
}

export function maskPhone(phone?: string | null): string {
  if (!phone) return "";
  if (phone.includes("X")) return phone;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254")) digits = `0${digits.slice(3)}`;
  if (digits.length < 6) return "Hidden";
  return `${digits.slice(0, 2)}XX XXX ${digits.slice(-3)}`;
}

export function maskReceiptPhones(html: string): string {
  return html.replace(/(?:\+?254|0)[17]\d{8}\b/g, value => maskPhone(value));
}

export function mayPublishFamily(consent: boolean): boolean { return consent === true; }
export function mayDownload(userId?: string | null): boolean { return Boolean(userId); }