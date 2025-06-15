// === 1. Import Library ===
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// === 2. Konfigurasi ===
const VERIFY_TOKEN = "token_anda"; // ini nanti diisi ke form webhook meta
const ACCESS_TOKEN = ""; // ganti dengan WhatsApp Cloud API Access Token
const PHONE_NUMBER_ID = ""; // ganti dengan phone_number_id dari Meta
const GEMINI_API_KEY = ""; // ganti dengan gemini API Key

const app = express();
app.use(bodyParser.json());

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
let aiModeUsers = new Set();

// === 3. Endpoint Verifikasi Webhook ===
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WEBHOOK_VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// === 4. Webhook untuk Handle Pesan ===
app.post("/webhook", async (req, res) => {
  const body = req.body;
  const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  const from = msg?.from;

  if (!from) return res.sendStatus(200);

  if (msg.type === "interactive" && msg.interactive?.type === "button_reply") {
    const payload = msg.interactive.button_reply.id;

    switch (payload) {
      case "info_harga":
        await sendText(
          from,
          "Model dan harga mobil terbaru bisa Anda lihat di situs resmi kami: https://www.honda-indonesia.com/"
        );
        break;
      case "status_servis":
        await sendText(
          from,
          "Kendaraan Anda dengan Nomor Polisi AB 2849 DK sedang ditangani oleh teknisi kami. Silakan pantau statusnya secara berkala melalui aplikasi e-Care. Terima kasih atas kesabaran Anda."
        );
        break;
      case "chat_ai":
        aiModeUsers.add(from);
        await sendText(
          from,
          "Silakan ketik pertanyaan Anda, saya akan bantu dengan AI ✨"
        );
        break;
      case "back_to_menu":
        aiModeUsers.delete(from);
        await sendMenu(from);
        break;
      default:
        await sendText(
          from,
          "Maaf, pilihan tidak dikenali. Silakan pilih dari menu yang tersedia."
        );
    }
  } else if (msg.type === "text" && aiModeUsers.has(from)) {
    const userInput = msg.text.body;
    const aiReply = await chatWithGemini(userInput);
    await sendText(from, aiReply);
    await sendBackToMenuButton(from);
  } else {
    await sendMenu(from);
  }

  res.sendStatus(200);
});

// === 5. Fungsi Kirim Menu ===
async function sendMenu(to) {
  const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

  const data = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: `Halo Ilyas,\n\nUsername: Ilyas Bintang Prayogi\nNomor ID Pelanggan: 981273498129\n\nSelamat datang kembali di e-Care Honda Customer Care WhatsApp!\nAda yang bisa kami bantu hari ini?`,
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: { id: "info_harga", title: "Info Harga Mobil" },
          },
          {
            type: "reply",
            reply: { id: "status_servis", title: "Status Servis" },
          },
          { type: "reply", reply: { id: "chat_ai", title: "Chat dengan AI" } },
        ],
      },
    },
  };

  try {
    await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    console.log(`✅ Menu terkirim ke ${to}`);
  } catch (err) {
    console.error("❌ Gagal kirim menu:", err.response?.data || err.message);
  }
}

// === 6. Fungsi Kirim Teks ===
async function sendText(to, text) {
  const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

  const data = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  };

  try {
    await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    console.log(`✅ Teks terkirim ke ${to}`);
  } catch (err) {
    console.error("❌ Gagal kirim teks:", err.response?.data || err.message);
  }
}

// === 7. Fungsi Chat dengan Gemini AI ===
async function chatWithGemini(userMessage) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const chat = model.startChat();
    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error(
      "❌ Gagal kirim ke Gemini:",
      err.response?.data || err.message
    );
    return "Maaf, terjadi kesalahan saat menghubungi AI.";
  }
}

async function sendBackToMenuButton(to) {
  const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

  const data = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: "Apakah Anda ingin kembali ke menu utama?",
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: "back_to_menu",
              title: "🔙 Kembali ke Menu",
            },
          },
        ],
      },
    },
  };

  try {
    await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error(
      "❌ Gagal kirim tombol kembali:",
      err.response?.data || err.message
    );
  }
}

// === 8. Menjalankan Server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server jalan di http://localhost:${PORT}`);
});
