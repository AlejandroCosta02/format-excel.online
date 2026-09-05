import type { Metadata } from "next";
import { PrivacyContent } from "@/components/legal-content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How FormatExcel.online handles spreadsheet processing, Google sign-in, Pro templates, and crypto payments.",
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
