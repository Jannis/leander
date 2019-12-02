import express from 'express'
import dotenv from 'dotenv'

import { installServer } from '.'

dotenv.config()

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

let app = express()

installServer({
  app,
  path: '/github',
  github,
  webhook,
})

app.listen(3000, () => {
  console.log(`Listening on http://localhost:3000/`)
})
