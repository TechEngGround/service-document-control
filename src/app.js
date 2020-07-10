const express = require('express')
const bodyParser = require('body-parser')
const router = require('./routes/index')

class App {
  constructor() {
    this.server = express()
    this.server.use('/static', express.static(`index.html`))
    this.server.use(router)
    this.server.use(bodyParser.json())
    this.server.use(bodyParser.urlencoded({ extended: true }));
  }
}

module.exports = App

