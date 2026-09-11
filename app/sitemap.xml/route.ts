const SITE_URL = "https://formatexcel.online";
const LASTMOD = "2026-09-01";

const pages = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/cookie-policy", changefreq: "yearly", priority: "0.3" },
] as const;

export function GET() {
  const urls = pages
    .map(
      ({ path, changefreq, priority }) => `  <url>
    <loc>${SITE_URL}${path === "/" ? "" : path}</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
