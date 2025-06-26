const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());

function hkdf(key, salt, info, length) {
  const prk = crypto.createHmac('sha256', salt).update(key).digest();
  let t = Buffer.alloc(0);
  let okm = Buffer.alloc(0);
  let i = 0;
  while (okm.length < length) {
    i++;
    t = crypto.createHmac('sha256', prk).update(Buffer.concat([t, Buffer.from(info), Buffer.from([i])])).digest();
    okm = Buffer.concat([okm, t]);
  }
  return okm.slice(0, length);
}

function decryptFile(encrypted, mediaKey) {
  const expandedKey = hkdf(mediaKey, Buffer.alloc(32, 0), "WhatsApp Media Keys", 112);
  const iv = expandedKey.slice(0, 16);
  const cipherKey = expandedKey.slice(16, 48);
  const decipher = crypto.createDecipheriv('aes-256-cbc', cipherKey, iv);
  const fileContent = encrypted.slice(0, encrypted.length - 10); // remove MAC
  return Buffer.concat([decipher.update(fileContent), decipher.final()]);
}

app.post('/decrypt', async (req, res) => {
  try {
    const { url, mediaKeyBase64 } = req.body;
    if (!url || !mediaKeyBase64) {
      return res.status(400).json({ error: 'Missing url or mediaKeyBase64' });
    }

    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const encrypted = Buffer.from(response.data);
    const mediaKey = Buffer.from(mediaKeyBase64, 'base64');
    const decryptedPDF = decryptFile(encrypted, mediaKey);

    res.json({
      base64: decryptedPDF.toString('base64'),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to decrypt file' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
