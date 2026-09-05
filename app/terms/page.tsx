import type { Metadata } from "next";
import { TermsContent } from "@/components/legal-content";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Free vs Pro plans, acceptable use, disclaimers, and refund policy for FormatExcel.online.",
};

export default function TermsPage() {
  return <TermsContent />;
}
