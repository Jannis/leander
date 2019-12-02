import { Router, Application } from 'express';
import LRUCache = require('lru-cache');
import { UserStore } from '../user-store';
interface GraphQLServerOptions {
    userStores: LRUCache<string, UserStore>;
}
export declare const installGraphQLServer: ({ app, path }: {
    app: Application;
    path: string;
}, { userStores }: GraphQLServerOptions) => Router;
export {};
