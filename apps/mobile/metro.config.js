// Metro del monorepo. Expo detecta solo la raiz de los workspaces y vigila
// `packages/`, asi que `@appweb/core` y `@appweb/ui/tokens.native` se leen
// desde su codigo fuente, sin compilarlos antes.
const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
