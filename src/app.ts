import Express from 'express'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'

import router from './routes/index'

import { login } from './services/gateway'

import { endpointUser, setJwt } from './util/jwt'
import Logger from './util/log'

const doLogin = () => {
  Logger.info('Authenticating to Data Manager...')
  login(endpointUser.email, endpointUser.password)
    .then((token: string) => {
      if (process.env.SECRET_TOKEN && jwt.verify(token, process.env.SECRET_TOKEN)) {
        Logger.info('Authenticated!')
        setJwt(token)
      } else {
        Logger.info('Not Authenticated or env var SECRET_TOKEN not exists!!')
        setTimeout(doLogin, 5000)
      }
    })
    .catch((err: any) => {
      Logger.error('Error on Login!', err)
      setTimeout(doLogin, 5000)
    })
}

class App {
  server: Express.Application

  constructor() {
    this.server = Express()
    this.server.use(router)
    this.server.use(bodyParser.json())
    this.server.use(bodyParser.urlencoded({ extended: true }));

    doLogin()
  }
}

export default App

