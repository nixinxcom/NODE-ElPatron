// app/lib/branding/types.ts

export interface BrandRecord {
  company?: iBrandCompany;
  agentAI?: iBrandAgentAI;
  socials?: iSocMedia[];
  platforms?: iPlatform[];
  contact?: iContact;
  schedule?: iSchedule[];
  holidays?: iHoliday[];
  products?: iProds[];
  services?: iServs[];
  more?: {
    [k: string]: any;  // espacio para futuras expansiones
  };
  [k: string]: any; // ← extensible para cada cliente
}

/* ---------- Compañía ---------- */
export interface iBrandCompany {
  legalName?: string;
  brandName?: string;
  logo?: string;
  tagline?: string;
  contact?: {
    website?: string;
    phone?: string;
    email?: string;
    address?: {
      street?: string,
      number?: string,
      interior?: string,
      city?: string,
      state?: string,
      zip?: string,
      country?: string,
    }
  },
  terms?: string;
  privacy?: string;
  mission?: string;
  vision?: string;
  values?: string[];
  branches?: Branch[]; // ← arreglo tipado
}
export interface Branch {
  name: string;
  url: string;
  icon?: string;
}
/* ---------- Agent / AI ---------- */
export interface iBrandAgentAI {
  name: string;
  role: string;
  description?: string;
  tone?: string;
  greeting?: string;
  farewell?: string;
  unknown_response?: string;
  fallback_when_unsure?: string;
}
/* ---------- Socials & Platforms ---------- */
export interface iSocMedia {
  name: "facebook" | "instagram" | "tiktok" | "youtube" | "linkedin" | "twitter" | "twitch" | "discord" | "snapchat" | "telegram" | "pinterest" | string;
  url: string;
  username?: string;
  icon?: string;
}
export interface iPlatform {
  name:  "onlineorder" | "uber" | "doordash" | "skipthedishes" | "amazon" | "tripadvisor" | "airbnb" | "booking" | "etsy" | "shopify" | "wix" | "squarespace" | "magento" | "bigcommerce" | string;
  url: string;
  icon?: string;
}
/* ---------- Contacto ---------- */
export interface iContact {
  address?: Address;
  phone?: string;
  email?: string;
  whatsapp?: string;
  map?: string;
  directions?: string;
  google?: string;
  googleMaps?: string;
}
export interface Address {
  intNumber?: string;
  extNumber?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
}
/* ---------- Horarios ---------- */
export interface iSchedule {
  day: string;              // "day1"..."day7" (o el formato que uses)
  open: string | null;      // "HH:mm" o null
  break?: string | null;    // "HH:mm" o null
  return?: string | null;   // "HH:mm" o null
  close: string | null;     // "HH:mm" o null
}
/* ---------- Holiday ---------- */
export interface iHoliday {
  name: string;
  date: string; // "YYYY-MM-DD"
}
/* ---------- Catálogos ---------- */
export interface iProds {
  prodName: string;
  description?: string;
  price?: string; // "$A" | "$B" etc.
  image?: string;
  video?: string;
  gallery?: string[];
  url?: string;
  category?: string;
  subcategory?: string;
}
/* ---------- Servicios ---------- */
export interface iServs {
  servName: string;
  description?: string;
  price?: string; // "$A" | "$B" etc.
  image?: string;
  video?: string;
  gallery?: string[];
  url?: string;
  category?: string;
  subcategory?: string;
}