import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    avatar: { type: String, default: "" },

    preferences: {
      sidebarMode: {
        type: String,
        enum: ["general", "developer", "student", "power-user"],
        default: "general",
      },
      theme: { type: String, enum: ["dark", "light"], default: "dark" },
      language: { type: String, default: "en" },
      streamingEnabled: { type: Boolean, default: true },
    },

    globalInstructions: { type: String, default: "" },
    onboardingComplete: { type: Boolean, default: false },

    quietHours: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: "22:00" },
      endTime: { type: String, default: "08:00" },
    },

    notificationPrefs: {
      pushEnabled: { type: Boolean, default: false },
      emailEnabled: { type: Boolean, default: false },
      brokenLinks: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true },
    },

    pushSubscription: { type: mongoose.Schema.Types.Mixed },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    bufferCommands: false,
  },
);

userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.User || mongoose.model("User", userSchema);
