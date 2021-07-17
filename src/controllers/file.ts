import Express from "express"

import MinioConnector from "../services/minio"
import Logger from "../util/log"

export async function uploadFile(req: Express.Request, res: Express.Response): Promise<any> {
  Logger.info("Upload Request Finished!")

  if (!req.params.userId) {
    Logger.warn("userId not Provided!")
    res.status(400).send({ message: "Provide userId on Params to upload file!" })
    return
  }

  if (!req.params.documentType) {
    Logger.warn("documentType not Provided!")
    res.status(400).send({ message: "Provide userId on Body to upload file!" })
    return
  }

  if (!req.query.needSign) {
    Logger.warn("needSign not Provided!")
    res.status(400).send({ message: "Provide needSign on Query to upload file!" })
    return
  }

  if (req.file) {
    const minioClient = new MinioConnector()
    minioClient.saveObject(
      req.file.path,
      req.file.filename,
      req.params.userId,
      req.params.documentType,
      req.query.needSign === "true",
      res,
    )
  }
}

export async function downloadFile(req: Express.Request, res: Express.Response): Promise<any> {
  Logger.info("Download Request.")

  if (!req.query.filename) {
    Logger.warn("filename not Provided!")
    res.status(400).send({ message: "Provide filename on Query to download file!" })
    return
  }

  if (!req.query.filetype) {
    Logger.warn("filetype not Provided!")
    res.status(400).send({ message: "Provide filetype on Query to download file!" })
    return
  }

  const minioClient = new MinioConnector()

  minioClient.downloadObject(`${req.query.filename}.${req.query.filetype}`, res)
}
