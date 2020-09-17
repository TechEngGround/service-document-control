import * as Minio from "minio";
import Express from "express";

import Logger from "../util/log";
import { saveOnDB } from "../services/gateway";

class MinioConnector {
  minioClient: Minio.Client;

  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_IP || "127.0.0.1",
      port:
        (process.env.MINIO_PORT && parseInt(process.env.MINIO_PORT)) || 9000,
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY || "admin",
      secretKey: process.env.MINIO_SECRET_KEY || "developer",
    });
  }

  async saveObject(
    objectPath: string,
    objectName: string,
    userId: string,
    documentType: string,
    expressResponse: Express.Response
  ) {
    const metadata = {
      "Content-Type": "application/octet-stream",
      userId: userId,
    };

    Logger.info(`Uploading File ${objectPath} to Minio Storage`);

    this.minioClient.fPutObject(
      process.env.MINIO_BUCKET || "documents",
      objectName,
      objectPath,
      metadata,
      async (err) => {
        if (err) {
          Logger.error(
            `Error on upload file ${objectName} to Minio storage: ${err}`
          );
          return expressResponse.status(500).send({ message: err });
        } else {
          Logger.info(`File ${objectName} successfully uploaded!`);
          const response = await saveOnDB(userId, objectName, documentType);
          if (response.error) {
            return expressResponse
              .status(500)
              .send({ message: response.error });
          }
          return expressResponse.status(200).send({ fileId: objectName });
        }
      }
    );
  }

  async downloadObject(
    objectName: string,
    userId: string,
    expressResponse: Express.Response
  ) {
    Logger.info(`Verifying userId ${userId} on Object Metadata ${objectName}`);

    this.minioClient.statObject(
      process.env.MINIO_BUCKET || "documents",
      objectName,
      (err, stat) => {
        if (err) {
          Logger.error(`Object ${objectName} not found! ${err}`);
          expressResponse.status(400).send({ message: "Object not found!" });
          return;
        }
        if (stat.metaData.userid !== userId) {
          console.log(stat);
          Logger.error(`User ${userId} not authorized to view this object!`);
          expressResponse
            .status(401)
            .send({ message: "Not authorized to view this object!" });
          return;
        }
        Logger.info(
          `Authorization Successfully, Getting Object ${objectName} from storage.`
        );
        this.minioClient.fGetObject(
          process.env.MINIO_BUCKET || "documents",
          objectName,
          `downloads/${objectName}`,
          (err) => {
            if (err) {
              Logger.error(`Error: ${err}`);
              expressResponse.status(500).send({ message: err });
              return;
            }
            Logger.info(`Sending Object ${objectName} to user`);
            expressResponse.download(`downloads/${objectName}`);
            return;
          }
        );
      }
    );
  }
}

export default MinioConnector;
