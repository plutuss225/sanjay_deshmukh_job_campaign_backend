const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'job_campaign_documents',
    allowed_formats: ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'],
    // resource_type: 'raw' is needed for non-image files like pdf/doc in some cases,
    // but Cloudinary v2 auto-detects 'auto' if specified.
    resource_type: 'auto'
  }
});

const upload = multer({ storage: storage });

module.exports = upload;
