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
      required: true,
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
        "ready for pickup",
        "reassigned",
        "complete",
      ],
      required: true,
    },
    // reassigned: {
    //   type: Boolean,
    //   default: false,
    // },
    // priority: {
    //   type: String,
    //   enum: ["regular", "fast service"],
    //   default: "regular",
    // },
    payment: [
      {
        transaction_id: { type: String, unique: true, required: true },
        transaction_date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
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
    employeeActivity: [
      {
        activity_type: {
          type: String,
          enum: ["repair", "approval", "follow-up"],
          required: true,
        },
        processing_employee_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        assigned_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        comments: [
          {
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              required: true,
            },
            date: { type: Date, default: Date.now },
            comment: { type: String, required: true },
          },
        ],
        status: {
          type: String,
          enum: ["pending", "in-progress", "completed"],
          default: "pending",
        },
        start_time: { type: Date },
        end_time: { type: Date },
      },
    ],
    feedback: {
      rating: { type: Number, min: 1, max: 5, required: false },
      comment: { type: String, required: false },
    },
    auditTrail: [
      {
        timestamp: { type: Date, default: Date.now },
        action: { type: String, required: true }, // e.g., "Status changed", "Comment added"
        performed_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        details: { type: String },
      },
    ],
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
