import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sessionsRouter from "./sessions";
import progressRouter from "./progress";
import coachRouter from "./coach";
import adminRouter from "./admin";
import templatesRouter from "./templates";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/sessions", sessionsRouter);
router.use("/progress", progressRouter);
router.use("/coach", coachRouter);
router.use("/admin", adminRouter);
router.use("/templates", templatesRouter);

export default router;
