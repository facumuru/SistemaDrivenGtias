import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Garantías Driven",
  description: "Portal de gestión de garantías para distribuidores Driven",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
