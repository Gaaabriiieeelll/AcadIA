import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Script from "next/script";

import "./globals.css";

const themeInitializer = `
  (function () {
    try {
      var storedTheme = localStorage.getItem("acadia-theme");
      var theme = storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch (error) {
      document.documentElement.dataset.theme = "light";
      document.documentElement.style.colorScheme = "light";
    }
  })();
`;

export const metadata: Metadata = {
  title: {
    default: "AcadIA",
    template: "%s · AcadIA",
  },
  description: "Plataforma acadêmica inteligente em desenvolvimento para estudantes do IFPB Campus João Pessoa.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: "#16833f",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        {children}
        <Script id="acadia-theme-initializer" nonce={nonce} strategy="beforeInteractive">
          {themeInitializer}
        </Script>
      </body>
    </html>
  );
}
