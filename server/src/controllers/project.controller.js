import { Project } from '../models/Project.js';
import { Chat } from '../models/Chat.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Returns all projects for the authenticated user with chat counts.
 * GET /api/projects
 */
export const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ userId: req.user._id }).sort({ updatedAt: -1 });

  // Compute chat counts per project for current user
  const chatCounts = await Chat.aggregate([
    { $match: { userId: req.user._id, projectId: { $ne: null } } },
    { $group: { _id: '$projectId', count: { $sum: 1 } } },
  ]);

  const countMap = new Map();
  chatCounts.forEach((c) => {
    countMap.set(c._id.toString(), c.count);
  });

  const data = projects.map((p) => ({
    ...p.toObject(),
    chatCount: countMap.get(p._id.toString()) || 0,
    sourceCount: p.sources?.length || 0,
  }));

  res.status(200).json({ data });
});

/**
 * Creates a new project workspace.
 * POST /api/projects
 */
export const createProject = asyncHandler(async (req, res) => {
  const { name, description, customInstructions, color } = req.body;

  const project = await Project.create({
    userId: req.user._id,
    name,
    description: description || '',
    customInstructions: customInstructions || '',
    color: color || '#8b5cf6',
  });

  res.status(201).json({
    data: {
      ...project.toObject(),
      chatCount: 0,
    },
  });
});

/**
 * Returns a specific project and its associated chats.
 * GET /api/projects/:id
 */
export const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findOne({ _id: id, userId: req.user._id });
  if (!project) {
    throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project workspace not found');
  }

  const chats = await Chat.find({ projectId: project._id, userId: req.user._id }).sort({
    updatedAt: -1,
  });

  res.status(200).json({
    data: {
      ...project.toObject(),
      chatCount: chats.length,
      chats,
    },
  });
});

/**
 * Updates an existing project workspace.
 * PATCH /api/projects/:id
 */
export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, customInstructions, color } = req.body;

  const project = await Project.findOne({ _id: id, userId: req.user._id });
  if (!project) {
    throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project workspace not found');
  }

  if (name !== undefined) project.name = name;
  if (description !== undefined) project.description = description;
  if (customInstructions !== undefined) project.customInstructions = customInstructions;
  if (color !== undefined) project.color = color;

  await project.save();

  const chatCount = await Chat.countDocuments({ projectId: project._id, userId: req.user._id });

  res.status(200).json({
    data: {
      ...project.toObject(),
      chatCount,
    },
  });
});

/**
 * Deletes a project workspace and unlinks any associated chats.
 * DELETE /api/projects/:id
 */
export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findOne({ _id: id, userId: req.user._id });
  if (!project) {
    throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project workspace not found');
  }

  // Unlink associated chats so user chat history is safely retained
  await Chat.updateMany({ projectId: project._id, userId: req.user._id }, { projectId: null });

  await project.deleteOne();

  res.status(200).json({
    data: {
      message: 'Project deleted successfully and associated chats unlinked',
    },
  });
});

/**
 * Adds a source (local file or note) to a project workspace.
 * POST /api/projects/:id/sources
 */
export const addProjectSource = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, originalName, mimeType, size, content } = req.body;

  const project = await Project.findOne({ _id: id, userId: req.user._id });
  if (!project) {
    throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project workspace not found');
  }

  if (project.sources.length >= 50) {
    throw new ApiError(400, 'LIMIT_EXCEEDED', 'Project can contain at most 50 sources');
  }

  const newSource = {
    name,
    originalName: originalName || name,
    mimeType: mimeType || 'text/plain',
    size: size || 0,
    content: content || '',
  };

  project.sources.push(newSource);
  await project.save();

  const addedSource = project.sources[project.sources.length - 1];

  res.status(201).json({
    data: addedSource,
  });
});

/**
 * Removes a source from a project workspace.
 * DELETE /api/projects/:id/sources/:sourceId
 */
export const deleteProjectSource = asyncHandler(async (req, res) => {
  const { id, sourceId } = req.params;

  const project = await Project.findOne({ _id: id, userId: req.user._id });
  if (!project) {
    throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project workspace not found');
  }

  const sourceIndex = project.sources.findIndex((s) => s._id.toString() === sourceId);
  if (sourceIndex === -1) {
    throw new ApiError(404, 'SOURCE_NOT_FOUND', 'Project source not found');
  }

  project.sources.splice(sourceIndex, 1);
  await project.save();

  res.status(200).json({
    data: {
      message: 'Source deleted successfully',
      sourceId,
    },
  });
});

