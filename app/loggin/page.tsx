// app/login/page.tsx
'use client';
import AuthenticationComp from '@/complements/components/AuthenticationComp/AuthenticationComp';
import { FormattedMessage, useIntl } from "react-intl";
import FM from "@/complements/i18n/FM";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">
        <FM id="login.title" defaultMessage="Iniciar sesión" />
      </h1>
      <AuthenticationComp />
    </main>
  );
}