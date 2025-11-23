import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Use relative URL to leverage Vite proxy for GraphQL
// The proxy routes /graphql to backend (which then uses Hasura)
// Or use /v1/graphql for direct Hasura access if needed
const graphqlUri = import.meta.env.VITE_GRAPHQL_URL || '/graphql';

const httpLink = createHttpLink({
  uri: graphqlUri,
});

const authLink = setContext((_, { headers }) => {
  // Add auth headers if needed
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      'x-hasura-admin-secret': import.meta.env.VITE_HASURA_ADMIN_SECRET || '',
      ...(token && { authorization: `Bearer ${token}` }),
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

