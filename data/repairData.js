import { ObjectId } from "mongodb";
import Repair from "../models/repairModel.js";
import dataValidator from "../utilities/dataValidator.js";


// Get all 
export async function getAllRepairs() {
  const repairs = await Repair.find();
  if (repairs.length === 0) {
    throw new Error("No repairs found.");
  }
  return repairs;
}