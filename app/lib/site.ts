// app/lib/site.ts
export const IS_PROD = process.env.VERCEL_ENV === 'production';

const requireEnv = (v: string | undefined, name: string) => {
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
};

export function siteOrigin(): string {
  const fallback =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? fallback;

  const selected: string = IS_PROD
    ? requireEnv(process.env.NEXT_PUBLIC_PROD_ORIGIN, 'NEXT_PUBLIC_PROD_ORIGIN')
    : base;

  return selected.replace(/\/$/, '');
}