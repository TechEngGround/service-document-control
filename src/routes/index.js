const express = require('express')
const fileRouter = require('./file')

const router = express.Router()

router.use('/files', fileRouter)

module.exports = router