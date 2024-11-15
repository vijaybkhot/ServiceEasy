import mongoose from "mongoose";
import validator from "validator";

const userSchema = new mongoose.Schema({
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
        return validator.isMobilePhone(val, "en-US", { strictMode: false });
      },
      message: "Please enter a valid mobile phone number",
    },
  },
  role: {
    type: String,
    enum: ["customer", "employee", "store-manager", "admin"],
    default: "customer",
  },
  password: {
    type: String,
    trim: true,
    required: "Please enter a password",
    minlength: [8, "Password must be atleast 8 characters"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
  passwordChangedAt: { type: Date },
  isActive: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// Hashing the password
userSchema.pre("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
  }
  next();
});

// Method to check password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);

export default User;
