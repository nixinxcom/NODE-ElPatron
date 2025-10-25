'use client';
import React from 'react';
import NextLink, { LinkProps } from 'next/link';
import { cx, useStylesRDD } from './utils';
import { resolveComponentClasses } from './resolve';
type RDDProps = {
  scheme?: 'light'|'dark';
  variant?: string;
  size?: string;
  state?: string;
  /** kinds definidos en components.a.kinds */
  kind?: string;
  className?: string;
};
type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> &
  LinkProps & RDDProps;
const Links = React.forwardRef<HTMLAnchorElement, Props>(function Links(
  { href, children, className, scheme, variant, size, state, kind, ...rest },
  ref
) {
  const Styles = useStylesRDD();
  // Clase por kind (igual patrón que Btn → .link--primary)
  const kindClass = kind ? `link--${kind}` : undefined;
  // MUY IMPORTANTE: resolver contra "a" (no "link") porque el Designer guarda en components.a
  const rddClass = resolveComponentClasses(Styles, 'link', {
    baseFallback: 'link', // clase base que pinta en globals.css
    scheme,
    variant,
    size,
    state,
    extra: className,
  });
  return (
    <NextLink
      href={href}
      ref={ref}
      className={cx('link', kindClass, rddClass)}
      {...rest}
    >
      {children}
    </NextLink>
  );
});
export default Links;
export { Links };