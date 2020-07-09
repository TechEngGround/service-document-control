const express = require('express')
const multer = require('multer')
const fileController = require('../controllers/file')

const upload = multer({dest: 'uploads/'})

const fileRouter = express.Router()

fileRouter.post('/upload', upload.single('document'), fileController.uploadFile)

module.exports = fileRouter