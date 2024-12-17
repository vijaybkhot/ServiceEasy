import mongoose from "mongoose";
import validator from "validator";

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Store name is required!"],
      trim: true,
      validate: {
        validator: function (val) {
          return val.trim().length > 0;
        },
        message: "Store name cannot be blank or contain only spaces",
      },
    },
    location: {
      // GeoJSON
      type: { type: String, default: "Point", enum: ["Point"] },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [
          true,
          "Co-ordinates in the format of [longitude, latitude] are required for the store.",
        ],
      },
      address: { type: String, required: [true, "Store address is required."] },
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (val) {
          return validator.isMobilePhone(val, undefined, { strictMode: true }) && /^\+/.test(val);
        },
        message: "Please enter a valid phone number for the store",
      },
      set: function (val) {
        return val.trim().startsWith('+') ? val.trim() : `+${val.trim()}`;
      },
    },
    storeManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A store must have a store manager."],
      unique: true,
    },
    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
  },
  { timestamps: true }
);

// Specified the 2dsphere index for mongodb geospatial queries
storeSchema.index({ location: "2dsphere" });

storeSchema.methods.addEmployees = async function (employees) {
  for (let employeeId of employees) {
    if (!validator.isMongoId(employeeId)) {
      throw new Error(`Invalid employee ID: ${employeeId}`);
    }

    // Check if the employee exists
    const employeeUser = await User.findById(employeeId);
    if (!employeeUser) {
      throw new Error(`Employee with ID ${employeeId} does not exist.`);
    }

    // Check if the user has the "employee" role
    if (employeeUser.role !== "employee") {
      throw new Error(`User with ID ${employeeId} is not an employee.`);
    }

    // Check if the employee is already in another store's employees array
    const existingStore = await Store.findOne({
      employees: employeeId,
    });

    if (existingStore) {
      throw new Error(
        `Employee with ID ${employeeId} already works at another store (${existingStore.name}).`
      );
    }
  }

  // Add employees to the store if all validations pass
  this.employees.push(...employees);
};

// Pre hook to populate the store manager details
storeSchema.pre(/^find/, function (next) {
  this.populate({
    path: "storeManager",
    select: "name email phone",
  });
  next();
});

storeSchema.statics.findStoresNear = function (longitude, latitude, distance) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: distance,
      },
    },
  });
};

const Store = mongoose.model("Store", storeSchema);

export default Store;
