import userRouter from "./userRoutes.js";
import serviceRequestRouter from "./serviceRequestRoutes.js";
import storeRouter from "./storeRoutes.js";
import dashboardRouter from "./dashboardRoutes.js";
import repairRouter from "./repairRoutes.js";
import employeeActivityRouter from "./employeeActivityRoutes.js";
import emailRouter from "./emailRoutes.js";

export { userRouter, serviceRequestRouter, storeRouter, repairRouter };
const constructorMethod = (app) => {
  app.use("/", userRouter);
  app.use("/api/service-request", serviceRequestRouter);
  app.use("/stores", storeRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/api/repairs", repairRouter);
  app.use("/api/employee-activity", employeeActivityRouter);
  app.use("/api/email", emailRouter);

  app.use("*", (req, res) => {
    res.status(404).json({ Error: "Page Not found" });
  });
};

export default constructorMethod;
