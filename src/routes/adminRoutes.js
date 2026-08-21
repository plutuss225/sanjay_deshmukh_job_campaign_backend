const express = require('express');
const supabase = require('../supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/admins:
 *   get:
 *     summary: Retrieve a list of admins
 *     description: Fetch all admins from Supabase.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of admins
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Attempt to fetch from 'admins' table
    const { data, error } = await supabase.from('admins').select('*').order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching admins from Supabase:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.status(200).json(data);
  } catch (err) {
    console.error('Unexpected error fetching admins:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admins:
 *   post:
 *     summary: Create a new admin
 *     description: Create a new admin user in Supabase.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       400:
 *         description: Invalid input or error
 */
router.post('/', authMiddleware, async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  try {
    // Insert into 'admins' table
    const { data, error } = await supabase
      .from('admins')
      .insert([{ email, name }])
      .select();

    if (error) {
      console.error('Error creating admin in Supabase:', error);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Admin created successfully', data: data[0] });
  } catch (err) {
    console.error('Unexpected error creating admin:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
