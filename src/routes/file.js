const express = require('express')
const multer = require('multer')
const mime = require('mime')
const md5 = require('crypto-js').MD5
const fileController = require('../controllers/file')

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function(req, file, cb) {
    cb(null, `${md5(file.filename + Date.now().toString())}.${mime.getExtension(file.mimetype)}`)
  },
})

const upload = multer({ storage })

const fileRouter = express.Router()

fileRouter.post('/upload', upload.single('document'), fileController.uploadFile)

module.exports = fileRouter