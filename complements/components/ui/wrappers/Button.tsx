'use client';

import * as React from 'react';
import NextLink from 'next/link';
import { cx, isExternalHref, useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';

export type BtnProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & {
  kind?: string;              // e.g. 'button', 'button1', 'button2' (default 'button')
  variant?: string;
  size?: string;
  state?: string;
  as?: 'button' | 'link';
  href?: string;
  scheme?: 'light'|'dark';
};

export const BUTTON = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, BtnProps>(
  function Button({
    kind = 'button',
    variant,
    size,
    state,
    as = 'button',
    href,
    scheme,
    type,
    className,
    ...rest
  }, ref) {
    const Styles = useStylesRDD();
    const _scheme = scheme || detectScheme();

    // fallback a .button (globals.css) si RDD no define base
    const classes = resolveComponentClasses(Styles, kind, {
      baseFallback: 'button',
      scheme: _scheme,
      variant,
      size,
      state,
      extra: className,
    });

    if (href || as === 'link') {
      const _href = href ?? '#';
      if (isExternalHref(_href)) {
        return (
          <a
            ref={ref as any}
            href={_href}
            className={classes}
            target="_blank"
            rel="noopener noreferrer"
            {...(rest as any)}
          />
        );
      }
      return <NextLink ref={ref as any} href={_href} className={classes} {...(rest as any)} />;
    }

    const _type = type ?? 'button';
    return <button ref={ref as any} type={_type} className={classes} {...rest} />;
  }
);
