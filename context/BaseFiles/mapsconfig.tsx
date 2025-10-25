export const PlacesCategories = {
    "en":["Universities","Schools","Doctors","Hospitals","Drugstore","Banks","ATMs","Supermartet","Stores","Department stores","Commerce","Shops","Bars","Night clubs","Tourist attractions","Parks","Movie theaters","Restaurants","GYMs","Beauty salons","Clothing stores","Subway stations"],
    "es":["Universidades","Escuelas","Doctores","Hospitales","Farmacias","Bancos","Cajeros","Supermercados","Tiendas","Tiendas Departamentales","Comercios","Tiendas","Bares","Clubes Nocturnos","Atracciones Turísticas","Parques","Cines","Restaurantes","Gimnasios","Salones de Belleza","Tiendas de Ropa","Estaciones de transporte"],
    "fr":["Universités","Écoles","Médecins","Hôpitaux","Pharmacie","Banques","Caissiers","Supermarchés","Magasins","Boutiques départementales","Magasins","Magasins","pubs","Les boites de nuit","Attractions touristiques","Parcs","Cinémas","Restaurants","Gymnases","Salons de beauté","Magasins de vêtements","Stations de transport"],
    "de":["Universitäten","Schulen","Ärzte","Krankenhäuser","Apotheke","Banken","Kassierer","Supermärkte","Shops","Warenhäuser","Geschäfte","Shops","Pubs","Nachtclubs","Sehenswürdigkeiten","Parks","Kinos","Restaurants","Turnhallen","Schönheitssalons","Kleidungsgeschäft","Transportstationen"],
    "it":["Università","Scuole","Medici","Ospedali","Farmacia","Banche","Cassieri","Supermercati","I negozi","grandi magazzini","Negozi","I negozi","pub","Locali notturni","Cose da vedere","Parks","Cinema","Ristoranti","Palestre","Saloni di bellezza","Negozi di vestiti","Stazioni di trasporto"],
    "pt":["Universidades","Escolas","Doutores","Hospitais","Farmacia","Bancos","Caixas","Supermercados","Lojas","Lojas de departamentos","Lojas","Lojas","pubs","Casas noturnas","Atrações turísticas","Parques","Cinemas","Restaurantes","Ginásios","Salões de beleza","Lojas de roupa","Estações de transporte"],
    "ee":["Ülikoolid","Koolid","Arstid","Haiglad","Apteek","Pangad","Kassapidajad","Supermarketid","Kauplused","Kaubamajad","Poed","Kauplused","pubid","Ööklubid","Vaatamisväärsused","Pargid","Kinod","Restoranid","Spordisaalid","Ilusalongid","Riidepoed","Transpordijaamad"],
    "NIX":["university","schools","doctor","hospitals","drugstore","bank","atm","supermartet","stores","department_store","commerce","shops","bar","night_club","tourist_attraction","parks","movie_theater","restaurants","gym","beauty_salon","clothing_store","subway_statio"],
}

/* ─────────────────────────────────────────────────────────
DOC: Config de mapas — context/BaseFiles/mapsconfig.tsx
QUÉ HACE:
  Define constantes y helpers para inicializar mapas (Google Maps JS API o Mapbox),
  como centro/zoom por defecto, estilos, claves públicas y configuraciones de marcadores.

API / EXPORTS / RUTA:
  — export const MAPS_CONFIG = {
      provider: "google"|"mapbox",           // proveedor de mapas
      defaultCenter: { lat:number, lng:number }, // centro por defecto
      defaultZoom: number,                    // zoom inicial (ej. 12)
      styles?: any,                           // estilos (JSON de Google o styleId de Mapbox)
      language?: "es"|"en"|"fr",              // idioma del mapa/labels
      region?: string,                        // región (ej. "CA")
      boundsPadding?: number|{top:number;right:number;bottom:number;left:number} // padding para fitBounds
    }
  — export const MAPS_KEYS = {
      google: string | undefined,             // NEXT_PUBLIC_GOOGLE_MAPS_JS_API_KEY
      mapbox: string | undefined              // MAPBOX_ACCESS_TOKEN
    }
  — export const MARKER_ICONS: Record<string, { url:string; size?:[number,number]; anchor?:[number,number] }>
  — (opcional) export function buildMarker(iconKey:string, overrides?:Partial<{url:string;size:[n,n];anchor:[n,n]}>) => Google | Mapbox icon

USO (ejemplo completo):
  // Tipo | opcional | valores permitidos | default
  import { MAPS_CONFIG, MAPS_KEYS } from "@/context/BaseFiles/mapsconfig";
  // Google: <script src="https://maps.googleapis.com/maps/api/js?key=MAPS_KEYS.google&language=es&region=CA">
  // Mapbox: mapboxgl.accessToken = MAPS_KEYS.mapbox

NOTAS CLAVE:
  — Seguridad: solo claves públicas (NEXT_PUBLIC_*). No exponer secretos.
  — i18n: language/region afectan toponimia; alinear con locale del sitio.
  — Rendimiento: usar styles livianos; desactivar POIs si no son necesarios.
  — Accesibilidad: contraste adecuado de estilos; markers con aria-label si se usan overlays HTML.

DEPENDENCIAS:
  Google Maps JS API o Mapbox GL JS (según provider)
────────────────────────────────────────────────────────── */
