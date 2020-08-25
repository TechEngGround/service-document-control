import Express from "express";
import bodyParser from 'body-parser'
import { resendSignLink, d4signflow, updateDocStatus, downloadDoc } from "../controllers/d4sign"
import multer from "multer";

var upload = multer()
const d4signRouter = Express.Router();
const jsonParser = bodyParser.json()

d4signRouter.use(bodyParser.urlencoded({extended: false}));

d4signRouter.post("/resendsignlink", jsonParser, resendSignLink);
d4signRouter.post("/updatesignstatus", upload.none(), updateDocStatus);
d4signRouter.post("/sendtosign", jsonParser, d4signflow);
d4signRouter.post("/download", jsonParser, downloadDoc);

export default d4signRouter;