import type { Metadata, Viewport } from "next";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://estrategic-adv.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Estrategic ADV — Sistema de Gestão Jurídica",
    template: "%s | Estrategic ADV",
  },
  description:
    "Plataforma completa de gestão jurídica para advogados: controle de processos, prazos, intimações, andamentos via DataJud CNJ, clientes e relatórios.",
  keywords: [
    "gestão jurídica",
    "software jurídico",
    "sistema para advogados",
    "controle de processos",
    "intimações PJe",
    "DataJud CNJ",
    "agenda jurídica",
    "prazos processuais",
    "escritório de advocacia",
  ],
  authors: [{ name: "Estrategic ADV" }],
  creator: "Estrategic ADV",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: BASE_URL,
    siteName: "Estrategic ADV",
    title: "Estrategic ADV — Sistema de Gestão Jurídica",
    description:
      "Controle processos, prazos, intimações e andamentos do CNJ em um único sistema. Feito para advogados brasileiros.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Estrategic ADV — Gestão Jurídica",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1a56db",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
