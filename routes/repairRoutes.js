import express from "express";
import Repair from "../models/repairModel.js";
import { isAuthenticated } from "../utilities/middlewares/authenticationMiddleware.js";
import { getAllRepairs } from "../data/repairData.js";
// import { deleteRepair, getAllRepairs, getRepairById, updateRepair } from "../data/repairData.js";

const router = express.Router();

// Render home page for repairs
router.get("/", async (req, res) => { 
  let repairList = await getAllRepairs();
  res.json(repairList);
});

// Get all repairs
router.get("/", async (req, res) => {
  try {
    let repairList = await getAllRepairs();
    res.json(repairList);
  
    } catch (error) {
    res.sendStatus(500);

    }
});

export default router;
