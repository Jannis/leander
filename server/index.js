const url = require('url')
const express = require('express')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const cors = require('express-cors')
const next = require('next')
const passport = require('passport')
const GitHubStrategy = require('passport-github').Strategy
const { GraphQLError } = require('graphql')
const { installGraphQLServer } = require('./graphql')

require('dotenv').config()

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  const server = express()

  /**
   * Authentication
   */

  server.use(
    cors({
      origin: '*',
      credentials: true,
    }),
  )
  server.use(cookieParser())
  server.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: false,
        maxAge: 86400 * 1000,
        httpOnly: false,
      },
      name: 'leander-session',
    }),
  )
  passport.serializeUser((user, done) => {
    done(null, user)
  })
  passport.deserializeUser((user, done) => {
    done(null, user)
  })
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
      },
      function(accessToken, refreshToken, profile, cb) {
        return cb(undefined, { accessToken })
      },
    ),
  )

  server.use(passport.initialize())
  server.use(passport.session())

  server.get('/login', (req, res, next) => {
    let { returnTo } = req.query
    let state = Buffer.from(JSON.stringify({ returnTo })).toString('base64')

    passport.authenticate('github', { state: state })(req, res, next)
  })

  server.get(
    '/login/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    (req, res) => {
      let { state } = req.query
      let { returnTo } = JSON.parse(Buffer.from(state, 'base64').toString())

      res
        .cookie('leander-access-token', req.user.accessToken, {
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        })
        .redirect(url.format(returnTo))
    },
  )

  server.get('/logout', (req, res) => {
    req.logout()
    res.send(req.user)
  })

  /**
   * GraphQL server
   */

  await installGraphQLServer({ app: server, path: '/graphql' })

  /**
   * Frontend
   */

  server.all('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(port, err => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})
