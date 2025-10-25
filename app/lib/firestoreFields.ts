// app/lib/firestoreFields.ts
// Helpers para convertir entre objetos JS y el formato tipado de Firestore REST v1.
//  - toFirestoreDocument(data) -> { fields: ... } listo para enviar en el body
//  - fromFirestoreDocument(json) -> objeto JS normal (decodifica {fields} / {document: {fields}})

export type FirestoreValue =
  | { nullValue: null }
  | { booleanValue: boolean }
  | { stringValue: string }
  | { integerValue: string }         // Firestore REST espera string para enteros
  | { doubleValue: number }
  | { timestampValue: string }       // ISO 8601
  | { bytesValue: string }           // base64
  | { referenceValue: string }       // "projects/{p}/databases/(default)/documents/col/doc"
  | { geoPointValue: { latitude: number; longitude: number } }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

export function toFirestoreDocument(data: Record<string, any>): { fields: Record<string, FirestoreValue> } {
  return { fields: encodeMap(data) };
}

export function fromFirestoreDocument(json: any): any {
  // Acepta {fields} o {document:{fields}}
  const fields = json?.fields ?? json?.document?.fields ?? {};
  return decodeMap(fields);
}

export function buildUpdateMaskTopLevel(data: Record<string, any>): string[] {
  // Para PATCH merge: ?updateMask.fieldPaths=campo1&updateMask.fieldPaths=campo2...
  return Object.keys(data ?? {});
}

/* -------------------------------- Internos -------------------------------- */

function encodeMap(obj: Record<string, any>): Record<string, FirestoreValue> {
  const out: Record<string, FirestoreValue> = {};
  for (const [k, v] of Object.entries(obj ?? {})) out[k] = encodeValue(v);
  return out;
}

function encodeValue(v: any): FirestoreValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') {
    // Si te interesa detectar refs reales, pasa strings que empiecen con "projects/"
    if (v.startsWith('projects/') && v.includes('/documents/')) return { referenceValue: v };
    return { stringValue: v };
  }
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };

  // Bytes: Buffer | Uint8Array
  if (isBytesLike(v)) return { bytesValue: toBase64(v) };

  // GeoPoint: {latitude, longitude} | {lat, lng}
  if (isGeoPointLike(v)) {
    const { latitude, longitude } = normalizeGeo(v);
    return { geoPointValue: { latitude, longitude } };
  }

  // Map/object
  return { mapValue: { fields: encodeMap(v as Record<string, any>) } };
}

function decodeMap(fields: Record<string, any>): any {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields ?? {})) out[k] = decodeValue(v as FirestoreValue);
  return out;
}

function decodeValue(val: FirestoreValue): any {
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return val.booleanValue;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return val.doubleValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('bytesValue' in val) return val.bytesValue; // base64 (decodifícalo donde lo necesites)
  if ('referenceValue' in val) return val.referenceValue;
  if ('geoPointValue' in val) return { latitude: val.geoPointValue.latitude, longitude: val.geoPointValue.longitude };
  if ('arrayValue' in val) return (val.arrayValue.values ?? []).map(decodeValue);
  if ('mapValue' in val) return decodeMap(val.mapValue.fields ?? {});
  return undefined;
}

/* -------------------------------- Utils -------------------------------- */

function isBytesLike(v: any): v is Uint8Array | { type?: string; data?: number[] } {
  return v instanceof Uint8Array || (v && v.type === 'Buffer' && Array.isArray(v.data));
}
function toBase64(v: any): string {
  if (typeof Buffer !== 'undefined') {
    if (v instanceof Uint8Array) return Buffer.from(v).toString('base64');
    if (v?.type === 'Buffer' && Array.isArray(v.data)) return Buffer.from(v.data).toString('base64');
  }
  // Fallback naive
  return (v?.toString?.() ?? '') as string;
}

function isGeoPointLike(v: any): boolean {
  return (
    v &&
    ((typeof v.latitude === 'number' && typeof v.longitude === 'number') ||
      (typeof v.lat === 'number' && typeof v.lng === 'number'))
  );
}
function normalizeGeo(v: any): { latitude: number; longitude: number } {
  if (typeof v.latitude === 'number' && typeof v.longitude === 'number') return v;
  return { latitude: v.lat, longitude: v.lng };
}
