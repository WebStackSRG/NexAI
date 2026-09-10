import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { config } from "../config/env.js";
import { getDbStatus } from "../config/db.js";

const getOAuthClient = () => {
  if (!config.google.clientId || !config.google.clientSecret) {
    return null;
  }
  return new OAuth2Client(
    config.google.clientId,
    config.google.clientSecret,
    config.google.callbackUrl,
  );
};

// In-memory fallback cache for development when MongoDB is not active
const devUsersMap = new Map();

/**
 * Generate Google OAuth consent URL
 */
export const getGoogleAuthUrl = () => {
  const oauth2Client = getOAuthClient();
  if (!oauth2Client) {
    throw new Error(
      "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    );
  }

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
    ],
    prompt: "consent",
  });
};

/**
 * Exchange authorization code from Google, fetch user info, and upsert User
 */
export const handleGoogleCallback = async (code) => {
  const oauth2Client = getOAuthClient();
  if (!oauth2Client) {
    throw new Error("Google OAuth is not configured.");
  }

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const ticket = await oauth2Client.verifyIdToken({
    idToken: tokens.id_token,
    audience: config.google.clientId,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error("Failed to retrieve valid user info from Google OAuth.");
  }

  const { sub: googleId, email, name, picture: avatar } = payload;

  let user;
  if (getDbStatus().isConnected) {
    try {
      user = await User.findOneAndUpdate(
        { googleId },
        {
          $set: {
            email,
            name: name || email.split("@")[0],
            avatar: avatar || "",
            updatedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
    } catch (err) {
      console.error(
        "[AuthService] Database error during Google user upsert:",
        err.message,
      );
    }
  }

  if (!user) {
    // Fallback if DB is disconnected or errored
    user = {
      _id: `dev-sub-${googleId}`,
      googleId,
      email,
      name: name || email.split("@")[0],
      avatar: avatar || "",
      preferences: {
        sidebarMode: "general",
        theme: "dark",
        language: "en",
        streamingEnabled: true,
      },
    };
  }

  const token = generateToken(user);
  return { user, token };
};

/**
 * Issue signed HS256 JWT
 */
export const generateToken = (user) => {
  const userId = user._id ? user._id.toString() : user.id;
  return jwt.sign(
    {
      userId,
      email: user.email,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
};

/**
 * Verify signed JWT
 */
export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

/**
 * Fetch user by ID
 */
export const getUserById = async (userId) => {
  if (getDbStatus().isConnected) {
    try {
      const user = await User.findById(userId).lean();
      if (user) return user;
    } catch (err) {
      // Fall through to dev cache
    }
  }

  if (devUsersMap.has(userId)) {
    return devUsersMap.get(userId);
  }

  return null;
};

/**
 * Development-only login helper for testing without live Google credentials
 */
export const devLogin = async ({
  email = "dev@nexai.app",
  name = "NexAI Developer",
  avatar = "",
}) => {
  const googleId = `dev-${Buffer.from(email).toString("hex")}`;

  let user;
  if (getDbStatus().isConnected) {
    try {
      user = await User.findOneAndUpdate(
        { email },
        {
          $set: {
            googleId,
            email,
            name,
            avatar,
            updatedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      ).lean();
    } catch (err) {
      console.warn(
        "[AuthService] MongoDB write failed for dev login:",
        err.message,
      );
    }
  }

  if (!user) {
    const mockId = `dev-user-${Date.now()}`;
    user = {
      _id: mockId,
      id: mockId,
      googleId,
      email,
      name,
      avatar,
      preferences: {
        sidebarMode: "general",
        theme: "dark",
        language: "en",
        streamingEnabled: true,
      },
      globalInstructions: "",
      onboardingComplete: false,
      notificationPrefs: {
        pushEnabled: false,
        emailEnabled: false,
        brokenLinks: true,
        weeklyDigest: true,
        reminders: true,
      },
    };
    devUsersMap.set(mockId, user);
  }

  const token = generateToken(user);
  return { user, token };
};
