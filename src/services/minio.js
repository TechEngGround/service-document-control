const Minio = require('minio')
const Logger = require('../util/log')

class MinioConnector {
  constructor() {
    this.minioClient = Minio.Client({
      endPoint: process.env.MINIO_IP,
      port: process.env.MINIO_PORT,
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    })
  }

  async saveObject(objectPath, objectName, userName) {
    const fileBuffer = Buffer.from(objectPath)
    const fileID = Buffer.from(objectName + userName + Date.now()).toString('base64')

    const metadata = {
      'Content-Type': 'application/octet-stream',
      'username': userName,
    }

    return await this.minioClient.fPutObject(process.env.MINIO_BUCKET, fileID, fileBuffer, metadata, (err) => {
      if (err !== null) {
        Logger.error(`Error on upload file ${objectName} to Minio storage: ${error}`)
        return { fileID: undefined, err }
      } else {
        Logger.info(`File ${objectName} successfully uploaded!`)
        return { fileID, err: undefined }
      }
    })
  }
}

module.exports = MinioConnector