import Express from "express";
import bodyParser from 'body-parser'
import { resendSignLink, d4signflow } from "../controllers/d4sign"

const d4signRouter = Express.Router();
const jsonParser = bodyParser.json()

d4signRouter.use(bodyParser.urlencoded({extended: false}));

d4signRouter.post("/resendsignlink", jsonParser, resendSignLink);
d4signRouter.post("/sendtosign", jsonParser, d4signflow);

export default d4signRouter;