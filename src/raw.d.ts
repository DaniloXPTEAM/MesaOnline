declare module "*.md?raw" {
  const content: string;
  export default content;
}

declare module "*.css";

/** Endereço do Portal ModernRPG externo — ver src/portalLink.ts. */
interface ImportMetaEnv {
  readonly VITE_PORTAL_URL?: string;
}

interface ImportMeta {
  readonly env?: ImportMetaEnv;
}
