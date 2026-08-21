require('dotenv').config();
const pool = require('./src/db');

async function createAllTables() {
  try {
    console.log('Creating database tables...');

    // 1. Person Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Person (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gender VARCHAR(50),
        fullName VARCHAR(191) NOT NULL,
        contactNumber VARCHAR(50),
        emailAddress VARCHAR(191),
        dateOfBirth VARCHAR(50),
        permanentAddress TEXT,
        district VARCHAR(191) DEFAULT NULL,
        state VARCHAR(191) DEFAULT NULL,
        pincode VARCHAR(191) DEFAULT NULL,
        educationalQualification VARCHAR(191),
        coreStream VARCHAR(191),
        yearOfPassing VARCHAR(50),
        skillsSummary TEXT,
        professionalStatus VARCHAR(191),
        totalWorkExperience VARCHAR(191),
        currentJobProfile VARCHAR(191),
        targetIndustries VARCHAR(191),
        preferredJobLocation VARCHAR(191),
        candidateDeclaration TEXT,
        whatsapp_sent TINYINT(1) DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Person table created/verified.');

    // 2. Announcement Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Announcement (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Announcement table created/verified.');

    // 2.5 Document Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Document (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        public_id VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Document table created/verified.');

    // 3. Contact Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Contact (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        email VARCHAR(191) NOT NULL,
        phone VARCHAR(50),
        message TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Contact table created/verified.');

    // 4. Blogs Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        author VARCHAR(191) NOT NULL,
        published TINYINT(1) DEFAULT 0,
        hero_image TEXT DEFAULT NULL,
        meta_title VARCHAR(255) DEFAULT NULL,
        meta_description TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ blogs table created/verified.');

    // 5. Blog Sections Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        blog_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        content LONGTEXT,
        order_index INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ blog_sections table created/verified.');

    console.log('\n🎉 All tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

createAllTables();
