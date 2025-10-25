/*---------------------------------------------------------
 ------------- README COMPONENT INSTRUCTIONS: -------------
 Type: Component
 Import statement:
 import GeolocationComp from '@/...path.../GeolocationComp'
 Add one states to retrive the uer location:

 const [ Location, setLocation ] = useState() //Has to be empty.

 Implement the component based on this component interface.
    <GeolocationComp 
        GeoIcon={'/Icons/CountryIcon.png'} //Icon
        GeoLabel={LangLegends['Geolocation.enable']} //Optional Label
        classNames={''} //optional classes
        styles={{width:'28px', height:'28px'}} //optional styles
        Msg_denied={LangLegends['Geolocation.denied']} //message to retrieve when the geolocation has been denied
        Msg_unavailable={LangLegends['Geolocation.unavailable']} //message to retrieve when the geolocation is unavailable
        Msg_timeout={LangLegends['Geolocation.timeout']} //message to retrieve when the time has run out
        Msg_unknown={LangLegends['Geolocation.unknown']}  //message to retrieve when the geolocation is unknown
        Msg_not_supported={LangLegends['Geolocation.not_supported']} //message to retrieve when the geolocation is not supported by the navigator
        setState={setLocation}  //State to retrieve the User location data (Latitude, Longitude, Locales, Locale, DateTime) to be used.
    />
---------------------------------------------------------*/
'use client';

import React from "react";
import Image from "next/image";
import styles from "./GeolocationComp.module.css";
import enableGeolocation from "./enableGeolocation";

export interface GeolocationPayload {
  lat?: number;
  lng?: number;
  accuracy?: number;
  datenow?: Date;
  locale?: string;
  lngs?: readonly string[];
  error?: string;
  code?: number;
  key?: string;
}

interface IGeolocation {
  GeoIcon: string;
  GeoLabel?: string;
  classNames?: string;
  styles?: React.CSSProperties;
  Msg_denied: string;
  Msg_unavailable: string;
  Msg_timeout: string;
  Msg_unknown: string;
  Msg_not_supported: string;
  setState: (v: GeolocationPayload) => void;
}

export default function GeolocationComp(props: IGeolocation) {
  const handleClick = () => enableGeolocation(props);

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={styles.GeoComp}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={props.GeoLabel ?? "Enable geolocation"}
    >
      <div className={`${styles.GeolocationComp} ${props.classNames ?? ""}`} style={props.styles}>
        <Image src={props.GeoIcon} alt="Geolocation" fill />
      </div>
      {props.GeoLabel}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: Componente de geolocalización — functionalities/GeolocationComp/GeolocationComp.tsx
QUÉ HACE:
  UI cliente que solicita permiso de ubicación, muestra estado y expone la posición al padre
  mediante callbacks/control.

API / EXPORTS / RUTA:
  — export interface GeolocationCompProps {
      onResolve?: (coords:{lat:number;lng:number;accuracy?:number}) => void  // opcional
      onError?: (message:string) => void                                     // opcional
      autoRequest?: boolean                                                  // opcional | default: true
      className?: string                                                     // opcional
    }
  — export default function GeolocationComp(props: GeolocationCompProps): JSX.Element

USO (ejemplo completo):
  "use client";
  import GeolocationComp from "@/functionalities/GeolocationComp/GeolocationComp";
  <GeolocationComp onResolve={(c)=>console.log(c)} onError={(e)=>alert(e)} />

NOTAS CLAVE:
  — Accesibilidad: explicar por qué se solicita la ubicación; botones claramente etiquetados.
  — Privacidad: no persistir coords sin consentimiento; ofrecer “Omitir”.
  — Rendimiento: evitar re-solicitar en cada render; memoizar handlers.

DEPENDENCIAS:
  ./enableGeolocation
────────────────────────────────────────────────────────── */
