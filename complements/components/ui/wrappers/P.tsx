'use client';

import * as React from 'react';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';

export type PProps = React.HTMLAttributes<HTMLParagraphElement> & {
  kind?: string;          // default 'p', pero puedes tener 'p1','pMuted', etc.
  variant?: string;
  size?: string;
  state?: string;
  scheme?: 'light'|'dark';
};

export const P = React.forwardRef<HTMLParagraphElement, PProps>(function P({
  kind = 'p',
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
    baseFallback: '', // normalmente tipografías vienen por tailwind/global
    scheme: _scheme,
    variant,
    size,
    state,
    extra: className,
  });

  return <p ref={ref} className={classes} {...rest} />;
});
