export type SiteStat = {
  value: number;
  label: string;
  /** Texto después del número, ej. "+", " m²" */
  suffix?: string;
  /** Separador de miles estilo AR (punto). Default true si value >= 1000 */
  useThousandsDot?: boolean;
  durationMs?: number;
};

/** Datos de contacto — reemplazar por los oficiales de Freya antes de publicar. */
export const site = {
  name: "Freya",
  tagline: "Desarrollos residenciales con obra propia y personalización real",
  description:
    "Desarrollamos edificios residenciales en Buenos Aires, en barrios con proyección: Caballito, Saavedra, Villa Devoto y más.",
  url: "https://www.estudiofreya.com",
  contact: {
    email: "contacto@estudiofreya.com",
    phoneDisplay: "+54 11 5555-0100",
    phoneTel: "+541155550100",
    address: "Buenos Aires, Argentina",
    hours: "Lunes a viernes, 10 a 18 hs",
  },
  social: {
    instagram: "https://instagram.com/",
    linkedin: "https://linkedin.com/",
  },
  stats: [
    {
      value: 20,
      suffix: "+",
      label: "Años de trayectoria",
      durationMs: 1600,
    },
    {
      value: 20,
      suffix: "+",
      label: "Proyectos desarrollados",
      durationMs: 1700,
    },
    {
      value: 2800,
      suffix: " m²",
      useThousandsDot: true,
      label: "Edificios de mayor escala en CABA",
      durationMs: 2000,
    },
    {
      value: 3,
      label: "Zonas con obra entregada",
      durationMs: 1200,
    },
  ] satisfies SiteStat[],
  zones: ["Caballito", "Saavedra", "Villa Devoto"],
} as const;

export function mailtoUrl(email: string, body?: string) {
  if (!body) return `mailto:${email}`;
  return `mailto:${email}?body=${encodeURIComponent(body)}`;
}

export function formatStatNumber(
  value: number,
  useThousandsDot?: boolean,
): string {
  const rounded = Math.round(value);
  const shouldDot = useThousandsDot ?? rounded >= 1000;
  if (!shouldDot) return String(rounded);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
