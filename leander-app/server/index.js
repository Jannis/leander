const url = require('url')
const express = require('express')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const cors = require('express-cors')
const next = require('next')
const passport = require('passport')
const GitHubStrategy = require('passport-github').Strategy
const { GraphQLError } = require('graphql')
const { installServer } = require('leander-server')

require('dotenv').config()

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  const server = express()

  /**
   * Backend
   */

  let github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackUrl: process.env.GITHUB_CALLBACK_URL,
  }

  if (!github.clientId) throw new Error('GITHUB_CLIENT_ID is not set')
  if (!github.clientSecret) throw new Error('GITHUB_CLIENT_SECRET is not set')
  if (!github.callbackUrl) throw new Error('GITHUB_CALLBACK_URL is not set')

  let webhook = {
    secret: process.env.GITHUB_WEBHOOK_SECRET,
  }

  if (webhook.secret === undefined) throw new Error('GITHUB_WEBHOOK_SECRET is not set')

  installServer({
    app: server,
    path: '/github',
    github,
    webhook,
  })

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
