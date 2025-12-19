import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import axios from "axios";

const SHEETS_WEBHOOK = process.env.SHEETS_WEBHOOK;
const KEYWORDS = (process.env.KEYWORDS || "").split(",");

function match(text = "") {
  return KEYWORDS.find(k => text.includes(k));
}

function hasUrl(text = "") {
  return /(https?:\/\/|www\.)\S+/i.test(text);
}

function hasNumber(text = "") {
  return /\d/.test(text);
}

function wordCount(text = "") {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const sock = makeWASocket({ auth: state });

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
      if (wordCount(text) > 10) continue;
      if (hasUrl(text)) continue;
      if (hasNumber(text)) continue;

      await axios.post(SHEETS_WEBHOOK, {
        time: new Date().toISOString(),
        group: jid,
        message: text,
        keyword
      });
    }
  });
}

start();
