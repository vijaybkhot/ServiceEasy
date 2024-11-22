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
    },
    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "A service request must be assigned to a store."],
    },
    repair_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repair",
    },
    status: {
      type: String,
      enum: [
        "waiting for drop-off",
        "in-process",
        "pending for approval",
        "approved",
        "reassigned",
        "ready for pickup",
        "rejected",
      ],
      required: true,
    },
    reassigned: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["regular", "fast service"],
      default: "regular",
    },
    payment: [
      {
        transaction_id: {
          type: String,
          unique: true,
          required: true,
        },
        transaction_date: {
          type: Date,
          default: Date.now,
        },
        amount: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          enum: ["success", "failed", "in-process", "pending"],
          required: true,
        },
        payment_mode: {
          type: String,
          enum: ["CC", "DC", "DD", "cheque"],
          required: true,
        },
      },
    ],
    employee_activity: [
      {
        processing_employee_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        assigned_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Could be the manager or another employee
          required: true,
        },
        activity: {
          type: String,
          enum: ["repair", "inspect"],
          required: true,
        },
        employee_comment: {
          to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
          },
          date: {
            type: Date,
            default: Date.now,
          },
          comment: {
            type: String,
            required: true,
          },
        },
        date_assigned: {
          type: Date,
          default: Date.now,
        },
        date_completed: {
          type: Date,
        },
      },
    ],
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        required: false, // Not required initially
      },
      comment: {
        type: String,
        required: false, // Not required initially
      },
    },
  },
  { timestamps: true }
);

// Service request pre hook
serviceRequestSchema.pre("save", function (next) {
  if (this.status === "ready for pickup" || this.status === "completed") {
    if (!this.feedback || !this.feedback.rating || !this.feedback.comment) {
      return next(
        new Error("Feedback is required once the service is complete.")
      );
    }
  }
  next();
});

const ServiceRequest = mongoose.model("ServiceRequest", serviceRequestSchema);

export default ServiceRequest;
