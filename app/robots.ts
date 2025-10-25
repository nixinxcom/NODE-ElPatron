import type { MetadataRoute } from 'next';
import { siteOrigin, IS_PROD } from '@/app/lib/site';

export default function robots(): MetadataRoute.Robots {
  const SITE_URL = siteOrigin();
  return {
    rules: IS_PROD ? { userAgent: '*', allow: '/' } : { userAgent: '*', disallow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL.replace(/^https?:\/\//,''),
  };
}