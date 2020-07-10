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