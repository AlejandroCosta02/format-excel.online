export type Review = {
  id: string;
  name: string;
  initials: string;
  rating: number;
  role: { en: string; es: string };
  quote: { en: string; es: string };
};

/** Placeholder testimonials — edit this array to add or replace reviews. */
export const REVIEWS: Review[] = [
  {
    id: "r1",
    name: "Elena Vargas",
    initials: "EV",
    rating: 5,
    role: { en: "Operations Manager", es: "Gerente de operaciones" },
    quote: {
      en: "Weekly supplier dumps used to take an hour to clean. Now I format in the browser and reuse the same template.",
      es: "Los Excel de proveedores me llevaban una hora. Ahora los formateo en el navegador y reutilizo la misma plantilla.",
    },
  },
  {
    id: "r2",
    name: "Marcus Chen",
    initials: "MC",
    rating: 5,
    role: { en: "Data Analyst", es: "Analista de datos" },
    quote: {
      en: "Client-side processing was the deal-breaker. Sensitive sheets never leave my laptop.",
      es: "El procesamiento en el cliente fue decisivo. Las hojas sensibles no salen de mi portátil.",
    },
  },
  {
    id: "r3",
    name: "Sofia Almeida",
    initials: "SA",
    rating: 5,
    role: { en: "Accountant", es: "Contadora" },
    quote: {
      en: "Mail merge with a daily free quota let me try it on real letters before paying once for Pro.",
      es: "El mail merge con cupo gratis me dejó probar cartas reales antes de pagar Pro una sola vez.",
    },
  },
  {
    id: "r4",
    name: "James Okafor",
    initials: "JO",
    rating: 5,
    role: { en: "Logistics Coordinator", es: "Coordinador de logística" },
    quote: {
      en: "Manifest extractor filters the search column and exports only the rows I need. Huge time saver.",
      es: "El extractor de manifiestos filtra la columna de búsqueda y exporta solo las filas que necesito.",
    },
  },
  {
    id: "r5",
    name: "Priya Nair",
    initials: "PN",
    rating: 5,
    role: { en: "Freelance Bookkeeper", es: "Asesora contable freelance" },
    quote: {
      en: "No signup for basic formatting. I upgraded later for templates — one payment, not a subscription.",
      es: "Sin registro para formatear. Pasé a Pro por las plantillas: un pago, no una suscripción.",
    },
  },
];
