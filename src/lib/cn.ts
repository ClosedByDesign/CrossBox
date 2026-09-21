type ClassValue = string | number | null | undefined | false | ClassValue[] | Record<string, boolean | undefined>;

/** Schlanker Klassennamen-Helfer – reicht für unsere Tailwind-Komposition */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  const walk = (value: ClassValue) => {
    if (!value) return;
    if (typeof value === 'string' || typeof value === 'number') {
      out.push(String(value));
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (typeof value === 'object') {
      Object.entries(value).forEach(([key, enabled]) => {
        if (enabled) out.push(key);
      });
    }
  };
  values.forEach(walk);
  return out.join(' ');
}
