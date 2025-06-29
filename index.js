const express = require("express");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

const app = express();
app.use(express.json({ limit: "10mb" })); // suporta JSON grande

app.post("/decode-media", async (req, res) => {
  try {
    const msg = req.body;

    if (!msg || !msg.message) {
      return res.status(400).json({ error: "Objeto da mensagem inválido ou ausente" });
    }

    const documentMsg = msg.message.documentMessage;
    if (documentMsg?.mimetype) {
      const mime = documentMsg.mimetype;

      // Mapeamento dinâmico baseado no tipo MIME
      if (mime.startsWith("image/")) {
        msg.message.imageMessage = { ...documentMsg };
        delete msg.message.documentMessage;
      } else if (mime.startsWith("video/")) {
        msg.message.videoMessage = { ...documentMsg };
        delete msg.message.documentMessage;
      } else if (mime.startsWith("audio/")) {
        msg.message.audioMessage = { ...documentMsg };
        delete msg.message.documentMessage;
      } else if (mime === "application/pdf") {
        // continua como documentMessage, pois o Baileys já trata PDF como documento
      } else {
        return res.status(400).json({ error: `Tipo MIME não suportado: ${mime}` });
      }
    }

    const buffer = await downloadMediaMessage(msg, "buffer", {}, {
      reuploadRequest: async () => {
        throw new Error("Reupload não implementado.");
      },
    });

    const base64 = buffer.toString("base64");
    res.json({ base64 });
  } catch (err) {
    console.error("Erro ao decodificar mídia:", err);
    res.status(500).json({ error: err.message });
  }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});