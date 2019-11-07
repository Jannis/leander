const url = require('url')
const express = require('express')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const next = require('next')
const passport = require('passport')
const GitHubStrategy = require('passport-github').Strategy

require('dotenv').config()

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = express()

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
      name: 'leander',
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
        callbackURL: 'http://localhost:3000/auth/github/callback',
      },
      function(accessToken, refreshToken, profile, cb) {
        return cb(undefined, { accessToken })
      },
    ),
  )

  server.use(passport.initialize())
  server.use(passport.session())

  server.get('/auth/github', passport.authenticate('github'))

  server.get(
    '/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    (req, res) => {
      res.redirect(
        url.format({
          pathname: '/',
          query: req.query,
        }),
      )
    },
  )

  server.get('/auth/github/access-token', (req, res) => {
    if (!req.user) {
      res.sendStatus(401)
    } else {
      res.send({ accessToken: req.user.accessToken })
    }
  })

  server.get('/logout', (req, res) => {
    req.logout()
    res.send(req.user)
  })

  server.all('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(port, err => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})
