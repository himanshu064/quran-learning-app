import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/seo.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/lessons/", "/admin/", "/api/", "/maintenance/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
