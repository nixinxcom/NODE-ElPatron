'use client';

import React from 'react';
import NextImage, { ImageProps } from 'next/image';
import { cx, useStylesRDD } from './utils';
import { resolveComponentClasses } from './resolve';

type RDD = {
  kind?: string;
  scheme?: 'light' | 'dark';
  variant?: string;
  size?: string;
  state?: string;
  className?: string;
};

type Props = ImageProps & RDD;

const Img = React.forwardRef<HTMLImageElement, Props>(function Img(
  { kind = 'image', scheme, variant, size, state, className, ...imgProps },
  ref
) {
  const Styles = useStylesRDD();
  const rddClass = resolveComponentClasses(Styles, kind, {
    baseFallback: 'image',
    scheme,
    variant,
    size,
    state,
    extra: className,
  });

  return (
    <NextImage
      {...imgProps}
      ref={ref as any}
      className={cx('image', rddClass)}
    />
  );
});

export default Img;
export { Img as NextImage };
