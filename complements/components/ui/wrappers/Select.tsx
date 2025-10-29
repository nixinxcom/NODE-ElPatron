'use client';

import * as React from 'react';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  kind?: string;          // default 'select'
  variant?: string;
  size?: string;
  state?: string;
  scheme?: 'light'|'dark';
};

export const SELECT = React.forwardRef<HTMLSelectElement, SelectProps>(function Select({
  kind = 'select',
  variant,
  size,
  state,
  scheme,
  className,
  children,
  ...rest
}, ref) {
  const Styles = useStylesRDD();
  const _scheme = scheme || detectScheme();

  const classes = resolveComponentClasses(Styles, kind, {
    baseFallback: 'select', // si tienes .select en globals.css
    scheme: _scheme,
    variant,
    size,
    state,
    extra: className,
  });

  return (
    <select ref={ref} className={classes} {...rest}>
      {children}
    </select>
  );
});
