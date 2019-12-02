"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const passport_github_1 = __importDefault(require("passport-github"));
const url_1 = __importDefault(require("url"));
const graphql_1 = require("./graphql");
const lru_cache_1 = __importDefault(require("lru-cache"));
const webhook_1 = require("./webhook");
// Export GraphQL types
__export(require("./generated/graphql/types"));
exports.installServer = (options) => {
    let { app, path, session: sessionOptions, cors: corsOptions, github: githubOptions, graphql: graphqlOptions, webhook: webhookOptions, } = options;
    // Default options
    let { secret } = sessionOptions || { secret: 'leander' };
    let { origin } = corsOptions || { origin: '*' };
    // Enable CORS
    app.use(cors_1.default({
        origin,
        credentials: true,
    }));
    // Enable session cookies
    app.use(cookie_parser_1.default());
    app.use(express_session_1.default({
        secret: secret || 'leander',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            maxAge: 86400 * 7,
            httpOnly: false,
        },
        name: 'leander',
    }));
    // Configure Passport
    passport_1.default.serializeUser((user, done) => {
        done(null, user);
    });
    passport_1.default.deserializeUser((user, done) => {
        done(null, user);
    });
    passport_1.default.use(new passport_github_1.default({
        clientID: githubOptions.clientId,
        clientSecret: githubOptions.clientSecret,
        callbackURL: githubOptions.callbackUrl,
    }, (accessToken, refreshToken, profile, cb) => cb(undefined, { accessToken, profile })));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    let server = express_1.Router();
    /**
     * Login
     */
    server.get('/login', (req, res, next) => {
        // Pull ?returnTo= from the request query and pass it to GitHub OAuth as the
        // ?state= parameter. That way we can later retrieve it in the OAuth callback
        // handler.
        passport_1.default.authenticate('github', {
            state: Buffer.from(JSON.stringify({ returnTo: req.query.returnTo })).toString('base64'),
        })(req, res, next);
    });
    /**
     * Login OAuth callback
     */
    server.get('/login/callback', passport_1.default.authenticate('github', { failureRedirect: githubOptions.failureRedirect }), (req, res) => {
        let { returnTo } = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
        if (returnTo) {
            res.redirect(url_1.default.format(returnTo));
        }
        else {
            res.send('Ok');
        }
    });
    /**
     * Logout
     */
    server.get('/logout', (req, res) => {
        req.logout();
    });
    // We maintain an LRU cache of user stores to speed up queries. The cache
    // keys are the user's access tokens, and the values are UserStore objects
    // that we use to keep their GitHub data in memory.
    let userStores = new lru_cache_1.default({
        // We maintain a maximum of 100 user caches at any time
        max: 100,
        // We also delete caches after they have been unused for 7 days
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    /**
     * GitHub webhook
     */
    webhook_1.installWebhookHandler({
        app,
        path: `${path}/webhook`,
    }, Object.assign(Object.assign({}, webhookOptions), { userStores }));
    /**
     * GraphQL server
     */
    graphql_1.installGraphQLServer({ app, path: `${path}/graphql` }, Object.assign(Object.assign({}, graphqlOptions), { userStores }));
    // Mount the server into the app at the given path
    app.use(path, server);
    return server;
};
