'use client';

import * as React from 'react';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  kind?: string;          // default 'input' (puedes tener 'input1', 'inputError', etc.)
  variant?: string;
  size?: string;
  state?: string;
  scheme?: 'light'|'dark';
};

export const INPUT = React.forwardRef<HTMLInputElement, InputProps>(function Input({
  kind = 'input',
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
    baseFallback: 'input', // si tienes .input en globals.css
    scheme: _scheme,
    variant,
    size,
    state,
    extra: className,
  });

  return <input ref={ref} className={classes} {...rest} />;
});
