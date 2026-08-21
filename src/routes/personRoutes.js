const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/persons:
 *   post:
 *     summary: Create a new person application
 *     description: Submit a new job campaign application. Public endpoint.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gender:
 *                 type: string
 *               fullName:
 *                 type: string
 *               contactNumber:
 *                 type: string
 *               emailAddress:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *               permanentAddress:
 *                 type: string
 *               district:
 *                 type: string
 *               state:
 *                 type: string
 *               pincode:
 *                 type: string
 *               educationalQualification:
 *                 type: string
 *               coreStream:
 *                 type: string
 *               yearOfPassing:
 *                 type: string
 *               skillsSummary:
 *                 type: string
 *               professionalStatus:
 *                 type: string
 *               totalWorkExperience:
 *                 type: string
 *               currentJobProfile:
 *                 type: string
 *               targetIndustries:
 *                 type: string
 *               preferredJobLocation:
 *                 type: string
 *               candidateDeclaration:
 *                 type: string
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *       500:
 *         description: Failed to submit application
 */
// POST /api/persons (Public)
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    // Trim string values
    const trimmedData = {};
    for (const key in data) {
      trimmedData[key] = typeof data[key] === 'string' ? data[key].trim() : data[key];
    }
    
    // Convert object to arrays for insertion
    const keys = Object.keys(trimmedData);
    const values = Object.values(trimmedData);
    
    if (keys.length === 0) {
      return res.status(400).json({ error: 'No data provided' });
    }

    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.join(', ');
    
    // Add createdAt and updatedAt manually since we removed Prisma
    const now = new Date();
    const query = `INSERT INTO Person (${columns}, createdAt, updatedAt) VALUES (${placeholders}, ?, ?)`;
    const queryValues = [...values, now, now];

    const [result] = await pool.query(query, queryValues);
    
    // Fetch the inserted record to return it
    const [inserted] = await pool.query('SELECT * FROM Person WHERE id = ?', [result.insertId]);

    res.status(201).json({ message: 'Application submitted successfully', person: inserted[0] });
  } catch (error) {
    console.error('Error creating person:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

/**
 * @swagger
 * /api/persons:
 *   get:
 *     summary: Get all persons
 *     description: Retrieve a list of all job campaign applications. Protected endpoint.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of persons
 *       401:
 *         description: Unauthorized
 */
// GET /api/persons (Protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [persons] = await pool.query('SELECT * FROM Person ORDER BY createdAt DESC');
    res.status(200).json(persons);
  } catch (error) {
    console.error('Error fetching persons:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

/**
 * @swagger
 * /api/persons/{id}:
 *   get:
 *     summary: Get a person by ID
 *     description: Retrieve details of a specific application. Protected endpoint.
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
 *         description: Person details
 *       404:
 *         description: Person not found
 */
// GET /api/persons/:id (Protected)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [person] = await pool.query('SELECT * FROM Person WHERE id = ?', [id]);
    
    if (person.length === 0) {
      return res.status(404).json({ error: 'Person not found' });
    }
    res.status(200).json(person[0]);
  } catch (error) {
    console.error('Error fetching person:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

/**
 * @swagger
 * /api/persons/{id}:
 *   patch:
 *     summary: Update a person by ID
 *     description: Update an existing application. Protected endpoint.
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
 *     responses:
 *       200:
 *         description: Application updated successfully
 *       404:
 *         description: Person not found
 */
// PATCH /api/persons/:id (Protected)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Trim string values
    const trimmedUpdateData = {};
    for (const key in updateData) {
      trimmedUpdateData[key] = typeof updateData[key] === 'string' ? updateData[key].trim() : updateData[key];
    }
    
    // Check if person exists
    const [existing] = await pool.query('SELECT * FROM Person WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Person not found' });
    }

    const keys = Object.keys(trimmedUpdateData);
    if (keys.length === 0) {
      return res.status(400).json({ error: 'No data provided to update' });
    }

    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = Object.values(trimmedUpdateData);
    
    // Update updatedAt manually
    const query = `UPDATE Person SET ${setClause}, updatedAt = ? WHERE id = ?`;
    const queryValues = [...values, new Date(), id];

    await pool.query(query, queryValues);
    
    const [updatedPerson] = await pool.query('SELECT * FROM Person WHERE id = ?', [id]);
    res.status(200).json({ message: 'Application updated successfully', person: updatedPerson[0] });
  } catch (error) {
    console.error('Error updating person:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

/**
 * @swagger
 * /api/persons/{id}:
 *   delete:
 *     summary: Delete a person by ID
 *     description: Remove an application. Protected endpoint.
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
 *         description: Application deleted successfully
 *       404:
 *         description: Person not found
 */
// DELETE /api/persons/:id (Protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM Person WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Person not found' });
    }
    
    await pool.query('DELETE FROM Person WHERE id = ?', [id]);
    res.status(200).json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting person:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

module.exports = router;
