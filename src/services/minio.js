const Minio = require('minio')
const Logger = require('../util/log')

class MinioConnector {
  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_IP,
      port: process.env.MINIO_PORT | 0,
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    })
  }

  async saveObject(objectPath, objectName, userId, expressResponse) {
    const metadata = {
      'Content-Type': 'application/octet-stream',
      'userId': userId,
    }

    Logger.info(`Uploading File ${objectPath} to Minio Storage`)

    this.minioClient.fPutObject(process.env.MINIO_BUCKET, objectName, objectPath, metadata, (err) => {
      if (err) {
        Logger.error(`Error on upload file ${objectName} to Minio storage: ${err}`)
        return expressResponse.status(500).send({ message: err })
      } else {
        Logger.info(`File ${objectName} successfully uploaded!`)
        return expressResponse.status(200).send({ fileId: objectName })
      }
    })
  }
}

module.exports = MinioConnector