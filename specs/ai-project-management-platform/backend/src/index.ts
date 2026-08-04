import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { AppDataSource } from './data-source';
import { redis } from './lib/redis';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { authService } from './services/auth.service';
import { GraphQLContext } from './types';
import { register } from 'prom-client';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
    // Connect DB
    await AppDataSource.initialize();
    console.log('[DB] Connected to PostgreSQL');

    // Connect Redis
    await redis.connect();

    const app = express();
    app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
    app.use(express.json());

    // Health check
    app.get('/health', (_req, res) => res.json({ status: 'ok' }));

    // Prometheus metrics
    app.get('/metrics', async (_req, res) => {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    });

    const httpServer = http.createServer(app);

    const schema = makeExecutableSchema({ typeDefs, resolvers });

    // WebSocket server for subscriptions
    const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
    const serverCleanup = useServer(
        {
            schema,
            context: async (ctx) => {
                const token = (ctx.connectionParams as any)?.authorization?.replace('Bearer ', '');
                let user = null;
                if (token) {
                    try { user = authService.validateToken(token); } catch { /* ignore */ }
                }
                return { user };
            },
        },
        wsServer,
    );

    const server = new ApolloServer<GraphQLContext>({
        schema,
        plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer }),
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            await serverCleanup.dispose();
                        },
                    };
                },
            },
        ],
    });

    await server.start();

    app.use(
        '/graphql',
        expressMiddleware(server, {
            context: async ({ req }): Promise<GraphQLContext> => {
                const token = req.headers.authorization?.replace('Bearer ', '');
                let user = null;
                if (token) {
                    try { user = authService.validateToken(token); } catch { /* ignore */ }
                }
                return { user, req };
            },
        }),
    );

    httpServer.listen(PORT, () => {
        console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
        console.log(`🔌 WebSocket ready at ws://localhost:${PORT}/graphql`);
    });
}

bootstrap().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
