import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Conecta Campus",
    short_name: "Conecta Campus",
    description: "Acompanhamento acadêmico, agenda, alertas e planejamento de estudos.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f5faf7",
    theme_color: "#16833f",
    lang: "pt-BR",
    icons: [
      {
        src: "/acadia-logo.jpeg",
        sizes: "1254x1254",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/acadia-logo.jpeg",
        sizes: "1254x1254",
        type: "image/jpeg",
        purpose: "maskable",
      },
    ],
  };
}
