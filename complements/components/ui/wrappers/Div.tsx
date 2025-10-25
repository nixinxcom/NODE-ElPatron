'use client';

import * as React from 'react';
import { cx, useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';

/**
 * Div estilable por RDD (útil para “cards”, “sections” o contenedores con sombras, bordes, etc.).
 * - kind: e.g., 'card', 'section', 'panel', 'chip', 'badge'
 */
export type DivProps = React.HTMLAttributes<HTMLDivElement> & {
  kind?: string;          // default: 'surface' (o define el tuyo)
  variant?: string;
  size?: string;
  state?: string;
  scheme?: 'light'|'dark';
};

export const Div = React.forwardRef<HTMLDivElement, DivProps>(function Div({
  kind = 'surface',
  variant,
  size,
  state,
  scheme,
  className,
  ...rest
}, ref) {
  const Styles = useStylesRDD();
  const _scheme = scheme || detectScheme();

  const classes = resolveComponentClasses(Styles, kind, {
    baseFallback: '', // si tienes una clase base .surface en tu CSS, puedes ponerla aquí
    scheme: _scheme,
    variant,
    size,
    state,
    extra: className,
  });

  return <div ref={ref} className={classes} {...rest} />;
});
