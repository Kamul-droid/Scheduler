import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_HASURA_URL || 'http://localhost:8080/v1/graphql',
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

