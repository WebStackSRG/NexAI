import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token.js';
import { env } from '../config/env.js';

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

/**
 * Register a new user with email and password
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 */
export async function register({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(409, 'USER_ALREADY_EXISTS', 'A user with this email address already exists');
  }

  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const starterCredits = env.STARTER_CREDITS !== undefined ? Number(env.STARTER_CREDITS) : 100;

  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    role: 'user',
    wallet: {
      creditsRemaining: starterCredits,
      tier: 'free',
      totalTokensConsumed: 0,
    },
    settings: {
      theme: 'dark',
      defaultModel: 'flash',
      webSearchDefaultOn: false,
    },
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  };
}

/**
 * Authenticate user with email and password
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 */
export async function login({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  if (!user || !user.passwordHash) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  };
}

/**
 * Authenticate or register a user via Google OAuth ID token
 * @param {object} params
 * @param {string} params.credential
 */
export async function googleLogin({ credential }) {
  if (!googleClient || !env.GOOGLE_CLIENT_ID) {
    throw new ApiError(
      500,
      'GOOGLE_AUTH_UNCONFIGURED',
      'Google OAuth is not configured on the server',
    );
  }

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
  } catch (error) {
    throw new ApiError(
      401,
      'INVALID_GOOGLE_TOKEN',
      `Google token verification failed: ${error.message}`,
    );
  }

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new ApiError(401, 'INVALID_GOOGLE_TOKEN', 'Invalid Google token payload');
  }

  const normalizedEmail = payload.email.toLowerCase().trim();
  const googleId = payload.sub;

  let user = await User.findOne({
    $or: [{ googleId }, { email: normalizedEmail }],
  });

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
  } else {
    const starterCredits = env.STARTER_CREDITS !== undefined ? Number(env.STARTER_CREDITS) : 100;
    user = await User.create({
      email: normalizedEmail,
      googleId,
      role: 'user',
      wallet: {
        creditsRemaining: starterCredits,
        tier: 'free',
        totalTokensConsumed: 0,
      },
      settings: {
        theme: 'dark',
        defaultModel: 'flash',
        webSearchDefaultOn: false,
      },
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  };
}

/**
 * Refresh access token using a valid refresh token
 * @param {string} token
 */
export async function refresh(token) {
  if (!token) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Refresh token required');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'TOKEN_EXPIRED', 'Refresh token has expired');
    }
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new ApiError(401, 'USER_NOT_FOUND', 'User belonging to this token no longer exists');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  };
}

/**
 * Retrieve user profile by ID
 * @param {string} userId
 */
export async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  }
  return user.toJSON();
}
