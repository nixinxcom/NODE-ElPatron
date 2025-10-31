// global.d.ts

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.json" {
  const value: any;
  export default value;
}

declare namespace JSX {
  interface IntrinsicElements {
    "stripe-pricing-table": any;
  }
}

declare module '*.module.css';
declare module '*.css';

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}