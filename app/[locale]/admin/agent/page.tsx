'use client';
import React from 'react';
import AgentConfigForm from '@/complements/admin/AgentConfigForm';
import AgentCatalogTab from '@/complements/admin/AgentCatalogTab';
import s from '@/complements/admin/admin.module.css';
import FM from '@/complements/i18n/FM';


export default function Page() {
  const [tab, setTab] = React.useState<'cfg'|'cat'>('cfg');

  return (
    <div className={s.page}>
      <div className={s.wrap}>
        <h1 className={s.h1}><FM id="admin.agent.title" defaultMessage="Admin Agente" /></h1>
        <div className={s.tabs}>
          <button className={s.tab} aria-selected={tab==='cfg'} onClick={()=>setTab('cfg')}><FM id="admin.agent.config" defaultMessage="Configuración" /></button>
          <button className={s.tab} aria-selected={tab==='cat'} onClick={()=>setTab('cat')}><FM id="admin.agent.catalog" defaultMessage="Catálogo" /></button>
        </div>
        <div className={s.card}>
          {tab==='cfg' ? <AgentConfigForm/> : <AgentCatalogTab/>}
        </div>
      </div>
    </div>
  );
}