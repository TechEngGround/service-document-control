import Express from "express";

import fileRouter from "./file";

const router = Express.Router();

router.use("/files", fileRouter);

export default router;
