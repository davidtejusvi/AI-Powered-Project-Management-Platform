import {
    ApolloClient, InMemoryCache, createHttpLink,
    split, from,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { useAuthStore } from '../store/auth.store';

const httpLink = createHttpLink({ uri: '/graphql' });

const authLink = setContext((_, { headers }) => {
    const token = useAuthStore.getState().accessToken;
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
        },
    };
});

const wsLink = new GraphQLWsLink(
    createClient({
        url: `ws://${window.location.host}/graphql`,
        connectionParams: () => {
            const token = useAuthStore.getState().accessToken;
            return { authorization: token ? `Bearer ${token}` : '' };
        },
    }),
);

const splitLink = split(
    ({ query }) => {
        const def = getMainDefinition(query);
        return def.kind === 'OperationDefinition' && def.operation === 'subscription';
    },
    wsLink,
    from([authLink, httpLink]),
);

export const apolloClient = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache({
        typePolicies: {
            Query: {
                fields: {
                    tasks: { merge: false },
                },
            },
        },
    }),
});
