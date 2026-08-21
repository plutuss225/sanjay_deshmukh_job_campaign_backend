const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const upload = require('../middleware/uploadMiddleware');

/**
 * @swagger
 * tags:
 *   name: Blogs
 *   description: Blog management API
 */

/**
 * @swagger
 * /api/blogs:
 *   get:
 *     summary: Retrieve a list of blogs
 *     tags: [Blogs]
 *     responses:
 *       200:
 *         description: A list of blogs.
 */
router.get('/', blogController.getBlogs);

/**
 * @swagger
 * /api/blogs/{id}:
 *   get:
 *     summary: Get a blog by ID or slug
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The blog ID or slug
 *     responses:
 *       200:
 *         description: A single blog.
 *       404:
 *         description: Blog not found.
 */
router.get('/:id', blogController.getBlogByIdOrSlug);

/**
 * @swagger
 * /api/blogs:
 *   post:
 *     summary: Create a new blog
 *     tags: [Blogs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               slug:
 *                 type: string
 *               heroImage:
 *                 type: string
 *     responses:
 *       201:
 *         description: Blog created successfully.
 */
router.post('/', blogController.createBlog);

/**
 * @swagger
 * /api/blogs/{id}:
 *   put:
 *     summary: Update an existing blog
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The blog ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               slug:
 *                 type: string
 *               heroImage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Blog updated successfully.
 *       404:
 *         description: Blog not found.
 */
router.put('/:id', blogController.updateBlog);

/**
 * @swagger
 * /api/blogs/{id}:
 *   delete:
 *     summary: Delete a blog
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The blog ID
 *     responses:
 *       200:
 *         description: Blog deleted successfully.
 *       404:
 *         description: Blog not found.
 */
router.delete('/:id', blogController.deleteBlog);

/**
 * @swagger
 * /api/blogs/upload:
 *   post:
 *     summary: Upload a blog image
 *     tags: [Blogs]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *       400:
 *         description: No image provided
 *       500:
 *         description: Image upload failed
 */
// Upload endpoint for blog images (hero and inline)
router.post('/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer/Cloudinary error:', err);
      return res.status(500).json({ error: err.message || 'Image upload failed', details: err });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }
    res.json({ url: req.file.path });
  });
});

module.exports = router;
