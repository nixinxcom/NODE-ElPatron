// app/lib/paypal.ts
import type { NextRequest } from "next/server";

type PaypalEnv = "sandbox" | "live";
const ENV: PaypalEnv = (process.env.PAYPAL_ENV as PaypalEnv) || "sandbox";
const API_BASE =
  ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

// Sanitiza (sin comillas/espacios accidentales)
const CLIENT_ID = (process.env.PAYPAL_CLIENT_ID ?? "").trim();
const CLIENT_SECRET = (process.env.PAYPAL_CLIENT_SECRET ?? "").trim();

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn("[paypal] Falta PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET");
}

let tokenCache: { token: string; exp: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.exp) return tokenCache.token;

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const resp = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const txt = await resp.text();
  if (!resp.ok) {
    let reason = txt;
    try {
      const j = JSON.parse(txt);
      reason = j?.error_description || j?.error || j?.message || reason;
    } catch {}
    throw new Error(`PayPal auth failed: ${reason}`);
  }
  const data = JSON.parse(txt);
  tokenCache = {
    token: data.access_token,
    exp: Date.now() + ((data.expires_in ?? 480) - 30) * 1000,
  };
  return tokenCache.token;
}

export type CreateOrderInput = {
  amount: string; // "2800.00"
  currency?: "CAD" | "USD";
  intent?: "CAPTURE" | "AUTHORIZE";
  return_url?: string;
  cancel_url?: string;
  locale?: string;
  metadata?: Record<string, string>;
};

export async function paypalCreateOrder(input: CreateOrderInput) {
  const token = await getAccessToken();

  const body = {
    intent: input.intent || "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: input.currency || "CAD",
          value: String(input.amount),
        },
        custom_id: input?.metadata?.orderRef || undefined,
      },
    ],
    application_context: {
      return_url: input.return_url || undefined,
      cancel_url: input.cancel_url || undefined,
      user_action: "PAY_NOW",
      brand_name: "NIXINX",
      shipping_preference: "NO_SHIPPING",
      locale: input.locale,
    },
  };

  const resp = await fetch(`${API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });

  const txt = await resp.text();
  if (!resp.ok) {
    let msg = txt;
    try {
      const j = JSON.parse(txt);
      msg =
        j?.details?.map((d: any) => `${d.issue}: ${d.description}`).join(" | ") ||
        j?.message ||
        j?.name ||
        txt;
    } catch {
      // dentro del catch de create-order
      const j = JSON.parse(txt);
      msg = j?.details?.map((d: any) => {
        const field = d?.field ? ` @ ${d.field}` : "";
        return `${d.issue}: ${d.description}${field}`;
      }).join(" | ") || j?.message || j?.name || txt;
    }
    throw new Error(`PayPal create-order failed: ${msg}`);
  }
  return JSON.parse(txt);
}

export async function paypalCaptureOrder(orderId: string) {
  const token = await getAccessToken();

  const resp = await fetch(`${API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      Prefer: "return=representation",
    },
    body: "{}",
  });

  const txt = await resp.text();
  if (!resp.ok) {
    let msg = txt;
    try {
      const j = JSON.parse(txt);
      msg = j?.message || j?.name || txt;
    } catch {}
    throw new Error(`PayPal capture-order failed: ${msg}`);
  }
  return JSON.parse(txt);
}

// ---- Self-test: para diagnosticar "Client Authentication failed"
export function paypalEnvSummary() {
  const mask = (s: string) => (s ? `${s.slice(0, 6)}…${s.slice(-4)}` : "");
  return {
    env: ENV,
    apiBase: API_BASE,
    clientIdMask: mask(CLIENT_ID),
    hasSecret: Boolean(CLIENT_SECRET),
  };
}
export async function paypalAuthTest() {
  try {
    await getAccessToken();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
