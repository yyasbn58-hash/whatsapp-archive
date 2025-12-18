import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import axios from "axios";
import pino from "pino";

const logger = pino({ level: "silent" });

// رابط Google Sheets Webhook
const WEBHOOK = process.env.SHEETS_WEBHOOK;

// الكلمات المفتاحية
const KEYWORDS = (process.env.KEYWORDS || "")
  .split(",")
  .map(k => k.trim())
  .filter(Boolean);

function match(text = "") {
  const t = text.toLowerCase();
  return KEYWORDS.find(k => t.includes(k.toLowerCase()));
}

async function start() {
  if (!WEBHOOK) {
    console.error("Missing SHEETS_WEBHOOK");
    process.exit(1);
  }

  const { state, saveCreds } = await useMultiFileAuthState("./auth");
  const sock = makeWASocket({ auth: state, logger });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message) continue;

      const jid = msg.key.remoteJid || "";
      if (!jid.endsWith("@g.us")) continue;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      if (!text) continue;

      const keyword = match(text);
      if (!keyword) continue;

      const link = `https://wa.me/${jid.replace("@g.us","")}`;

      await axios.post(WEBHOOK, {
        group: jid,
        message: text,
        keyword,
        link
      });
    }
  });

  console.log("✅ Bot running, waiting for WhatsApp messages...");
}

start();
