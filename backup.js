const express = require("express");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

const app = express();
app.use(express.json({ limit: "10mb" })); // suporta JSON grande

// Endpoint POST para receber a mensagem e retornar o base64
app.post("/decode-media", async (req, res) => {
  try {
    const msg = req.body; // RECEBA o objeto da mensagem completo aqui

    if (!msg || !msg.message) {
      return res.status(400).json({ error: "Objeto da mensagem inválido ou ausente" });
    }

    // Aqui passa o objeto completo da mensagem para o Baileys
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