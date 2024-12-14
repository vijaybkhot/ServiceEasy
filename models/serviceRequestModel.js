import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A service request must belong to a customer."],
    },
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        // employee_id is required if status is "in-process" or later
        const requiredStatuses = [
          "in-process",
          "pending for approval",
          "ready for pickup",
          "reassigned",
          "complete",
        ];
        return requiredStatuses.includes(this.status);
      },
    },
    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "A service request must be assigned to a store."],
    },
    repair_details: {
      device_type: {
        type: String,
        required: [
          true,
          "A service request must be associated with a device type.",
        ],
      },
      model_name: {
        type: String,
        required: [true, "A service request must be associated with a model."],
      },
      estimated_time: {
        type: Number,
        required: [true, "A service request must have associated time."],
      },
      repair_name: {
        type: String,
        required: [true, "A service request repair must have a repair name."],
      },
      defective_parts: {
        type: [String], // Ensures each item in the array is a string
        required: [true, "Defective parts must be provided."],
        validate: {
          validator: function (value) {
            // Check if the array is not empty and contains at least one string
            return (
              Array.isArray(value) &&
              value.length > 0 &&
              value.every(
                (part) => typeof part === "string" && part.trim() !== ""
              )
            );
          },
          message:
            "Defective parts must be a non-empty array of non-empty strings.",
        },
      },
    },
    status: {
      type: String,
      enum: [
        "waiting for drop-off",
        "in-process",
        "pending for approval",
        "ready for pickup",
        "reassigned",
        "complete",
      ],
      required: true,
    },
    payment: {
      isPaid: {
        type: Boolean,
        default: false,
        required: true,
      },
      amount: {
        type: Number,
        required: function () {
          // If isPaid is true, amount must be provided
          return this.isPaid;
        },
        min: 0,
      },
      transaction_id: {
        type: String,
        unique: true,
        required: function () {
          // If isPaid is true, transaction_id must be provided
          return this.isPaid;
        },
      },
      payment_mode: {
        type: String,
        enum: ["CC", "DC", "DD", "cheque", "cash", "other"],
        required: function () {
          // If isPaid is true, payment_mode must be provided
          return this.isPaid;
        },
        default: "CC",
      },
      payment_date: {
        type: Date,
        required: function () {
          // If isPaid is true, payment_date must be provided
          return this.isPaid;
        },
        default: Date.now,
      },
    },
    feedback: {
      type: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
          required: function () {
            return (
              this.feedback !== undefined &&
              (this.feedback.comment !== undefined ||
                this.feedback.rating !== undefined)
            );
          },
        },
        comment: {
          type: String,
        },
      },
      default: undefined,
    },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Pre-validation hook to ensure employee_id is set when required by the status
serviceRequestSchema.pre("validate", function (next) {
  const requiredStatuses = [
    "in-process",
    "pending for approval",
    "ready for pickup",
    "reassigned",
    "complete",
  ];

  // Ensure employee_id is set if status requires it
  if (requiredStatuses.includes(this.status) && !this.employee_id) {
    return next(
      new Error(`Employee ID is required when status is '${this.status}'.`)
    );
  }

  // Ensure rating is provided if feedback exists
  if (
    this.feedback &&
    typeof this.feedback === "object" &&
    this.feedback.rating === undefined &&
    this.feedback.comment !== undefined
  ) {
    return next(new Error("Rating is required if feedback is provided."));
  }

  next();
});

// Pre-save middleware to set completedAt when status is "complete"
serviceRequestSchema.pre("save", function (next) {
  if (this.status === "complete" && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

const ServiceRequest = mongoose.model("ServiceRequest", serviceRequestSchema);

export default ServiceRequest;
