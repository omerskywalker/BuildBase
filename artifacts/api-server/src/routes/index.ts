import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import sessionsRouter from "./sessions";
import progressRouter from "./progress";
import coachRouter from "./coach";
import adminRouter from "./admin";
import templatesRouter from "./templates";
import quickLogRouter from "./quick-log";
import monitorRouter from "./monitor";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/dashboard", dashboardRouter);
router.use("/sessions", sessionsRouter);
router.use("/progress", progressRouter);
router.use("/coach", coachRouter);
router.use("/admin", adminRouter);
router.use("/templates", templatesRouter);
router.use("/quick-log", quickLogRouter);
router.use("/monitor", monitorRouter);

export default router;
