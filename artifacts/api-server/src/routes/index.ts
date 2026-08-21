import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import imoveisRouter from "./imoveis";
import avaliacoesRouter from "./avaliacoes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(imoveisRouter);
router.use(avaliacoesRouter);

export default router;
