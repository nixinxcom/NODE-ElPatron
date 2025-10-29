'use client';

import * as React from 'react';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  kind?: string;          // default 'label' (o 'label1', etc.)
  variant?: string;
  size?: string;
  state?: string;
  scheme?: 'light'|'dark';
};

export const LABEL = React.forwardRef<HTMLLabelElement, LabelProps>(function Label({
  kind = 'label',
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
    baseFallback: 'label', // si tienes .label base
    scheme: _scheme,
    variant,
    size,
    state,
    extra: className,
  });

  return <label ref={ref} className={classes} {...rest} />;
});
