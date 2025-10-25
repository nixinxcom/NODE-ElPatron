'use client';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { useMemo, useCallback } from 'react';

type LatLng = { lat: number; lng: number };
type Libraries = ('places' | 'geometry' | 'drawing' | 'visualization')[];

type Props = {
  apiKey?: string;
  center: LatLng;
  zoom?: number;
  markers?: LatLng[];
  /** Tamaño del contenedor */
  height?: number | string;   // ej. 360 o '24rem'
  width?: number | string;    // ej. '100%' (default)
  className?: string;         // clases del contenedor (Tailwind)
  containerStyle?: React.CSSProperties; // estilos extra del contenedor
  /** Opciones de mapa */
  mapTypeId?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  gestureHandling?: 'auto' | 'greedy' | 'cooperative' | 'none';
  disableDefaultUI?: boolean;
  clickableIcons?: boolean;
  mapId?: string; // para Cloud Map Styling
  options?: google.maps.MapOptions; // requiere @types/google.maps
  libraries?: Libraries; // libs extra (p.ej. ['places'])
  /** Comportamiento */
  fitToMarkers?: boolean; // ajusta bounds a center+markers
  onClick?: (e: google.maps.MapMouseEvent) => void;
  onLoad?: (map: google.maps.Map) => void;
};

export default function MapGoogle({
  apiKey = process.env.GOOGLE_MAPS_JS_API_KEY!,
  center,
  zoom = 14,
  markers = [],
  height = 360,
  width = '100%',
  className = '',
  containerStyle,
  mapTypeId = 'roadmap',
  gestureHandling = 'cooperative',
  disableDefaultUI = false,
  clickableIcons = false,
  mapId,
  options,
  libraries = ['places'],
  fitToMarkers = false,
  onClick,
  onLoad,
}: Props) {
  const { isLoaded } = useJsApiLoader({
    id: 'gmap',
    googleMapsApiKey: apiKey,
    libraries,
  });

  const style = useMemo<React.CSSProperties>(() => ({
    width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: '16px',
    overflow: 'hidden',
    ...containerStyle,
  }), [width, height, containerStyle]);

  const handleLoad = useCallback((map: google.maps.Map) => {
    if (fitToMarkers) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(center);
      markers.forEach(m => bounds.extend(m));
      map.fitBounds(bounds);
    }
    onLoad?.(map);
  }, [fitToMarkers, center, markers, onLoad]);

  if (!isLoaded) return <div className={`bg-gray-100 ${className}`} style={style} />;

  return (
    <GoogleMap
      mapContainerStyle={style}
      center={center}
      zoom={zoom}
      onLoad={handleLoad}
      onClick={onClick}
      options={{
        mapId,
        disableDefaultUI,
        clickableIcons,
        gestureHandling,
        mapTypeId,
        ...options,
      }}
    >
      {[center, ...markers].map((m, i) => <MarkerF key={i} position={m} />)}
    </GoogleMap>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: MapGoogle — complements/components/Maps/MapGoogle/MapGoogle.tsx
QUÉ HACE:
  Wrapper de Google Maps JS API que renderiza mapa y marcadores, con callbacks.

API / EXPORTS / RUTA:
  — export interface GMarker { id:string; position:{lat:number;lng:number}; title?:string; icon?:string }
  — export interface MapGoogleProps {
      apiKey?: string; center?: {lat:number;lng:number}; zoom?: number;
      markers?: GMarker[]; onMarkerClick?: (m:GMarker)=>void; className?: string; style?: React.CSSProperties
    }
  — export default function MapGoogle(p:MapGoogleProps): JSX.Element

USO (ejemplo completo):
  <MapGoogle center={{lat:42.053,lng:-82.6}} zoom={12} markers={[{id:"pbg",position:{lat:42.053,lng:-82.6},title:"El Patrón"}]} />

NOTAS CLAVE:
  — Cargar script JS API con key (NEXT_PUBLIC_GOOGLE_MAPS_JS_API_KEY).
  — Idempotencia de instancia; limpiar listeners en unmount.
  — Accesibilidad con overlays HTML cuando haga falta.

DEPENDENCIAS:
  Google Maps JS API · mapsconfig (opcional)
────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────
DOC: USO — complements/components/Maps/MapGoogle/MapGoogle.tsx
  "use client";
  import MapGoogle from "@/complements/components/Maps/MapGoogle/MapGoogle";

  export default function MapSection() {
    return (
      <MapGoogle
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_JS_API_KEY} // string | opcional (si no se carga global)
        center={{ lat:42.053, lng:-82.6 }}  // {lat,lng} | opcional
        zoom={12}                            // number | opcional
        markers={[
          { id:"pbg", position:{ lat:42.053, lng:-82.6 }, title:"El Patrón" } // GMarker
        ]}                                  // GMarker[] | opcional
        onMarkerClick={(m)=>console.log(m)} // (m:GMarker)=>void | opcional
        className="h-[400px] w-full rounded-xl"
      />
    );
  }
────────────────────────────────────────────────────────── */
