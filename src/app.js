const express = require('express')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const router = require('./routes/index')
const { endpointUser, setJwt } = require('./util/jwt')
const { login } = require('./services/gateway')
const Logger = require('./util/log')

const doLogin = () => {
  Logger.info('Authenticating to Data Manager...')
  login(endpointUser.email, endpointUser.password)
      .then((token) => {
        if (jwt.verify(token, process.env.SECRET_TOKEN)) {
          Logger.info('Authenticated!')
          setJwt(token)
        } else {
          Logger.info('Not Authenticated!!')
          setTimeout(doLogin, 5000)
        }
      })
      .catch((err) => {
        Logger.error('Error on Login!', err)
        setTimeout(doLogin, 5000)
      })
}

class App {
  constructor() {
    this.server = express()
    this.server.use('/static', express.static(`index.html`))
    this.server.use(router)
    this.server.use(bodyParser.json())
    this.server.use(bodyParser.urlencoded({ extended: true }));

    doLogin()
  }
}

module.exports = App

