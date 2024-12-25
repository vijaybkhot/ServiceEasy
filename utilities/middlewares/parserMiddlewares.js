import express from "express";
import cookieParser from "cookie-parser";

export default (app) => {
  // Body parser, reading data from body into req.body
  app.use(express.json({ limit: "10kb" }));

  app.use(express.urlencoded({ extended: true, limit: "10kb" }));

  app.use(cookieParser()); // Cookie parser middleware
};
