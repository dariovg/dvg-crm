/** Dígitos E.164 sin + (España por defecto si empieza por 6/7/9). */
export function normalizePhoneDigits(phone) {
  let d = String(phone || "").replace(/\D/g, "");
  if (!d) return null;
  if (d.length === 9 && /^[679]/.test(d)) d = `34${d}`;
  return d;
}

export function telHref(phone) {
  const d = normalizePhoneDigits(phone);
  return d ? `tel:+${d}` : null;
}

export function whatsAppHref(phone, text = "") {
  const d = normalizePhoneDigits(phone);
  if (!d) return null;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${d}${q}`;
}
