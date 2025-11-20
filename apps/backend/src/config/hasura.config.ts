export const hasuraConfig = {
  url: process.env.HASURA_URL || 'http://localhost:8080',
  adminSecret: process.env.HASURA_ADMIN_SECRET || '',
  graphqlEndpoint: process.env.HASURA_GRAPHQL_ENDPOINT || '/v1/graphql',
};

