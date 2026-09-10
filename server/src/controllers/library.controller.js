import * as libraryService from "../services/library.service.js";

/**
 * POST /library/save — Save link or note (Stage 1: Suggest)
 */
export const save = async (req, res, next) => {
  try {
    const result = await libraryService.saveItem(req.user._id, req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /library/:id/confirm — Review and commit item (Stage 2: Confirm & Embed)
 */
export const confirm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await libraryService.confirmItem(id, req.user._id, req.body);
    if (!item) {
      return res.status(404).json({ error: "Library item not found" });
    }
    return res.json({ item });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /library — List user library items with filter and search
 */
export const list = async (req, res, next) => {
  try {
    const { type, search, folder, status } = req.query;
    const items = await libraryService.getItems(req.user._id, {
      type,
      search,
      folder,
      status,
    });
    return res.json({ items });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /library/:id — Delete item and Pinecone vector
 */
export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const success = await libraryService.deleteItem(id, req.user._id);
    if (!success) {
      return res.status(404).json({ error: "Library item not found" });
    }
    return res.json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    next(error);
  }
};

