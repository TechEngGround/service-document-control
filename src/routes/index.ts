import Express from "express";

import fileRouter from "./file";
import d4signRouter from "./d4sign";
import pdfRouter from "./pdfrouter";

const router = Express.Router();

router.use("/files", fileRouter);
router.use("/d4sign", d4signRouter);
router.use("/pdf", pdfRouter);

export default router;
