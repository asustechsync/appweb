/**
 * Los .tsx de packages/ui importan su CSS con `import "./archivo.css"`.
 * Next.js sabe resolver eso solo, pero packages/ui es TS puro (sin Next), asi
 * que TypeScript necesita esta declaracion para no marcarlo como error.
 */
declare module "*.css";
