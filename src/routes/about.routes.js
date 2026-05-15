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
    name: 'Sarvesh Kumar',
    email: 'sarveshbkt04@gmail.com',
    'my features': {
      'Pinned Notes': 'Users can pin important notes so they always appear at the top of the GET /notes list. Implemented via PATCH /notes/:id/pin which toggles the isPinned boolean. Pinned notes are sorted first using Prisma orderBy.',
      'Full-Text Search': 'Users can search across all their accessible notes (owned and shared) using GET /search?q=keyword. Search is case-insensitive and matches both title and content fields.',
      'Pagination': 'GET /notes supports page and limit query parameters for efficient loading of large note collections. Response includes pagination metadata: total, totalPages, page, and limit.',
      'Note Sharing': 'Note owners can share any note with another registered user by email via POST /notes/:id/share. Shared users can read the note via GET /notes/:id and it appears in their GET /notes list.',
    },
  });
});

module.exports = router;
