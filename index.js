import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import axios from "axios";

const SHEETS_WEBHOOK = process.env.SHEETS_WEBHOOK;
const KEYWORDS = (process.env.KEYWORDS || "").split(",");

function hasNumber(text) {
  return /\d/.test(text);
}

function hasUrl(text) {
  return /(https?:\/\/|www\.)/.test(text);
}

function wordCount(text) {
  return text.trim().split(/\s+/).length;
}

function matchKeyword(text) {
  const lower = text.toLowerCase();
  return KEYWORDS.find(k => lower.includes(k.trim()));
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const sock = makeWASocket({ auth: state });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || !msg.key.remoteJid.endsWith("@g.us")) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    if (!text) return;
    if (wordCount(text) > 10) return;
    if (hasNumber(text)) return;
    if (hasUrl(text)) return;

    const keyword = matchKeyword(text);
    if (!keyword) return;

    await axios.post(SHEETS_WEBHOOK, {
      time: new Date().toISOString(),
      group: msg.key.remoteJid,
      message: text,
      keyword
    });
  });

  console.log("✅ Bot is running");
}

startBot();
