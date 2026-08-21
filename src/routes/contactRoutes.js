const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/contact:
 *   get:
 *     summary: Get all contact messages
 *     description: Retrieve a list of all contact messages. Protected admin endpoint.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of contact messages
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [messages] = await pool.query('SELECT * FROM Contact ORDER BY createdAt DESC');
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ error: 'Failed to fetch contact messages' });
  }
});

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit a new contact message
 *     description: Public endpoint to submit a new contact message.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Contact message submitted successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Failed to submit contact message
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const query = 'INSERT INTO Contact (name, email, phone, message) VALUES (?, ?, ?, ?)';
    const [result] = await pool.query(query, [name, email, phone || null, message]);

    res.status(201).json({
      message: 'Contact message submitted successfully',
      contact: {
        id: result.insertId,
        name,
        email,
        phone,
        message,
        status: 'unread'
      }
    });
  } catch (error) {
    console.error('Error submitting contact message:', error);
    res.status(500).json({ error: 'Failed to submit contact message' });
  }
});

/**
 * @swagger
 * /api/contact/{id}:
 *   patch:
 *     summary: Update contact message status
 *     description: Update the status of a contact message (unread, read, resolved). Protected admin endpoint.
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [unread, read, resolved]
 *     responses:
 *       200:
 *         description: Contact message updated successfully
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Contact message not found
 *       500:
 *         description: Server error
 */
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['unread', 'read', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be unread, read, or resolved.' });
    }

    const [existing] = await pool.query('SELECT * FROM Contact WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    const query = 'UPDATE Contact SET status = ? WHERE id = ?';
    await pool.query(query, [status, id]);

    res.status(200).json({ message: 'Contact message updated successfully' });
  } catch (error) {
    console.error('Error updating contact message:', error);
    res.status(500).json({ error: 'Failed to update contact message' });
  }
});

/**
 * @swagger
 * /api/contact/{id}:
 *   delete:
 *     summary: Delete a contact message
 *     description: Delete a contact message. Protected admin endpoint.
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
 *         description: Contact message deleted successfully
 *       404:
 *         description: Contact message not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM Contact WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    await pool.query('DELETE FROM Contact WHERE id = ?', [id]);

    res.status(200).json({ message: 'Contact message deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({ error: 'Failed to delete contact message' });
  }
});

module.exports = router;
