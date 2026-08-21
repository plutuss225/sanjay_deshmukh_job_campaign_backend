const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/announcements:
 *   get:
 *     summary: Get all announcements
 *     description: Retrieve a list of all announcements (e.g., "2 days remain for closing"). Public endpoint.
 *     responses:
 *       200:
 *         description: A list of announcements
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const [announcements] = await pool.query('SELECT * FROM Announcement ORDER BY createdAt DESC');
    res.status(200).json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

/**
 * @swagger
 * /api/announcements:
 *   post:
 *     summary: Create a new announcement
 *     description: Create a new announcement. Protected admin endpoint.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       201:
 *         description: Announcement created successfully
 *       400:
 *         description: Title is required
 *       500:
 *         description: Failed to create announcement
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const query = 'INSERT INTO Announcement (title) VALUES (?)';
    const [result] = await pool.query(query, [title]);

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement: {
        id: result.insertId,
        title
      }
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

/**
 * @swagger
 * /api/announcements/{id}:
 *   patch:
 *     summary: Update an announcement
 *     description: Update the title of an existing announcement. Protected admin endpoint.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Announcement updated successfully
 *       400:
 *         description: Title is required
 *       404:
 *         description: Announcement not found
 *       500:
 *         description: Server error
 */
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const [existing] = await pool.query('SELECT * FROM Announcement WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const query = 'UPDATE Announcement SET title = ? WHERE id = ?';
    await pool.query(query, [title, id]);

    res.status(200).json({ message: 'Announcement updated successfully' });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

/**
 * @swagger
 * /api/announcements/{id}:
 *   delete:
 *     summary: Delete an announcement
 *     description: Delete an announcement. Protected admin endpoint.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Announcement deleted successfully
 *       404:
 *         description: Announcement not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM Announcement WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    await pool.query('DELETE FROM Announcement WHERE id = ?', [id]);

    res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

module.exports = router;
