import mongoose from "mongoose";

const repairSchema = new mongoose.Schema({
  device_type: {
    type: String,
    required: true,
    enum: ["iPhone", "Macbook", "iPad"],
  },
  models: [
    {
      model_name: {
        type: String,
        required: true,
      },
      repair_types: [
        {
          repair_name: {
            type: String,
            required: true,
          },
          defective_parts: [
            {
              type: String,
              required: true,
            },
          ],
          associated_price: {
            type: Number,
            required: true,
          },
          estimated_time: {
            type: Number, // Time in hours
            required: true,
          },
        },
      ],
    },
  ],
});

// Compound unique index on device_type, model_name, and repair_name
repairSchema.index(
  {
    device_type: 1,
    "models.model_name": 1,
    "models.repair_types.repair_name": 1,
  },
  { unique: true }
);

const Repair = mongoose.model("Repair", repairSchema);
export default Repair;
