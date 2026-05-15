const noteService = require('../services/note.service');

async function getAllNotes(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ message: 'Invalid pagination parameters' });
    }

    const result = await noteService.getAllNotes(req.userId, { page, limit });
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getNoteById(req, res, next) {
  try {
    const note = await noteService.getNoteById(req.params.id, req.userId);
    return res.status(200).json(note);
  } catch (err) {
    next(err);
  }
}

async function createNote(req, res, next) {
  try {
    const { title, content } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (content === undefined || content === null) {
      return res.status(400).json({ message: 'Content is required' });
    }

    if (title.length > 255) {
      return res.status(400).json({ message: 'Title must be 255 characters or fewer' });
    }

    const note = await noteService.createNote(req.userId, title.trim(), content);
    return res.status(201).json(note);
  } catch (err) {
    next(err);
  }
}

async function updateNote(req, res, next) {
  try {
    const { title, content } = req.body;

    if (title === undefined && content === undefined) {
      return res.status(400).json({ message: 'At least one of title or content is required' });
    }

    if (title !== undefined && title.trim() === '') {
      return res.status(400).json({ message: 'Title cannot be empty' });
    }

    if (title !== undefined && title.length > 255) {
      return res.status(400).json({ message: 'Title must be 255 characters or fewer' });
    }

    const note = await noteService.updateNote(
      req.params.id,
      req.userId,
      title !== undefined ? title.trim() : undefined,
      content
    );
    return res.status(200).json(note);
  } catch (err) {
    next(err);
  }
}

async function deleteNote(req, res, next) {
  try {
    await noteService.deleteNote(req.params.id, req.userId);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function shareNote(req, res, next) {
  try {
    const { share_with_email } = req.body;

    if (!share_with_email || share_with_email.trim() === '') {
      return res.status(400).json({ message: 'share_with_email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(share_with_email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const result = await noteService.shareNote(req.params.id, req.userId, share_with_email);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function togglePin(req, res, next) {
  try {
    const note = await noteService.togglePin(req.params.id, req.userId);
    return res.status(200).json(note);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  shareNote,
  togglePin,
};
