import userRouter from "./userRoutes.js";
import serviceRequestRouter from "./serviceRequestRoutes.js";
import storeRouter from "./storeRoutes.js";

export { userRouter, serviceRequestRouter, storeRouter };
const constructorMethod = (app) => {
  app.use("/users", userRouter);
  app.use("/service-request", serviceRequestRouter);
  app.use("/stores", storeRouter);

  app.use("*", (req, res) => {
    res.status(200).render("users/landing", {
      title: "Welcome to ServiceEasy",
      cssPath: "/public/css/landing.css",
    });
  });
};

export default constructorMethod;
