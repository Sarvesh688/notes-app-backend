const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Full-text search across all accessible notes
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search keyword
 *         example: meeting
 *     responses:
 *       200:
 *         description: Matching notes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Note'
 *       400:
 *         description: Missing query parameter
 *       401:
 *         description: Unauthorized
 */
router.get('/search', authenticate, searchController.searchNotes);

module.exports = router;
