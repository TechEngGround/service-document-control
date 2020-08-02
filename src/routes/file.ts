import Express from "express";
import multer from "multer";
import mime from "mime";

const md5 = require("crypto-js").MD5;

import { downloadFile, uploadFile } from "../controllers/file";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${md5(file.filename + Date.now().toString())}.${mime.getExtension(
        file.mimetype
      )}`
    );
  },
});

const upload = multer({ storage });

const fileRouter = Express.Router();

fileRouter.post(
  "/upload/:userId/:documentType",
  upload.single("document"),
  uploadFile
);
fileRouter.get("/download", downloadFile);

export default fileRouter;
