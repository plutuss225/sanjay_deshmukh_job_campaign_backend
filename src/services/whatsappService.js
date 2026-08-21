const { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode');

let socket = null;
let currentQR = null;
let connectionStatus = 'connecting';

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  socket = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true, // Helpful for debugging
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: false
  });

  socket.ev.on('creds.update', saveCreds);

  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        currentQR = await qrcode.toDataURL(qr);
      } catch (err) {
        console.error('Error generating QR code base64', err);
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('WhatsApp connection closed due to', lastDisconnect.error, ', reconnecting:', shouldReconnect);
      connectionStatus = 'disconnected';
      
      if (shouldReconnect) {
        connectToWhatsApp();
      } else {
        console.log('Connection logged out or unauthorized. Clearing corrupted session and restarting...');
        currentQR = null;
        try {
          const fs = require('fs');
          fs.rmSync('auth_info_baileys', { recursive: true, force: true });
        } catch (e) {
          console.error('Failed to clear session folder:', e);
        }
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('WhatsApp connected successfully!');
      connectionStatus = 'connected';
      currentQR = null;
    }
  });
}

// Start connection immediately when service is imported
connectToWhatsApp();

async function sendMessage(phoneNumber, message) {
  if (connectionStatus !== 'connected' || !socket) {
    throw new Error('WhatsApp is not connected.');
  }

  // Basic formatting: remove non-digits
  let formattedNumber = phoneNumber.replace(/\D/g, '');
  
  // If 10 digits (India), prepend 91
  if (formattedNumber.length === 10) {
    formattedNumber = '91' + formattedNumber;
  }
  
  const jid = `${formattedNumber}@s.whatsapp.net`;
  
  // Verify if the number is registered on WhatsApp
  const [result] = await socket.onWhatsApp(jid);
  console.log(`Checking WhatsApp registration for ${jid}:`, result);
  
  if (!result || !result.exists) {
    throw new Error('Phone number is not registered on WhatsApp.');
  }
  
  console.log(`Attempting to send message to ${result.jid}...`);
  
  try {
    // Simulate typing to prevent WhatsApp Business from silently dropping messages as spam
    await socket.presenceSubscribe(result.jid);
    await new Promise(resolve => setTimeout(resolve, 500));
    await socket.sendPresenceUpdate('composing', result.jid);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulating 1.5s typing
    await socket.sendPresenceUpdate('paused', result.jid);
  } catch (e) {
    console.error('Error simulating typing presence:', e);
  }

  const sentMsg = await socket.sendMessage(result.jid, { text: message });
  console.log('Message successfully dispatched to WhatsApp servers:', sentMsg?.key);
}

module.exports = {
  getStatus: () => connectionStatus,
  getQR: () => currentQR,
  getSocket: () => socket,
  sendMessage
};
