const express = require('express');
const pool = require('../db');
const upload = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinary');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Upload a new document
 *     description: Upload a document (PDF, DOCX, etc.) to Cloudinary. Protected admin endpoint.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       500:
 *         description: Failed to upload document
 */
router.post('/upload', authMiddleware, upload.any(), async (req, res) => {
  try {
    const { title } = req.body;
    
    const file = req.files && req.files.length > 0 ? req.files[0] : req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const fileUrl = file.path; // Cloudinary URL
    const publicId = file.filename; // Cloudinary Public ID

    const query = 'INSERT INTO Document (title, url, public_id) VALUES (?, ?, ?)';
    const [result] = await pool.query(query, [title, fileUrl, publicId]);

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: result.insertId,
        title,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get all documents
 *     description: Retrieve a list of all uploaded documents. Public endpoint.
 *     responses:
 *       200:
 *         description: A list of documents
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const [documents] = await pool.query('SELECT * FROM Document ORDER BY createdAt DESC');
    res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     description: Delete a document from Cloudinary and the database.
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
 *         description: Document deleted successfully
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM Document WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = existing[0];

    // Delete from Cloudinary
    if (document.public_id) {
      await cloudinary.uploader.destroy(document.public_id);
    }

    // Delete from MySQL
    await pool.query('DELETE FROM Document WHERE id = ?', [id]);

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
