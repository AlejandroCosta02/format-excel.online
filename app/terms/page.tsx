import type { Metadata } from "next";
import { TermsContent } from "@/components/legal-content";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Free vs Pro plans, acceptable use, disclaimers, and refund policy for FormatExcel.online.",
  alternates: { canonical: "https://formatexcel.online/terms" },
};

export default function TermsPage() {
  return <TermsContent />;
}
