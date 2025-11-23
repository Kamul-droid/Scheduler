import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:8080/v1/graphql',
  documents: ['src/**/*.{ts,tsx}'],
  generates: {
    './src/graphql/generated/': {
      preset: 'client',
      plugins: [],
    },
  },
  ignoreNoDocuments: true,
};

export default config;

