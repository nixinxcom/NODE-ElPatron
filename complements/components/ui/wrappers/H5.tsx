'use client';

import * as React from 'react';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';

export type H5Props = React.HTMLAttributes<HTMLHeadingElement> & {
  kind?: string; variant?: string; size?: string; state?: string; scheme?: 'light'|'dark';
};

export const H5 = React.forwardRef<HTMLHeadingElement, H5Props>(function H5({
  kind = 'h5', variant, size, state, scheme, className, ...rest
}, ref) {
  const Styles = useStylesRDD();
  const _scheme = scheme || detectScheme();
  const classes = resolveComponentClasses(Styles, kind, {
    baseFallback: '', scheme: _scheme, variant, size, state, extra: className,
  });
  return <h5 ref={ref} className={classes} {...rest} />;
});
