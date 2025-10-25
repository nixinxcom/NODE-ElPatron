// lib/seo/pages.ts
import type { PageMetaInput } from "@/app/lib/seo/meta";

export const pageMeta: Record<string, PageMetaInput> = {
    home: {
        title: "El Patrón — Lugar de ambiente latino en Leamington",
        description:
            "“Ambiente latino en Leamington: música en vivo, cocteles, botanas y eventos para todos. Reserva hoy y vive la experiencia multicultural de El Patrón.”",
        keywords: [
            "ambiente latino","música en vivo","cocteles","Leamington",
            "eventos","multicultural","mexicanos en Ontario","menonitas","canadienses"
        ],
        alternates: { canonical: "/" },
        ogImage: "/og/home.png"
    },
    menu: {
        title: "Menú — El Patrón",
        description: "“Explora nuestro menú con botanas y sabores latinos en Leamington. Cocteles, platos para compartir y opciones para cada gusto. ¡Conoce precios y especialidades!”",
        keywords: [
            "menú", "botanas", "cocteles", "cocina latina", "mexicana",
            "Leamington", "Ontario"
        ],
        alternates: { canonical: "/menus" },
        ogImage: "/og/menu.png"
    },
    reservas: {
        title: "Reservaciones — El Patrón",
        description: "“Reserva tu mesa en El Patrón y disfruta música latina, cocteles y un ambiente multicultural en Leamington. Atención rápida para grupos y celebraciones.”",
        keywords: ["reservaciones","mesa","evento","cocteles","Leamington","Ontario"],
        alternates: { canonical: "/reservas" },
        ogImage: "/og/reservas.png"
    },
    sobrenosotros: {
        title: "Sobre nosotros — El Patrón",
        description: "“Conoce la historia y el espíritu de El Patrón: un lugar de ambiente latino en Leamington con música, cocteles y comunidad para todas las culturas.”",
        keywords: ["sobre nosotros","equipo","historia","Leamington","Ontario"],
        alternates: { canonical: "/sobrenosotros" },
        ogImage: "/og/sobrenosotros.png"
    },
    CloudQueries: {
        title: "Cloud Queries — El Patrón",
        description: "Herramientas internas para consultas y administración en la nube de El Patrón. Acceso restringido; utilidades técnicas y mantenimiento.",
        keywords: ["utilidades","interno"],
        robots: { index: false, follow: false },
        alternates: { canonical: "/CloudQueries" },
        ogImage: "/og/CloudQueries.png"
    },
    emailmarketing: {
        title: "Email marketing — El Patrón",
        description: "“Gestiona tus preferencias de correo para eventos y promociones de El Patrón. Puedes suscribirte o darte de baja en cualquier momento.”",
        keywords: ["suscripción","email","preferencias"],
        robots: { index: false, follow: false },
        alternates: { canonical: "/emailmarketing" },
        ogImage: "/og/Emailmarketing.png"
    },
    landingeng: {
        title: "Promoción especial — El Patrón",
        description: "“El Patrón special offer in Leamington: music, cocktails, and a Latin atmosphere. Limited seating. Book or check out the offer here.”",
        keywords: ["promoción","oferta","evento","Leamington"],
        alternates: { canonical: "/landingeng" },
        ogImage: "/og/landingeng.png"
    },
    landingesp: {
        title: "Promoción especial — El Patrón",
        description: "“Promoción especial de El Patrón en Leamington: música, cocteles y ambiente latino. Cupos limitados. Reserva o conoce la oferta aquí.”",
        keywords: ["promoción","oferta","evento","Leamington"],
        alternates: { canonical: "/landingesp" },
        ogImage: "/og/landingesp.png"
    },
    landingfra: {
        title: "Promoción especial — El Patrón",
        description: "“Promoción especial de El Patrón en Leamington: música, cocteles y ambiente latino. Cupos limitados. Reserva o conoce la oferta aquí.”",
        keywords: ["promoción","oferta","evento","Leamington"],
        alternates: { canonical: "/landingfra" },
        ogImage: "/og/landingfra.png"
    },
    galeria: {
        title: "Galería — El Patrón",
        description: "“Mira fotos del ambiente latino en El Patrón: eventos, música en vivo y momentos en Leamington. Inspírate para tu próxima visita o celebración.”",
        keywords: ["galería","fotos","eventos","música","Leamington"],
        alternates: { canonical: "/galeria" },
        ogImage: "/og/galeria.png"
    },
    pdfs: {
        title: "Documentos — El Patrón",
        description: "“Centro de documentos y utilidades internas de El Patrón en Leamington. Acceso a PDFs y herramientas.”",
        keywords: ["documentos","pdf"],
        robots: { index: false, follow: false },
        alternates: { canonical: "/pdf" },
        ogImage: "/og/pdfs.png"
    },
    suscritos: {
        title: "Suscripción confirmada — El Patrón",
        description: "“¡Listo! Tu suscripción fue confirmada. Pronto recibirás novedades de eventos, música y promociones de El Patrón en Leamington.”",
        robots: { index: false, follow: false },
        alternates: { canonical: "/suscritos" },
        ogImage: "/og/suscritos.png"
    },
    desuscritos: {
        title: "Baja de la suscripción — El Patrón",
        description: "“Has cancelado tu suscripción de El Patrón. Si cambias de opinión, puedes volver a registrarte para recibir eventos y promociones.”",
        robots: { index: false, follow: false },
        alternates: { canonical: "/desuscritos" },
        ogImage: "/og/desuscritos.png"
    },
    landing: {
        title: "Landing — El Patrón",
        description: "“Regístrate para recibir eventos y promociones de El Patrón en Leamington. Música, cocteles y comunidad multicultural. Baja cuando quieras.”",
        alternates: { canonical: "/land" },
        ogImage: "/og/landing.png"
    },
} as const;