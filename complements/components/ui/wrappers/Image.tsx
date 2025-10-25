'use client';

import NextImage, { ImageProps as NextImageProps } from 'next/image';
import { cx, useStylesRDD, detectScheme } from './utils';
import { resolveComponentClasses } from './resolve';

export type ImageProps = NextImageProps & {
  kind?: string;          // default 'image'
  variant?: string;
  size?: string;
  state?: string;
  scheme?: 'light'|'dark';
  className?: string;
};

export function Image({ kind = 'image', variant, size, state, scheme, className, ...props }: ImageProps) {
  const Styles = useStylesRDD();
  const _scheme = scheme || detectScheme();

  const base = resolveComponentClasses(Styles, kind, {
    baseFallback: '', // normalmente las imágenes no requieren clase base
    scheme: _scheme,
    variant,
    size,
    state,
  });

  return <NextImage {...props} className={cx(base, className)} />;
}
