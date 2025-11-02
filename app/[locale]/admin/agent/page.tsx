'use client';
import React from 'react';
import AgentConfigForm from '@/complements/admin/AgentConfigForm';
import AgentCatalogTab from '@/complements/admin/AgentCatalogTab';
import s from '@/complements/admin/admin.module.css';
import FM from '@/complements/i18n/FM';
import { BUTTON, LINK, NEXTIMAGE, IMAGE, DIV, INPUT, SELECT, LABEL, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";


export default function Page() {
  const [tab, setTab] = React.useState<'cfg'|'cat'>('cfg');

  return (
    <div className={s.page}>
      <div className={s.wrap}>
        <H1 className={s.h1}><FM id="admin.agent.title" defaultMessage="Admin Agente" /></H1>
        <div className={s.tabs}>
          <BUTTON className={s.tab} aria-selected={tab==='cfg'} onClick={()=>setTab('cfg')}><FM id="admin.agent.config" defaultMessage="Configuración" /></BUTTON>
          <BUTTON className={s.tab} aria-selected={tab==='cat'} onClick={()=>setTab('cat')}><FM id="admin.agent.catalog" defaultMessage="Catálogo" /></BUTTON>
        </div>
        <div className={s.card}>
          {tab==='cfg' ? <AgentConfigForm/> : <AgentCatalogTab/>}
        </div>
      </div>
    </div>
  );
}