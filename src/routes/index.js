const express = require('express')
const fileRouter = require('./file')

const router = express.Router()

router.use('/documents', fileRouter)

module.exports = router