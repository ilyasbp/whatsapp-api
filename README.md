# Whatsapp Business API

## Getting Started

1. Buat akun developer facebook
2. Buat aplikasi baru
   - Klik tombol “My Apps” → “Create App”
   - Pilih tipe aplikasi: Business
   - Masukkan:
     - App Name: (bebas, misal Test WA API)
     - Email developer
     - Hubungkan ke akun bisnis (kalau belum punya, bisa lewati dulu)
   - Klik “Create App”
3. Setup WhatsApp API
   - Setelah aplikasi berhasil dibuat, di dashboard pilih menu “WhatsApp”
   - Klik “Set up”
4. Catat Data API

   Di halaman WhatsApp API, kamu akan melihat:

   - Temporary Access Token
   - Phone Number ID
   - WhatsApp Business Account ID

   Simpan ketiga data itu!

## Webhook

Biar sistem kamu bisa tahu kalau:

- Ada pesan masuk
- Ada error
- Status pesan terkirim, dibaca, dst

Kamu tinggal siapkan endpoint seperti https://domainkamu.com/webhook
daftarkan di Developer App Settings → Webhooks

**Contoh webhook Node.js**

```js
// Verifikasi webhook
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

// Handle pesan masuk
app.post("/webhook", async (req, res) => {
  const body = req.body;
  console.log(JSON.stringify(body, null, 2));

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
      case "jadwal_buka":
        await sendText(
          from,
          "Kami buka setiap Senin–Jumat, pukul 08.00–17.00 WIB. Kami tunggu kedatangan Anda!"
        );
        break;
      case "status_servis":
        await sendText(
          from,
          "Kendaraan Anda dengan Nomor Polisi AB 2849 DK sedang ditangani oleh teknisi kami. Silakan pantau statusnya secara berkala melalui aplikasi e-Care. Terima kasih atas kesabaran Anda."
        );
        break;
      default:
        await sendText(
          from,
          "Maaf, pilihan tidak dikenali. Silakan pilih dari menu yang tersedia."
        );
    }
  } else {
    // Jika bukan klik tombol, kirim menu utama
    await sendMenu(from);
  }

  res.sendStatus(200);
});
```

## Mengirim pesan menggunakan template

**Endpoint**

```
https://graph.facebook.com/v22.0/{PHONE_NUMBER_ID}/messages
```

**Header**

```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN",
  "Content-Type": "application/json"
}
```

**Body**

```json
{
  "messaging_product": "whatsapp",
  "to": "6281234567890",
  "type": "template",
  "template": {
    "name": "notifikasi_servis_selesai",
    "language": {
      "code": "id"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "Ilyas"
          },
          {
            "type": "text",
            "text": "L 1234 XY"
          }
        ]
      }
    ]
  }
}
```

keterangan:

- nomor tujuannya `6281234567890`
- typenya `template`
- template yang dipakai `notifikasi_servis_selesai`
- parameternya ada 2 bertipe text

**Contoh Node.js**

```js
await axios.post(
  `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
  {
    messaging_product: "whatsapp",
    to: "6281234567890",
    type: "template",
    template: {
      name: "notifikasi_servis_selesai",
      language: { code: "id" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: "Ilyas" },
            { type: "text", text: "L 1234 XY" },
          ],
        },
      ],
    },
  },
  {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  }
);
```

## Mengirim pesan interaktif

**Endpoint**

```
https://graph.facebook.com/v22.0/{PHONE_NUMBER_ID}/messages
```

**Header**

```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN",
  "Content-Type": "application/json"
}
```

**Body**

```json
{
  "messaging_product": "whatsapp",
  "to": "6281234567890",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": {
      "text": "Halo Ilyas,\n\nUsername: Ilyas Bintang Prayogi\nNomor ID Pelanggan: 981273498129\n\nSelamat datang kembali di e-Care Honda Customer Care WhatsApp!\nAda yang bisa kami bantu hari ini?"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "info_harga",
            "title": "Info Harga Mobil"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "jadwal_buka",
            "title": "Jadwal Buka"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "status_servis",
            "title": "Status Servis"
          }
        }
      ]
    }
  }
}
```

keterangan:

- nomor tujuannya `6281234567890`
- typenya `interactive`
- actionnya ada 3 button

**Contoh Node.js**

```js
async function sendMenu(to) {
  const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

  const data = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: `Halo Ilyas,

        Username: Ilyas Bintang Prayogi
        Nomor ID Pelanggan: 981273498129

        Selamat datang kembali di e-Care Honda Customer Care WhatsApp!
        Ada yang bisa kami bantu hari ini?`,
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: { id: "info_harga", title: "Info Harga Mobil" },
          },
          { type: "reply", reply: { id: "jadwal_buka", title: "Jadwal Buka" } },
          {
            type: "reply",
            reply: { id: "status_servis", title: "Status Servis" },
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

    console.log(`✅ Menu terkirim ke ${to}`);
  } catch (err) {
    console.error("❌ Gagal kirim menu:", err.response?.data || err.message);
  }
}
```

## Response

**Response message ketika user pencet tombol interactive**

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "3959550450977480",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15556555741",
              "phone_number_id": "699471219911903"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Bintang"
                },
                "wa_id": "628999800735"
              }
            ],
            "messages": [
              {
                "context": {
                  "from": "15556555741",
                  "id": "wamid.HBgMNjI4OTk5ODAwNzM1FQIAERgSNTVERDk2NzY1NjJEOUYyMDRDAA=="
                },
                "from": "628999800735",
                "id": "wamid.HBgMNjI4OTk5ODAwNzM1FQIAEhggQkQ0QUE3OTFDQUY3NUI1MEZCMzBEQzhFNzY5NDZFQkMA",
                "timestamp": "1749961132",
                "type": "interactive",
                "interactive": {
                  "type": "button_reply",
                  "button_reply": {
                    "id": "info_harga",
                    "title": "Info Harga Mobil"
                  }
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Response message ketika user kirim pesan berupa text**

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "3959550450977480",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15556555741",
              "phone_number_id": "699471219911903"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Bintang"
                },
                "wa_id": "628999800735"
              }
            ],
            "messages": [
              {
                "from": "628999800735",
                "id": "wamid.HBgMNjI4OTk5ODAwNzM1FQIAEhggRDY0MjMyMUIzRkRDQ0FEMEJGNDYxRTY1MzUzMDI1QTUA",
                "timestamp": "1749957977",
                "text": {
                  "body": "Halo dek"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```
