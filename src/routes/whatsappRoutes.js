const express = require('express');
const crypto = require('crypto');
const whatsappService = require('../services/whatsappService');

const router = express.Router();

// In-memory store for OTPs (Key: Phone Number, Value: { otp, expiresAt })
const otpStore = new Map();

/**
 * @swagger
 * /api/whatsapp/status:
 *   get:
 *     summary: Get WhatsApp connection status
 *     description: Returns the current connection status and QR code (if any) of the Baileys WhatsApp client.
 *     responses:
 *       200:
 *         description: WhatsApp status and QR
 */
// GET /api/whatsapp/status
router.get('/status', (req, res) => {
  res.json({
    status: whatsappService.getStatus(),
    qr: whatsappService.getQR()
  });
});

/**
 * @swagger
 * /api/whatsapp/send-otp:
 *   post:
 *     summary: Send OTP via WhatsApp
 *     description: Generates a 6-digit OTP and sends it to the provided phone number via WhatsApp.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Failed to send OTP
 */
// POST /api/whatsapp/send-otp
router.post('/send-otp', async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  
  // Store it for 5 minutes
  otpStore.set(phoneNumber, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  try {
    await whatsappService.sendMessage(phoneNumber, `*युवा रोजगार मेळावा 2026*\n\nYour verification code is: *${otp}*\n\nThis code will expire in 5 minutes. Do not share this code with anyone.`);
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Failed to send OTP:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp message. Make sure the backend is connected to WhatsApp.' });
  }
});

/**
 * @swagger
 * /api/whatsapp/verify-otp:
 *   post:
 *     summary: Verify WhatsApp OTP
 *     description: Verifies the 6-digit OTP sent to the user's WhatsApp number.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - otp
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 */
// POST /api/whatsapp/verify-otp
router.post('/verify-otp', (req, res) => {
  const { phoneNumber, otp } = req.body;
  if (!phoneNumber || !otp) {
    return res.status(400).json({ error: 'Phone number and OTP are required' });
  }

  const record = otpStore.get(phoneNumber);
  
  if (!record) {
    return res.status(400).json({ error: 'OTP not requested or expired' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phoneNumber);
    return res.status(400).json({ error: 'OTP has expired' });
  }

  if (record.otp === otp) {
    otpStore.delete(phoneNumber); // OTP used successfully
    res.json({ message: 'OTP verified successfully', verified: true });
  } else {
    res.status(400).json({ error: 'Invalid OTP' });
  }
});

// GET /api/whatsapp/dashboard
router.get('/dashboard', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WhatsApp Dashboard</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f0f2f5; margin: 0; }
        .card { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 100%; }
        #qr-container { min-height: 250px; display: flex; align-items: center; justify-content: center; }
        #qr-container img { max-width: 250px; }
        #status { font-weight: bold; margin-top: 1rem; color: #555; text-transform: capitalize; }
        .connected { color: #25D366 !important; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>WhatsApp Connection</h2>
        <div id="qr-container">
          <p>Loading...</p>
        </div>
        <p id="status">Status: Checking...</p>
      </div>

      <script>
        async function checkStatus() {
          try {
            const res = await fetch('/api/whatsapp/status');
            const data = await res.json();
            
            const statusEl = document.getElementById('status');
            const qrContainer = document.getElementById('qr-container');

            statusEl.textContent = 'Status: ' + data.status;

            if (data.status === 'connected') {
              statusEl.className = 'connected';
              qrContainer.innerHTML = '<h3>✅ Connected!</h3>';
            } else if (data.qr) {
              qrContainer.innerHTML = '<img src="' + data.qr + '" alt="Scan this QR code" />';
            } else {
              qrContainer.innerHTML = '<p>Waiting for QR code...</p>';
            }
          } catch (err) {
            console.error('Error fetching status', err);
          }
        }

        setInterval(checkStatus, 3000);
        checkStatus();
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

module.exports = router;
