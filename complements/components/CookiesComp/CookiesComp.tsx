/*---------------------------------------------------------
 ------------- README FUNCTION INSTRUCTIONS: --------------
 Type: Component
 Import statements:
    import CookiesComp from  '@/...path.../Cookiesfunc'
 Import Modules:
    import { getCookie, getCookies, setCookie, deleteCookie } from 'cookies-next';

 Instructions:

    1) Create a state to save and retrieve the user election. It can be locally at the page to be used or as a global user context (Recomended).
    const [UsrCookie,setUsrCookie] = useState(null)

    2) Import component statement and Modules statement in the page to be used as described above. This will show the modal form for the user election.
    import CookiesComp from  '@/...path.../Cookiesfunc'
    import { getCookie, getCookies, setCookie, deleteCookie } from 'cookies-next';

    3) Insert the component as follow: (This will display the Cookies modal form ONLY IF it hasn't been selected before by the user)
    {UsrCookie == null && 
        <CookiesComp 
            setState={setUsrCookie} //Pass the state defined in step 1 to the required parameter "setState"
            coockieTitle={LangLegends['Cookie.Title']}
            coockieAccept={LangLegends['Cookie.Accept']}
            coockieReject={LangLegends['Cookie.Reject']}
            coockieRead={LangLegends['Cookie.Read']}
            coockieIcon='/Icons/DayNightIcon.png'
            contract={'Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus delectus incidunt quas vero deserunt molestiae voluptates, natus nobis. Magnam odio libero, ullam sequi dolores id tempora. Aliquid in hic saepe.'}
        />}

    4) Make use of next commands to set, get or delete the cookies:
        setCookie('key','value') // Set the pair key, value cookie
        getCookie('key') // Retrieve the value of a specific cookie 
        getCookies() // Retrieve all cookies set before
        deleteCookie('key') // Delete the specified cookie

    5) Optional tool: Make use of below code to validate the cookies funcionality (Sample based on Global User Context)

    const [LocalCookies, setLocalCookies] = useState(getCookies())
    useEffect(()=>{
        setEnvironment({...Environment, Cookies: UsrCookie})
        if (UsrCookie){setEnvironment({...Environment, CookiesSaved: getCookies()})}
        else if (!UsrCookie){setEnvironment({...Environment, CookiesSaved: null})}
        
        THE NEXT COMMENTED LINE BELOW DISABLE THE ESLINT REQUIREMENT TO ADD 'Environment.UserContext.UserSeeting.Navigation' TO THE DEPENDENCY ARRAY SO IT HAS TO BE THERE

        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[UsrCookie, LocalCookies])

    {UsrCookie !== null &&
        <div>
            <button onClick={()=>{
                setCookie('key','value')
                setLocalCookies(getCookies())
                }}>set cookie 'Key'</button>
            <button onClick={()=>{
                getCookie('key')
                alert(getCookie('key'))
                }}>get cookie 'Key'</button>
            <button onClick={()=>{
                getCookies()
                console.log(Environment.UserContext.UserSeeting.Navigation.CookiesSaved)
                }}>get all cookies</button>
            <button onClick={()=>{
                deleteCookie('key')
                setLocalCookies(getCookies())
            }}>delete cookie 'Key'</button>
        </div>
    }
---------------------------------------------------------*/
'use-client'
//Libraries
import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import Image from 'next/image';
import UpdateUserState from '@/functionalities/CommonFunctions/UpdateUserStateFunc';
import { FormattedMessage } from 'react-intl';
import FM from "@/complements/i18n/FM";
//Styles
import styles from './CookiesComp.module.css';

interface ICookie{
    contract: any,
    setState?: any,
    coockieTitle: string
    coockieIcon: string,
    coockieAlt: string,
    style?: {},
    classNames?: string,
}

export default function CookiesComp({contract, setState, coockieTitle, coockieIcon, coockieAlt, style, classNames}: ICookie){
    const {userState} = useAppContext()
    const [ViewCookiesContract, setViewCookiesContract] = useState(false)

    return (
        <>
            <div className={styles.CookiePoint} style={style}>
                <p className={styles.CookieLegend}>{coockieTitle}</p>
                    <div className={styles.Btns}>
                        <div className={styles.cookieBtn} onClick={() => {UpdateUserState({UserState: userState, keyPath: 'Digital.Cookies', updatedValue: false, replace: false}), setViewCookiesContract(false), setState(false)}}>
                            <p className={styles.BtnLegend}><FM id="global.Reject" defaultMessage="Reject"/></p>
                        </div>
                        <div className={styles.cookieBtn} onClick={() => {UpdateUserState({UserState: userState, keyPath: 'Digital.Cookies', updatedValue: true, replace: false}), setViewCookiesContract(false), setState(true)}}>
                            <p className={styles.BtnLegend}><FM id="global.Accept" defaultMessage="Accept"/></p>
                        </div>
                    </div>
                    <div>
                        <Image
                            id={styles.Coockimage}
                            src={coockieIcon}
                            alt={coockieAlt}
                            width={35}
                            height={35}
                        />
                    </div>
                <span id={styles.cookiesnotification} className={classNames} onClick={()=>setViewCookiesContract(!ViewCookiesContract)}><FM id="global.Read" defaultMessage="Read"/></span>
            </div>
            {ViewCookiesContract && 
                <div className={styles.coockieWindow} style={styles}>
                    <div className={styles.contract}>{contract}</div>
                    <button className={styles.cookieBtn} onClick={()=>setViewCookiesContract(!ViewCookiesContract)}><FM id="global.ClosePopUp" defaultMessage="Close"/></button>
                </div>
            }
        </>
    )
}

/* ─────────────────────────────────────────────────────────
DOC: CookiesComp — complements/components/CookiesComp/CookiesComp.tsx
QUÉ HACE:
  Banner de consentimiento de cookies/analytics con opciones Aceptar/Rechazar/Configurar.
  Persiste decisión (cookie/localStorage) y expone callback onChange.

API / EXPORTS / RUTA:
  — export interface CookiesCompProps {
      storage?: "cookie"|"local"                   // opcional | default: "cookie"
      policyHref?: string                          // opcional | enlace a política
      className?: string
      onChange?: (consent:{analytics:boolean; ads:boolean}) => void
    }
  — export default function CookiesComp(p:CookiesCompProps): JSX.Element

USO (ejemplo completo):
  <CookiesComp policyHref="/privacidad" onChange={(c)=>console.log(c)} />

NOTAS CLAVE:
  — Cumplir normativas (CMP si aplica). Bloquear scripts hasta consentimiento.
  — Accesibilidad: foco al abrir; navegación por teclado; textos claros.

DEPENDENCIAS:
  Helpers de cookies/storage · (opcional) GTM consent mode
────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
DOC: USO (ejemplo completo) — complements/components/CookiesComp/CookiesComp.tsx
  "use client";
  import CookiesComp from "@/complements/components/CookiesComp/CookiesComp";

  export default function Consent() {
    return (
      <CookiesComp
        storage="cookie"                         // "cookie"|"local" | opcional | default: "cookie"
        policyHref="/privacidad"                 // string | opcional
        className="fixed bottom-0 inset-x-0"
        onChange={(c)=>console.log("consent:", c)} // (consent) => void | opcional
      />
    );
  }
  // Consent shape: { analytics:boolean; ads:boolean }
────────────────────────────────────────────────────────── */
