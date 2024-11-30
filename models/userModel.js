import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please input your name!"],
      trim: true,
      validate: {
        validator: function (val) {
          return /^[a-zA-Z\s]+$/.test(val) && val.trim().length > 0;
        },
        message:
          "User name must only contain alphabetic characters and cannot be blank",
      },
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      validator: [validator.isEmail, "Please enter valid email!"],
      lowercase: true,
      required: [true, "Please provide an email address."],
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (val) {
          return validator.isMobilePhone(val, undefined, { strictMode: false });
        },
        message: "Please enter a valid phone number!",
      },
    },
    role: {
      type: String,
      enum: ["customer", "employee", "store-manager", "admin"],
      default: "customer",
    },
    hashedPassword: {
      type: String,
      trim: true,
      required: "Please enter a password",
      minlength: [8, "Password must be atleast 8 characters"],
      select: false, // Don't return passwords in default query
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  { timestamps: true }
);

// Method to check password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Check for duplicate email
userSchema.pre("validate", async function (next) {
  const userWithEmail = await User.findOne({ email: this.email });
  if (userWithEmail && this.isNew) {
    next(new Error("Email already exists. Login to continue."));
  } else {
    next();
  }
});

const User = mongoose.model("User", userSchema);

export default User;
