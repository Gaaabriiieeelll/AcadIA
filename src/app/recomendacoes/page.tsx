import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Plano de estudos e IA",
};

export default function RecommendationsPage() {
  permanentRedirect("/plano-de-estudos#bate-papo-ia");
}
