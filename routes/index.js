import userRouter from "./userRoutes.js";
import serviceRequestRouter from "./serviceRequestRoutes.js";
import storeRouter from "./storeRoutes.js";
import dashboardRouter from "./dashboardRoutes.js";
import repairRouter from "./repairRoutes.js";

export { userRouter, serviceRequestRouter, storeRouter, repairRouter };
const constructorMethod = (app) => {
  app.use("/", userRouter);
  app.use("/api/service-request", serviceRequestRouter);
  app.use("/stores", storeRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/api/repairs", repairRouter);

  app.use("*", (req, res) => {
    res.status(404).json({ Error: "Page Not found" });
  });
};

export default constructorMethod;
