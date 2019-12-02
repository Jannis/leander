import { Router, Application } from 'express'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import cors from 'cors'
import passport from 'passport'
import GitHubStrategy from 'passport-github'
import url from 'url'

import { installGraphQLServer } from './graphql'
import LRUCache from 'lru-cache'
import { installWebhookHandler } from './webhook'
import { UserStore } from './user-store'

// Export GraphQL types
export * from './generated/graphql/types'

interface ServerOptions {
  app: Application
  path: string
  session?: {
    secret?: string
  }
  cors?: {
    origin?: string
  }
  github: {
    clientId: string
    clientSecret: string
    callbackUrl: string
    failureRedirect?: string
  }
  graphql?: {}
  webhook: {
    secret: string
  }
}

export const installServer = (options: ServerOptions): Router => {
  let {
    app,
    path,
    session: sessionOptions,
    cors: corsOptions,
    github: githubOptions,
    graphql: graphqlOptions,
    webhook: webhookOptions,
  } = options

  // Default options
  let { secret } = sessionOptions || { secret: 'leander' }
  let { origin } = corsOptions || { origin: '*' }

  // Enable CORS
  app.use(
    cors({
      origin,
      credentials: true,
    }),
  )

  // Enable session cookies
  app.use(cookieParser())
  app.use(
    session({
      secret: secret || 'leander',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        maxAge: 86400 * 7,
        httpOnly: false,
      },
      name: 'leander',
    }),
  )

  // Configure Passport
  passport.serializeUser((user, done) => {
    done(null, user)
  })
  passport.deserializeUser((user, done) => {
    done(null, user)
  })
  passport.use(
    new GitHubStrategy(
      {
        clientID: githubOptions.clientId,
        clientSecret: githubOptions.clientSecret,
        callbackURL: githubOptions.callbackUrl,
      },
      (accessToken, refreshToken, profile, cb) => cb(undefined, { accessToken, profile }),
    ),
  )
  app.use(passport.initialize())
  app.use(passport.session())

  let server = Router()

  /**
   * Login
   */

  server.get('/login', (req, res, next) => {
    // Pull ?returnTo= from the request query and pass it to GitHub OAuth as the
    // ?state= parameter. That way we can later retrieve it in the OAuth callback
    // handler.
    passport.authenticate('github', {
      state: Buffer.from(JSON.stringify({ returnTo: req.query.returnTo })).toString(
        'base64',
      ),
    })(req, res, next)
  })

  /**
   * Login OAuth callback
   */

  server.get(
    '/login/callback',
    passport.authenticate('github', { failureRedirect: githubOptions.failureRedirect }),
    (req, res) => {
      let { returnTo } = JSON.parse(Buffer.from(req.query.state, 'base64').toString())
      if (returnTo) {
        res.redirect(url.format(returnTo))
      } else {
        res.send('Ok')
      }
    },
  )

  /**
   * Logout
   */

  server.get('/logout', (req, res) => {
    req.logout()
  })

  // We maintain an LRU cache of user stores to speed up queries. The cache
  // keys are the user's access tokens, and the values are UserStore objects
  // that we use to keep their GitHub data in memory.
  let userStores = new LRUCache<string, UserStore>({
    // We maintain a maximum of 100 user caches at any time
    max: 100,

    // We also delete caches after they have been unused for 7 days
    maxAge: 1000 * 60 * 60 * 24 * 7,
  })

  /**
   * GitHub webhook
   */

  installWebhookHandler(
    {
      app,
      path: `${path}/webhook`,
    },
    { ...webhookOptions, userStores },
  )

  /**
   * GraphQL server
   */

  installGraphQLServer(
    { app, path: `${path}/graphql` },
    { ...graphqlOptions, userStores },
  )

  // Mount the server into the app at the given path
  app.use(path, server)

  return server
}
