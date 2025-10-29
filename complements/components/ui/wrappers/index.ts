export { cx, useStylesRDD } from './utils';
export { resolveComponentClasses } from './resolve';

export { BUTTON } from './Button';
export { IMAGE } from './Image';
export { A } from './A';
export { INPUT } from './Input';
export { SELECT } from './Select';
export { P } from './P';
export { LABEL } from './Label';
export { H1 } from './H1';
export { H2 } from './H2';
export { H3 } from './H3';
export { H4 } from './H4';
export { H5 } from './H5';
export { H6 } from './H6';
export { default as LINK } from './Links';
export { default as NEXTIMAGE } from './NextImage';

export { makeElement, toPascalCase } from './elementFactory';
import { makeElement } from './elementFactory';

export const SPAN  = makeElement('span', 'span');
export const SPAN1 = makeElement('span', 'span1');
export const SPAN2 = makeElement('span', 'span2');
export const DIV   = makeElement('div',  'surface');