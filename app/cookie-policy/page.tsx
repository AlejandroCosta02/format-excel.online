import type { Metadata } from "next";
import { CookiePolicyContent } from "@/components/legal-content";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How FormatExcel.online uses necessary storage and optional Google Analytics cookies. Spreadsheets stay in your browser.",
};

export default function CookiePolicyPage() {
  return <CookiePolicyContent />;
}
