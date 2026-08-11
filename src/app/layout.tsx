import type { Metadata } from "next";
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
