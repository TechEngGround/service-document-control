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

  async downloadObject(objectName, userId, expressResponse) {
    this.minioClient.statObject(process.env.MINIO_BUCKET, objectName, (err, stat) => {
      if (err) {
        Logger.error(`Object ${objectName} not found! ${err}`)
        expressResponse.status(400).send({ message: 'Object not found!' })
        return
      }
      if (stat.metaData.userId !== userId) {
        Logger.error(`User ${userId} not authorized to view this object!`)
        expressResponse.status(401).send({ message: 'Not authorized to view this object!' })
        return
      }
      this.minioClient.fGetObject(process.env.MINIO_BUCKET, objectName, 'downloads', (err) => {
        if (err) {
          Logger.error(`Error: ${err}`)
          expressResponse.status(500).send({ message: err })
          return
        }
        expressResponse.download(`downloads/${objectName}`)
        return
      })
    })
  }
}

module.exports = MinioConnector