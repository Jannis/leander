import { Router, Application } from 'express';
export * from './generated/graphql/types';
interface ServerOptions {
    app: Application;
    path: string;
    session?: {
        secret?: string;
    };
    cors?: {
        origin?: string;
    };
    github: {
        clientId: string;
        clientSecret: string;
        callbackUrl: string;
        failureRedirect?: string;
    };
    graphql?: {};
    webhook: {
        secret: string;
    };
}
export declare const installServer: (options: ServerOptions) => Router;
