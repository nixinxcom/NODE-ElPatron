'use client';

import * as React from 'react';
import { useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';

export type H6Props = React.HTMLAttributes<HTMLHeadingElement> & {
  kind?: string; variant?: string; size?: string; state?: string; scheme?: 'light'|'dark';
};

export const H6 = React.forwardRef<HTMLHeadingElement, H6Props>(function H6({
  kind = 'h6', variant, size, state, scheme, className, ...rest
}, ref) {
  const Styles = useStylesRDD();
  const _scheme = scheme || detectScheme();
  const classes = resolveComponentClasses(Styles, kind, {
    baseFallback: '', scheme: _scheme, variant, size, state, extra: className,
  });
  return <h3 ref={ref} className={classes} {...rest} />;
});
