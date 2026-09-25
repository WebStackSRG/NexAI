import { asyncHandler } from '../utils/asyncHandler.js';

export const updateSettings = asyncHandler(async (req, res) => {
  const user = req.user;
  const { theme, defaultModel, webSearchDefaultOn } = req.body;

  if (theme !== undefined) {
    user.settings.theme = theme;
  }
  if (defaultModel !== undefined) {
    user.settings.defaultModel = defaultModel;
  }
  if (webSearchDefaultOn !== undefined) {
    user.settings.webSearchDefaultOn = webSearchDefaultOn;
  }

  await user.save();

  res.status(200).json({
    data: {
      user: user.toJSON(),
    },
  });
});
