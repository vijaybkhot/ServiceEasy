import mongoose from "mongoose";

const employeeActivitySchema = new mongoose.Schema(
  {
    service_request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRequest",
      required: [
        true,
        "Employee activity must be associated with a service request.",
      ],
    },
    activity_type: {
      type: String,
      enum: ["repair", "approval", "assign/submit"],
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
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        // 'assigned_to' is required only for 'assign/submit' activity type
        return this.activity_type === "assign/submit";
      },
    },
    comments: {
      date: { type: Date, default: Date.now },
      comment: {
        type: String,
        required: function () {
          // 'comments' are required only for 'assign/submit' activity type
          return this.activity_type === "assign/submit";
        },
      },
    },
    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },
    start_time: {
      type: Date,
      default: function () {
        // For "assign/submit", start_time is set to current time
        if (this.activity_type === "assign/submit") {
          return Date.now();
        }
        return undefined;
      },
    },
    end_time: {
      type: Date,
      default: function () {
        // For "assign/submit", end_time should be set to current time
        if (this.activity_type === "assign/submit") {
          return Date.now();
        }
        return undefined;
      },
    },
  },
  { timestamps: true }
);

// Pre-save middleware to make sure that 'assign/submit' activity type can only have completed status
employeeActivitySchema.pre("save", function (next) {
  if (this.activity_type === "assign/submit" && this.status !== "completed") {
    return next(
      new Error(
        "Activity type 'assign/submit' can only have 'completed' status."
      )
    );
  }

  if (this.status === "completed" && !this.end_time) {
    // Automatically set end_time when status set to completed
    this.end_time = Date.now();
  }

  next();
});

// Pre-validation hook to handle 'assigned_to' and 'comments'
employeeActivitySchema.pre("validate", function (next) {
  if (this.activity_type !== "assign/submit") {
    // For non 'assign/submit' activities, 'assigned_to' and 'comments' are not allowed
    if (this.assigned_to) {
      return next(
        new Error(
          "'assigned_to' should not be provided for this activity type."
        )
      );
    }

    if (this.comments && this.comments.comment) {
      return next(
        new Error("'comments' should not be provided for this activity type.")
      );
    }
  }

  // If activity_type is "assign/submit", 'assigned_to' and 'comments' should be provided
  if (this.activity_type === "assign/submit") {
    if (!this.assigned_to) {
      return next(
        new Error(
          "'assigned_to' must be provided for 'assign/submit' activities."
        )
      );
    }

    if (!this.comments || !this.comments.comment) {
      return next(
        new Error("'comments' must be provided for 'assign/submit' activities.")
      );
    }
  }

  next();
});

const EmployeeActivity = mongoose.model(
  "EmployeeActivity",
  employeeActivitySchema
);

export default EmployeeActivity;
