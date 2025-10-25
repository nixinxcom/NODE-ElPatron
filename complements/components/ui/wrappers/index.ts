export { cx, useStylesRDD } from './utils';
export { resolveComponentClasses } from './resolve';

export { Button } from './Button';
export { Image } from './Image';
export { A } from './A';
export { Input } from './Input';
export { Select } from './Select';
export { P } from './P';
export { Label } from './Label';
export { H1 } from './H1';
export { H2 } from './H2';
export { H3 } from './H3';
export { H4 } from './H4';
export { H5 } from './H5';
export { H6 } from './H6';
export { default as Link } from './Links';
export { default as NextImage } from './NextImage';

export { makeElement, toPascalCase } from './elementFactory';
import { makeElement } from './elementFactory';

export const Span  = makeElement('span', 'span');
export const Span1 = makeElement('span', 'span1');
export const Span2 = makeElement('span', 'span2');
export const Div   = makeElement('div',  'surface');