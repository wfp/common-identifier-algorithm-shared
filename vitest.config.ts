import { defineConfig } from 'vitest/config';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [ tsConfigPaths() ],
  test: {
    include: [ "tests/**/*.{test,spec}.ts" ],
    exclude: [ "**/node_nodules/**", "**/dist/**", "**/examples/**", "**/docs/**" ],
    globals: true,

    typecheck: {
      enabled: true,
      tsconfig: "./tsconfig.json"
    },
    
    coverage: {
      provider: "v8",
      include: [ "src/**/*.ts" ],
      exclude: [ "src/types/**/*.ts", "src/index.ts" ],
      reporter: [ "text", "json", "json-summary" ],
      reportOnFailure: true
    },

    reporters: [ "default", "junit" ],
    outputFile: {
      junit: "reports/junit.xml"
    },    
  }
})