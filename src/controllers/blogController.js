const pool = require('../db');

exports.createBlog = async (req, res) => {
  const { title, slug, author, published, hero_image, meta_title, meta_description, sections } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO blogs (title, slug, author, published, hero_image, meta_title, meta_description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, slug, author, published || false, hero_image || null, meta_title || null, meta_description || null]
    );

    const blogId = result.insertId;

    if (sections && sections.length > 0) {
      for (const [index, section] of sections.entries()) {
        await connection.query(
          'INSERT INTO blog_sections (blog_id, type, content, order_index) VALUES (?, ?, ?, ?)',
          [blogId, section.type, JSON.stringify(section.content), index]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ id: blogId, message: 'Blog created successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating blog:', error);
    if (error.code === 'ER_DUP_ENTRY') {
       return res.status(400).json({ error: 'Slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create blog' });
  } finally {
    connection.release();
  }
};

exports.getBlogs = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM blogs ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

exports.getBlogByIdOrSlug = async (req, res) => {
  const { id } = req.params;
  try {
    const [blogs] = await pool.query('SELECT * FROM blogs WHERE id = ? OR slug = ?', [id, id]);
    if (blogs.length === 0) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    const blog = blogs[0];

    const [sections] = await pool.query('SELECT * FROM blog_sections WHERE blog_id = ? ORDER BY order_index ASC', [blog.id]);
    
    // Parse JSON content back to object
    blog.sections = sections.map(sec => ({
      ...sec,
      content: sec.content ? JSON.parse(sec.content) : null
    }));

    res.json(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
};

exports.updateBlog = async (req, res) => {
  const { id } = req.params;
  const { title, slug, author, published, hero_image, meta_title, meta_description, sections } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      'UPDATE blogs SET title = ?, slug = ?, author = ?, published = ?, hero_image = ?, meta_title = ?, meta_description = ? WHERE id = ?',
      [title, slug, author, published, hero_image || null, meta_title || null, meta_description || null, id]
    );

    // Simplest approach: delete existing sections and re-insert
    await connection.query('DELETE FROM blog_sections WHERE blog_id = ?', [id]);

    if (sections && sections.length > 0) {
      for (const [index, section] of sections.entries()) {
        await connection.query(
          'INSERT INTO blog_sections (blog_id, type, content, order_index) VALUES (?, ?, ?, ?)',
          [id, section.type, JSON.stringify(section.content), index]
        );
      }
    }

    await connection.commit();
    res.json({ message: 'Blog updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'Failed to update blog' });
  } finally {
    connection.release();
  }
};

exports.deleteBlog = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM blogs WHERE id = ?', [id]);
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
};
