import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  REFRESH_COOKIE_NAME,
  getRefreshCookieOptions,
} from '../utils/token.js';

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

  res.status(201).json({
    data: {
      user,
      accessToken,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

  res.status(200).json({
    data: {
      user,
      accessToken,
    },
  });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.googleLogin(req.body);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

  res.status(200).json({
    data: {
      user,
      accessToken,
    },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  const { user, accessToken, refreshToken } = await authService.refresh(token);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

  res.status(200).json({
    data: {
      user,
      accessToken,
    },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const cookieOptions = getRefreshCookieOptions();
  delete cookieOptions.maxAge;
  res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);

  res.status(200).json({
    data: {
      message: 'Logged out successfully',
    },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    data: {
      user: req.user.toJSON ? req.user.toJSON() : req.user,
    },
  });
});
