import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true},
    username: { type: String, required: true, unique: true, lowercase: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
    },
    image: String,
    role: {
      type: String,
      enum: ["user", "admin", "member", "subscriber"],
      default: "user",
    },
    contactNumber: String,
    bio: String,
    facebookId: String,
    linkedinId: String,
    isVerified: { type: Boolean, default: false },
    forgetPasswordToken: String,
    forgetPasswordTokenExpireesAt: String,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
