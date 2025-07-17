declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: {
            id: string;
            email: string;
            role: string;
            permissions: string[];
        };
        user: {
            id: string;
            email: string;
            role: string;
            permissions: string[];
        };
    }
}
export {};
//# sourceMappingURL=server.d.ts.map