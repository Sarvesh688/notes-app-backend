const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /about:
 *   get:
 *     summary: About the developer and features
 *     tags: [Meta]
 *     responses:
 *       200:
 *         description: Developer info and feature descriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 my_features:
 *                   type: object
 */
router.get('/about', (req, res) => {
  res.status(200).json({
    name: 'Your Name',
    email: 'your.email@example.com',
    my_features: {
      'Pinned Notes': 'Users can pin important notes so they always appear at the top of the notes list. This mirrors the core UX of Google Keep and helps users prioritize what matters. Implemented via PATCH /notes/:id/pin which toggles the isPinned flag.',
      'Full-Text Search': 'Users can search across all their notes (owned and shared) by keyword using GET /search?q=keyword. The search is case-insensitive and matches both title and content fields, making it easy to find notes quickly.',
      'Paginated Notes List': 'GET /notes supports page and limit query parameters so large note collections load efficiently. Response includes pagination metadata (total, totalPages, page, limit).',
      'Note Sharing': 'Owners can share any note with another registered user by email via POST /notes/:id/share. Shared users can read the note via GET /notes/:id and it appears in their GET /notes list.',
    },
  });
});

module.exports = router;
