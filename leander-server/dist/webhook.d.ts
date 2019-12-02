import { Application } from 'express';
import LRUCache from 'lru-cache';
import { UserStore } from './user-store';
interface WebhookHandlerOptions {
    secret: string;
    userStores: LRUCache<string, UserStore>;
}
export declare const installWebhookHandler: ({ app, path }: {
    app: Application;
    path: string;
}, { secret, userStores }: WebhookHandlerOptions) => void;
export {};
