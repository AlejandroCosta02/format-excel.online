"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useI18n } from "@/lib/i18n/provider";

export function FaqSection() {
  const { t } = useI18n();
  const items = [
    { q: t.faq.q1, a: t.faq.a1 },
    { q: t.faq.q2, a: t.faq.a2 },
    { q: t.faq.q3, a: t.faq.a3 },
    { q: t.faq.q4, a: t.faq.a4 },
    { q: t.faq.q5, a: t.faq.a5 },
  ];

  return (
    <section id="faq" className="scroll-mt-24">
      <h2 className="text-2xl font-semibold tracking-tight">{t.faq.title}</h2>
      <Accordion type="single" collapsible className="mt-4 rounded-xl border bg-card px-4">
        {items.map((item, index) => (
          <AccordionItem key={item.q} value={`item-${index + 1}`}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent>{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
