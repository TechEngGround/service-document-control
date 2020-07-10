const MinioConnector = require('../services/minio')
const Logger = require('../util/log')

exports.uploadFile = async (req, res) => {
  Logger.info('Upload Request Finished!')

  if (!req.body.userId) {
    Logger.warn('userId not Provided!')
    res.status(400).send({ message: 'Provide userId on Body to upload file!' })
    return
  }

  const minioClient = new MinioConnector()
  minioClient.saveObject(req.file.path, req.file.filename, req.body.userId, res)
}

exports.downloadFile = async (req, res) => {
  Logger.info('Download Request.')

  if (!req.query.userId) {
    Logger.warn('userId not Provided!')
    res.status(400).send({ message: 'Provide userId on Query to download file!' })
    return
  }

  if (!req.query.filename) {
    Logger.warn('filename not Provided!')
    res.status(400).send({ message: 'Provide filename on Query to download file!' })
    return
  }

  if (!req.query.filetype) {
    Logger.warn('filetype not Provided!')
    res.status(400).send({ message: 'Provide filetype on Query to download file!' })
    return
  }

  const minioClient = new MinioConnector()
  minioClient.downloadObject(`${req.query.filename}.${req.query.filetype}`, req.query.userId, res)
}