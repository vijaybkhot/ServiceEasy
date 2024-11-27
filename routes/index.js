import userRouter from "./userRoutes.js";
import serviceRequestRouter from "./serviceRequestRoutes.js";
import storeRouter from "./storeRoutes.js";

export { userRouter, serviceRequestRouter, storeRouter };
const constructorMethod = (app) => {
  app.use("/", userRouter);
  app.use("/service-request", serviceRequestRouter);
  app.use("/stores", storeRouter);

  app.use("*", (req, res) => {
    res.status(404).json({ Error: "Page Not found" });
  });
};

export default constructorMethod;
