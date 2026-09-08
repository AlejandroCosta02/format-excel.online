"use client";

import Link from "next/link";
import { OpenCookieSettingsButton } from "@/components/cookie-consent-banner";
import { useI18n } from "@/lib/i18n/provider";

const PRIVACY = {
  en: [
    {
      title: "Who we are",
      body: "FormatExcel.online (“we”) provides browser-based spreadsheet tools. This policy explains how we handle information when you use https://formatexcel.online.",
    },
    {
      title: "Spreadsheet files you process",
      body: "Excel, CSV, Word templates, and manifest files are processed locally in your browser whenever possible. We do not persistently store your raw workbooks or mail-merge source files on our servers as part of the free formatting workflow. You remain responsible for the files you choose to open on your device.",
    },
    {
      title: "Account and Google authentication",
      body: "If you sign in with Google, we receive basic profile data (such as name, email, and avatar) from Google OAuth and keep a matching row in our Supabase `profiles` table so we can recognize your session and Pro status.",
    },
    {
      title: "Pro templates",
      body: "If you save a Pro template, we store the template configuration (headers, styles, formulas, match criteria)—not a full copy of every workbook—associated with your user ID, protected by row-level security.",
    },
    {
      title: "Payments",
      body: "Pro checkout is processed by NOWPayments. We receive payment status via a signed IPN webhook and update `subscription_status`. We do not store cryptocurrency private keys. Transaction details may be processed by NOWPayments according to their own policy.",
    },
    {
      title: "Email",
      body: "After a successful Pro payment we may send a transactional welcome email via Resend from admin@formatexcel.online.",
    },
    {
      title: "Cookies and local storage",
      body: "We use session cookies for authentication, local storage for language preference and guest mail-merge quotas, and theme preference. You can clear these in your browser.",
    },
    {
      title: "Contact",
      body: "Privacy questions: admin@formatexcel.online.",
    },
  ],
  es: [
    {
      title: "Quiénes somos",
      body: "FormatExcel.online (“nosotros”) ofrece herramientas de hojas de cálculo en el navegador. Esta política describe cómo tratamos la información en https://formatexcel.online.",
    },
    {
      title: "Archivos que procesas",
      body: "Excel, CSV, plantillas Word y manifiestos se procesan en tu navegador siempre que es posible. No almacenamos de forma persistente tus libros de cálculo sensibles en nuestros servidores como parte del flujo gratuito de formateo. Eres responsable de los archivos que abras en tu dispositivo.",
    },
    {
      title: "Cuenta y autenticación con Google",
      body: "Si inicias sesión con Google, recibimos datos básicos de perfil (nombre, email y avatar) y guardamos una fila en `profiles` de Supabase para reconocer tu sesión y el estado Pro.",
    },
    {
      title: "Plantillas Pro",
      body: "Si guardas una plantilla Pro, almacenamos la configuración (cabeceras, estilos, fórmulas, criterios)—no una copia completa de cada Excel—asociada a tu usuario y protegida con RLS.",
    },
    {
      title: "Pagos",
      body: "El checkout Pro lo procesa NOWPayments. Recibimos el estado del pago por IPN firmado y actualizamos `subscription_status`. No guardamos claves privadas de cripto.",
    },
    {
      title: "Correo",
      body: "Tras un pago Pro correcto podemos enviar un email transaccional con Resend desde admin@formatexcel.online.",
    },
    {
      title: "Cookies y almacenamiento local",
      body: "Usamos cookies de sesión, localStorage para idioma y cupos de mail merge de invitados, y la preferencia de tema. Puedes borrarlas en el navegador.",
    },
    {
      title: "Contacto",
      body: "Consultas de privacidad: admin@formatexcel.online.",
    },
  ],
};

const TERMS = {
  en: [
    {
      title: "Acceptance",
      body: "By using FormatExcel.online you agree to these terms. If you do not agree, do not use the service.",
    },
    {
      title: "Free vs Pro",
      body: "The free tier lets you format and export spreadsheets, run a limited daily mail merge, and extract one manifest file up to 2 MB. Signing in with Google does not by itself grant Pro. Pro is a one-time NOWPayments crypto checkout (not a monthly subscription). Features activate after webhook confirmation.",
    },
    {
      title: "Acceptable use",
      body: "You may only process files you have the right to use. Do not abuse the service, attempt to bypass quotas, attack infrastructure, or upload malware. We may suspend access for abuse.",
    },
    {
      title: "Disclaimer",
      body: "Tools are provided “as is”. Output formulas, mail-merge documents, and extracted rows should be reviewed before you rely on them for business, legal, or financial decisions. We are not liable for data loss on your device or for third-party outages (Google, NOWPayments, Resend, hosting).",
    },
    {
      title: "Refunds",
      body: "Crypto payments are generally final once confirmed on-chain. If a payment was captured but Pro was not activated due to a technical error on our side, contact admin@formatexcel.online with the payment ID and we will investigate. Refunds, if any, are handled case by case.",
    },
    {
      title: "Contact",
      body: "admin@formatexcel.online",
    },
  ],
  es: [
    {
      title: "Aceptación",
      body: "Al usar FormatExcel.online aceptas estos términos. Si no estás de acuerdo, no uses el servicio.",
    },
    {
      title: "Gratis vs Pro",
      body: "El plan gratis permite formatear y exportar, un mail merge con cupo diario y extraer un manifiesto de hasta 2 MB. Iniciar sesión con Google no otorga Pro. Pro es un pago único con cripto (NOWPayments), no una suscripción mensual. Las funciones se activan tras confirmar el pago.",
    },
    {
      title: "Uso aceptable",
      body: "Solo procesa archivos que tengas derecho a usar. No eludas cupos, no ataques la infraestructura ni subas malware. Podemos suspender el acceso por abuso.",
    },
    {
      title: "Exención de responsabilidad",
      body: "Las herramientas se ofrecen “tal cual”. Revisa fórmulas, cartas y extractos antes de usarlos en decisiones de negocio. No respondemos por pérdida de datos en tu dispositivo ni por caídas de terceros.",
    },
    {
      title: "Reembolsos",
      body: "Los pagos cripto suelen ser definitivos una vez confirmados en blockchain. Si se capturó un pago y Pro no se activó por un error nuestro, escribe a admin@formatexcel.online con el ID de pago. Los reembolsos, si procede, se estudian caso a caso.",
    },
    {
      title: "Contacto",
      body: "admin@formatexcel.online",
    },
  ],
};

const COOKIES = {
  en: [
    {
      title: "What this policy covers",
      body: "This page explains cookies and similar storage on FormatExcel.online. Spreadsheet files you open in the formatter, manifest extractor, and mail merge tools are processed in your browser. We do not upload those workbooks to our servers as part of formatting.",
    },
    {
      title: "Strictly necessary cookies and local storage",
      body: "We use authentication cookies/session storage for Google sign-in, and local storage for language, theme, guest mail-merge daily quota, and your cookie preference. These are required for the site to work as designed.",
    },
    {
      title: "Analytics cookies (optional)",
      body: "If you accept analytics, we load Google Analytics (gtag) to count visits and events. This does not include your Excel file contents. You can decline analytics in Cookie settings; then gtag is not loaded.",
    },
    {
      title: "Feedback and accounts",
      body: "Optional feedback messages and Pro template settings are stored in our database when you submit them or save a template. That is not done via marketing cookies.",
    },
    {
      title: "How to change your choice",
      body: "Use Cookie settings on this page or clear site data in your browser. Questions: admin@formatexcel.online.",
    },
  ],
  es: [
    {
      title: "Qué cubre esta política",
      body: "Esta página explica las cookies y el almacenamiento similar en FormatExcel.online. Los Excel que abres en el formateador, el extractor y el mail merge se procesan en tu navegador. No subimos esos libros a nuestros servidores como parte del formateo.",
    },
    {
      title: "Cookies y local storage necesarias",
      body: "Usamos cookies/sesión para el inicio de sesión con Google, y local storage para idioma, tema, cupo diario de mail merge de invitados y tu preferencia de cookies. Son necesarias para que el sitio funcione.",
    },
    {
      title: "Cookies de analítica (opcionales)",
      body: "Si aceptas analítica, cargamos Google Analytics (gtag) para contar visitas y eventos. No incluye el contenido de tus Excel. Puedes rechazarla en Ajustes de cookies; entonces no se carga gtag.",
    },
    {
      title: "Feedback y cuentas",
      body: "Los mensajes de feedback y las plantillas Pro se guardan en nuestra base de datos cuando los envías o guardas una plantilla. Eso no va por cookies de marketing.",
    },
    {
      title: "Cómo cambiar tu elección",
      body: "Usa Ajustes de cookies en esta página o borra los datos del sitio en el navegador. Consultas: admin@formatexcel.online.",
    },
  ],
};

export function PrivacyContent() {
  const { t, locale } = useI18n();
  const sections = PRIVACY[locale];
  return (
    <main>
    <article className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <p className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          {t.legal.back}
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{t.legal.privacyTitle}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t.legal.privacyUpdated}</p>
      {sections.map((section) => (
        <section key={section.title} className="mt-8">
          <h2 className="text-lg font-medium">{section.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
        </section>
      ))}
    </article>
    </main>
  );
}

export function TermsContent() {
  const { t, locale } = useI18n();
  const sections = TERMS[locale];
  return (
    <main>
    <article className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <p className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          {t.legal.back}
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{t.legal.termsTitle}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t.legal.termsUpdated}</p>
      {sections.map((section) => (
        <section key={section.title} className="mt-8">
          <h2 className="text-lg font-medium">{section.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
        </section>
      ))}
    </article>
    </main>
  );
}

export function CookiePolicyContent() {
  const { t, locale } = useI18n();
  const cookieSections = COOKIES[locale];
  return (
    <main>
      <article className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <p className="text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            {t.legal.back}
          </Link>
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{t.legal.cookiesTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.legal.cookiesUpdated}</p>
        {cookieSections.map((section) => (
          <section key={section.title} className="mt-8">
            <h2 className="text-lg font-medium">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
        <div className="mt-10">
          <OpenCookieSettingsButton />
        </div>
      </article>
    </main>
  );
}
