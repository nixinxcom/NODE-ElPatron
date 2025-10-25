'use client';

import * as React from 'react';
import { isExternalHref, useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';

export type AProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  kind?: string;          // default 'link'
  variant?: string;
  size?: string;
  state?: string;
  scheme?: 'light'|'dark';
};

export const A = React.forwardRef<HTMLAnchorElement, AProps>(function A({
  kind = 'link',
  variant,
  size,
  state,
  scheme,
  className,
  href = '#',
  ...rest
}, ref) {
  const Styles = useStylesRDD();
  const _scheme = scheme || detectScheme();
  const classes = resolveComponentClasses(Styles, kind, {
    baseFallback: kind === 'link' ? 'link' : '',
    scheme: _scheme,
    variant,
    size,
    state,
    extra: className,
  });

  const external = isExternalHref(href);
  return (
    <a
      ref={ref}
      href={href}
      className={classes}
      target={external ? '_blank' : rest.target}
      rel={external ? 'noopener noreferrer' : rest.rel}
      {...rest}
    />
  );
});
