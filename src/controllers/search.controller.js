const noteService = require('../services/note.service');

async function searchNotes(req, res, next) {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ message: 'Query parameter "q" is required' });
    }

    const results = await noteService.searchNotes(req.userId, q);
    return res.status(200).json(results);
  } catch (err) {
    next(err);
  }
}

module.exports = { searchNotes };
