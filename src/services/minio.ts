import * as Minio from "minio"
import Express from "express"

import Logger from "../util/log"
import { saveOnDB } from "../services/gateway"

class MinioConnector {
  minioClient: Minio.Client

  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_IP || "127.0.0.1",
      port: (process.env.MINIO_PORT && parseInt(process.env.MINIO_PORT)) || 9000,
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY || "admin",
      secretKey: process.env.MINIO_SECRET_KEY || "developer",
    })
  }

  async saveObject(
    objectPath: string,
    objectName: string,
    userId: string,
    documentType: string,
    needSign: boolean,
    expressResponse: Express.Response,
  ): Promise<any> {
    const metadata = {
      "Content-Type": "application/octet-stream",
      userId: userId,
    }

    Logger.info(`Uploading File ${objectPath} to Minio Storage`)

    this.minioClient.fPutObject(
      process.env.MINIO_BUCKET || "documents",
      objectName,
      objectPath,
      metadata,
      async (err) => {
        if (err) {
          Logger.error(`Error on upload file ${objectName} to Minio storage: ${err}`)
          return expressResponse.status(500).send({ message: err })
        } else {
          Logger.info(`File ${objectName} successfully uploaded!`)
          const response = await saveOnDB(userId, objectName, documentType, needSign)
          if (response.error) {
            return expressResponse.status(500).send({ message: response.error })
          }
          return expressResponse.status(200).send({ fileId: objectName })
        }
      },
    )
  }

  async saveObjectforSign(
    objectPath: string,
    objectName: string,
    userId: string,
    documentType: string,
  ) {
    const metadata = {
      "Content-Type": "application/octet-stream",
      userId: userId,
    }

    Logger.info(`Uploading File ${objectPath} to Minio Storage`)

    this.minioClient.fPutObject(
      process.env.MINIO_BUCKET || "documents",
      objectName,
      objectPath,
      metadata,
      async (err) => {
        if (err) {
          Logger.error(`Error on upload file ${objectName} to Minio storage: ${err}`)
          return { message: err }
        } else {
          Logger.info(`File ${objectName} successfully uploaded!`)
          const response = await saveOnDB(userId, objectName, documentType, true)
          if (response.error) {
            return { message: response.error }
          }
          return { fileId: objectName }
        }
      },
    )
  }

  async downloadObject(
    objectName: string,
    expressResponse: Express.Response,
    originalName?: string,
  ) {
    let fileName = ""
    if (originalName) {
      fileName = originalName
    } else {
      fileName = objectName
    }
    this.minioClient.fGetObject(
      process.env.MINIO_BUCKET || "documents",
      objectName,
      `downloads/${fileName}`,
      (err) => {
        if (err) {
          Logger.error(`Error: ${err}`)
          expressResponse.status(500).send({ message: err })
          return
        }
        Logger.info(`Sending Object ${fileName} to user`)

        expressResponse.download(`downloads/${fileName}`)
        return
      },
    )
  }

  downloadObjectSync(objectName: string): Promise<string> {
    Logger.info(`Downloading Object ${objectName}`)

    return new Promise((resolve) => {
      this.minioClient.fGetObject(
        process.env.MINIO_BUCKET || "documents",
        objectName,
        `downloads/${objectName}`,
        (err) => {
          if (err) {
            Logger.error(`Error: ${err}`)
            resolve(objectName)
            return
          }
          Logger.info(`Object ${objectName} Downloaded!`)
          resolve(objectName)
          return
        },
      )
    })
  }
}

export default MinioConnector
