import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { BrandLoader } from "@/components/BrandLoader";
import { SmoothScroll } from "@/components/SmoothScroll";
import { SiteAtmosphere } from "@/components/SiteAtmosphere";
import { CursorContext } from "@/components/experience/CursorContext";
import { site } from "@/data/site";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Freya — Desarrollos",
    template: "%s · Freya",
  },
  description: site.description,
  metadataBase: new URL("https://www.estudiofreya.com"),
  icons: {
    icon: "/images/brand/logo-iso-black.png",
    apple: "/images/brand/logo-mark.png",
  },
  openGraph: {
    title: "Freya — Desarrollos",
    description: site.description,
    locale: "es_AR",
    type: "website",
  },
};

/**
 * VIEWPORT — declarado explícitamente.
 *
 * `interactiveWidget: "resizes-content"` evita que el teclado virtual
 * (formulario del asesor) desplace el layout por encima del viewport.
 *
 * NOTA — `maximumScale: 1` se omitió a propósito.
 *
 * El patch lo proponía para desalentar el zoom de página. Se descartó por
 * dos razones que pesan más que el beneficio:
 *
 * 1. Bloquear el zoom del documento incumple WCAG 2.1 SC 1.4.4 (Resize
 *    Text). Hay gente que necesita ampliar para leer, y esto se lo impide
 *    en toda la página, no sólo sobre el canvas.
 * 2. No arregla el bug igual. Safari iOS ignora `maximum-scale` desde
 *    iOS 10 — precisamente para que un sitio no pueda hacer esto. El
 *    arreglo real es `useSceneTouch`, que consume el gesto de dos dedos
 *    únicamente sobre el canvas y deja el resto de la página zoomeable.
 *
 * O sea: se pagaba accesibilidad en todo el sitio a cambio de un efecto
 * parcial en un navegador. La corrección acotada al canvas es mejor.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f6f6",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>
        <SmoothScroll />
        <SiteAtmosphere />
        <BrandLoader />
        <a className="skip-link" href="#contenido">
          Saltar al contenido
        </a>
        <div className="site-shell">
          <Header />
          <main id="contenido">{children}</main>
          <Footer />
        </div>
        <WhatsAppButton />
        <CursorContext />
      </body>
    </html>
  );
}
