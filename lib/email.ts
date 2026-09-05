import { Resend } from "resend";

const FROM = "FormatExcel <admin@formatexcel.online>";
const DASHBOARD_URL = "https://formatexcel.online/dashboard";

export async function sendWelcomeProEmail(userEmail: string, userName: string): Promise<void> {
  const apiKey = (process.env.RESEND_API_KEY ?? "").trim();
  if (!apiKey) {
    throw new Error("Falta RESEND_API_KEY");
  }

  const name = userName.trim() || "hola";
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: userEmail,
    subject: "¡Bienvenido a FormatExcel Pro! 🚀 Tu cuenta ha sido activada",
    html: welcomeHtml(name),
  });

  if (error) {
    throw new Error(error.message);
  }
}

function welcomeHtml(name: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FormatExcel Pro</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Geist,Segoe UI,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8FAFC;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#2563eb;padding:24px 28px;color:#ffffff;">
              <p style="margin:0;font-size:13px;letter-spacing:.04em;text-transform:uppercase;opacity:.9;">FormatExcel</p>
              <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;">Tu plan Pro ya está activo</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 12px;font-size:16px;">Hola ${escapeHtml(name)},</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                Confirmamos tu pago y activamos <strong>FormatExcel Pro</strong> en tu cuenta.
                Ya puedes usar las herramientas sin los límites del plan gratis.
              </p>
              <ul style="margin:0 0 24px;padding-left:20px;color:#334155;font-size:15px;line-height:1.7;">
                <li>Plantillas ilimitadas y aplicación en 1 clic</li>
                <li>Mail merge masivo, sin cupo diario</li>
                <li>Procesamiento en lote de varios archivos</li>
              </ul>
              <a href="${DASHBOARD_URL}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">
                Ir a mis herramientas Pro
              </a>
              <p style="margin:24px 0 0;font-size:12px;color:#64748b;line-height:1.5;">
                Si no fuiste tú quien realizó este pago, responde a este correo y lo revisamos.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
