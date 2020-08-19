import Express from "express";
import bodyParser from 'body-parser'
import { getSafes, uploadDoc } from "../controllers/d4sign"

const d4signRouter = Express.Router();
const jsonParser = bodyParser.json()

d4signRouter.use(bodyParser.urlencoded({extended: false}));

d4signRouter.get("/getsafes", getSafes);
d4signRouter.post("/uploaddoc", jsonParser, uploadDoc);

export default d4signRouter;
