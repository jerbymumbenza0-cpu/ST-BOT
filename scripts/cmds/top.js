"use strict";

const path = require("path");
const fs = require("fs-extra");
const axios = require("axios");

let createCanvas = null;
let loadImage = null;
let canvasReady = false;

try {
  const canvasPkg = require("canvas");
  createCanvas = canvasPkg.createCanvas;
  loadImage = canvasPkg.loadImage;
  canvasReady = typeof createCanvas === "function" && typeof loadImage === "function";
} catch (_) {
  canvasReady = false;
}

const THEMES = {
  gold: {
    label: "Royal Gold",
    bgTop: "#141008",
    bgBottom: "#090704",
    cardBg: "rgba(255, 215, 115, 0.06)",
    cardBorder: "rgba(255, 215, 115, 0.24)",
    accent: "#F5C85C",
    accentSoft: "rgba(245, 200, 92, 0.18)",
    textMain: "#FFF9EB",
    textMuted: "#B8A98A",
    barStart: "#9E6B13",
    barEnd: "#FFE08A",
  },
  neon: {
    label: "Cyber Neon",
    bgTop: "#090D1A",
    bgBottom: "#05070F",
    cardBg: "rgba(56, 189, 248, 0.06)",
    cardBorder: "rgba(56, 189, 248, 0.25)",
    accent: "#38BDF8",
    accentSoft: "rgba(56, 189, 248, 0.18)",
    textMain: "#F0F9FF",
    textMuted: "#94A3B8",
    barStart: "#0284C7",
    barEnd: "#67E8F9",
  },
  emerald: {
    label: "Jade Emerald",
    bgTop: "#071711",
    bgBottom: "#040D09",
    cardBg: "rgba(52, 211, 153, 0.06)",
    cardBorder: "rgba(52, 211, 153, 0.24)",
    accent: "#34D399",
    accentSoft: "rgba(52, 211, 153, 0.18)",
    textMain: "#ECFDF5",
    textMuted: "#86A89B",
    barStart: "#059669",
    barEnd: "#A7F3D0",
  },
  crimson: {
    label: "Crimson Eclipse",
    bgTop: "#19080B",
    bgBottom: "#0B0406",
    cardBg: "rgba(248, 113, 113, 0.06)",
    cardBorder: "rgba(248, 113, 113, 0.24)",
    accent: "#F87171",
    accentSoft: "rgba(248, 113, 113, 0.18)",
    textMain: "#FEF2F2",
    textMuted: "#B89398",
    barStart: "#B91C1C",
    barEnd: "#FCA5A5",
  },
};

function getTheme(name) {
  const key = String(name || "gold").toLowerCase().trim();
  return THEMES[key] || THEMES.gold;
}

function formatScore(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  const sign = num < 0 ? "-" : "";
  const abs = Math.abs(num);

  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2).replace(/\.00$/, "")}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2).replace(/\.00$/, "")}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2).replace(/\.00$/, "")}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return `${sign}${Math.round(abs).toLocaleString("fr-FR")}`;
}

function truncateText(ctx, text, maxWidth) {
  const clean = String(text || "Joueur");
  if (ctx.measureText(clean).width <= maxWidth) return clean;
  let out = clean;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawFallbackAvatar(ctx, cx, cy, radius, name, accent) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#1E2230";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = accent;
  ctx.stroke();

  const initials =
    String(name || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase() || "?";

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${Math.round(radius * 0.75)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, cx, cy + 2);
  ctx.restore();
}

async function resolveAvatar(entry, theme) {
  if (!canvasReady) return null;
  if (entry.avatarUrl) {
    try {
      const res = await axios.get(entry.avatarUrl, {
        responseType: "arraybuffer",
        timeout: 4000,
      });
      if (res?.data) {
        return await loadImage(Buffer.from(res.data));
      }
    } catch (_) {}
  }

  if (entry.userID) {
    try {
      const url = `https://graph.facebook.com/${encodeURIComponent(entry.userID)}/picture?width=240&height=240&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const res = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 4000,
      });
      if (res?.data) {
        return await loadImage(Buffer.from(res.data));
      }
    } catch (_) {}
  }

  return null;
}

function drawAvatar(ctx, img, cx, cy, radius, name, ringColor) {
  if (!img) {
    drawFallbackAvatar(ctx, cx, cy, radius, name, ringColor);
    return;
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = ringColor;
  ctx.stroke();
  ctx.restore();
}

function drawProgressBar(ctx, x, y, w, h, ratio, theme) {
  const clamped = Math.max(0, Math.min(1, Number(ratio) || 0));
  const fillW = clamped > 0 ? Math.max(h, w * clamped) : 0;

  ctx.save();
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.10)";
  ctx.fill();

  if (fillW > 0) {
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, theme.barStart);
    grad.addColorStop(1, theme.barEnd);
    roundRect(ctx, x, y, fillW, h, h / 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }
  ctx.restore();
}

async function generateLeaderboardImage({ title, subtitle, entries, themeKey }) {
  if (!canvasReady) {
    throw new Error("Le module 'canvas' n'est pas disponible.");
  }

  const theme = getTheme(themeKey);
  const sorted = [...entries]
    .map((item, idx) => ({
      userID: item.userID || String(idx + 1),
      name: item.name || `Membre ${idx + 1}`,
      score: Number(item.score) || 0,
      avatarUrl: item.avatarUrl || null,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const topScore = sorted.length > 0 ? Math.max(1, sorted[0].score) : 1;
  const top3 = sorted.slice(0, 3);
  const runnersUp = sorted.slice(3);

  const width = 1280;
  const headerHeight = 170;
  const podiumHeight = top3.length > 0 ? 330 : 0;
  const rowHeight = 76;
  const rowGap = 12;
  const listHeight = runnersUp.length > 0 ? runnersUp.length * (rowHeight + rowGap) + 20 : 0;
  const footerHeight = 64;
  const height = Math.max(520, headerHeight + podiumHeight + listHeight + footerHeight);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Fond dégradé
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, theme.bgTop);
  bgGrad.addColorStop(1, theme.bgBottom);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Lueur supérieure douce
  const glowGrad = ctx.createRadialGradient(width / 2, 40, 20, width / 2, 40, 520);
  glowGrad.addColorStop(0, theme.accentSoft);
  glowGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, width, 420);

  // En-tête
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = theme.accent;
  ctx.font = "bold 42px sans-serif";
  ctx.fillText(truncateText(ctx, title || "CLASSEMENT TOP", width - 120), width / 2, 66);

  ctx.fillStyle = theme.textMuted;
  ctx.font = "normal 22px sans-serif";
  ctx.fillText(
    truncateText(ctx, subtitle || `Thème : ${theme.label}`, width - 120),
    width / 2,
    114
  );

  // Charger les avatars en parallèle
  const avatarMap = new Map();
  await Promise.all(
    sorted.map(async (entry) => {
      const img = await resolveAvatar(entry, theme);
      avatarMap.set(entry.userID, img);
    })
  );

  // Podium Top 3 (#2 gauche, #1 centre, #3 droite)
  if (top3.length > 0) {
    const slots = [
      top3[1] ? { entry: top3[1], rank: 2, badge: "🥈 #2", cx: width * 0.23, cy: 285, r: 48, ring: "#CBD5E1" } : null,
      top3[0] ? { entry: top3[0], rank: 1, badge: "👑 #1", cx: width * 0.50, cy: 265, r: 60, ring: theme.accent } : null,
      top3[2] ? { entry: top3[2], rank: 3, badge: "🥉 #3", cx: width * 0.77, cy: 285, r: 48, ring: "#D97706" } : null,
    ].filter(Boolean);

    for (const slot of slots) {
      const cardW = slot.rank === 1 ? 330 : 290;
      const cardH = slot.rank === 1 ? 255 : 225;
      const cardX = slot.cx - cardW / 2;
      const cardY = slot.cy - slot.r - 36;

      roundRect(ctx, cardX, cardY, cardW, cardH, 20);
      ctx.fillStyle = theme.cardBg;
      ctx.fill();
      ctx.lineWidth = slot.rank === 1 ? 2 : 1.2;
      ctx.strokeStyle = slot.rank === 1 ? theme.accent : theme.cardBorder;
      ctx.stroke();

      ctx.fillStyle = slot.ring;
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(slot.badge, slot.cx, cardY + 26);

      drawAvatar(
        ctx,
        avatarMap.get(slot.entry.userID),
        slot.cx,
        cardY + 86,
        slot.r,
        slot.entry.name,
        slot.ring
      );

      const nameY = cardY + slot.r * 2 + 56;
      ctx.fillStyle = theme.textMain;
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(truncateText(ctx, slot.entry.name, cardW - 36), slot.cx, nameY);

      ctx.fillStyle = theme.accent;
      ctx.font = "bold 21px sans-serif";
      ctx.fillText(formatScore(slot.entry.score), slot.cx, nameY + 30);

      drawProgressBar(ctx, cardX + 36, nameY + 52, cardW - 72, 9, slot.entry.score / topScore, theme);
    }
  }

  // Lignes #4 à #10
  let yCursor = headerHeight + podiumHeight + 8;
  for (let i = 0; i < runnersUp.length; i++) {
    const entry = runnersUp[i];
    const rank = i + 4;
    const x = 70;
    const w = width - 140;

    roundRect(ctx, x, yCursor, w, rowHeight, 14);
    ctx.fillStyle = theme.cardBg;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = theme.cardBorder;
    ctx.stroke();

    const midY = yCursor + rowHeight / 2;

    ctx.textAlign = "left";
    ctx.fillStyle = theme.accent;
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(`#${rank}`, x + 24, midY);

    drawAvatar(ctx, avatarMap.get(entry.userID), x + 92, midY, 24, entry.name, theme.cardBorder);

    ctx.fillStyle = theme.textMain;
    ctx.font = "bold 21px sans-serif";
    ctx.fillText(truncateText(ctx, entry.name, 360), x + 132, midY);

    drawProgressBar(ctx, x + 515, midY - 6, 360, 12, entry.score / topScore, theme);

    ctx.textAlign = "right";
    ctx.fillStyle = theme.accent;
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(formatScore(entry.score), x + w - 24, midY);

    yCursor += rowHeight + rowGap;
  }

  // Pied de page
  ctx.textAlign = "center";
  ctx.fillStyle = theme.textMuted;
  ctx.font = "normal 16px sans-serif";
  ctx.fillText(
    `Total affiché : ${sorted.length} membre(s) • Thèmes : ${Object.keys(THEMES).join(", ")}`,
    width / 2,
    height - 26
  );

  return canvas.toBuffer("image/png");
}

async function collectEntries({ event, usersData, threadsData }) {
  const entries = [];
  const threadID = event?.threadID;

  let memberIDs = Array.isArray(event?.participantIDs) ? [...event.participantIDs] : [];
  if (memberIDs.length === 0 && threadsData && threadID) {
    try {
      const threadInfo = await threadsData.get(threadID);
      if (Array.isArray(threadInfo?.participantIDs)) {
        memberIDs = threadInfo.participantIDs;
      } else if (Array.isArray(threadInfo?.members)) {
        memberIDs = threadInfo.members.map((m) => m.userID || m.id).filter(Boolean);
      }
    } catch (_) {}
  }

  const uniqueIDs = [...new Set(memberIDs.map(String))].filter(Boolean).slice(0, 30);

  if (usersData && uniqueIDs.length > 0) {
    await Promise.all(
      uniqueIDs.map(async (uid) => {
        try {
          const user = await usersData.get(uid);
          const rawScore =
            user?.money ??
            user?.balance ??
            user?.coins ??
            user?.exp ??
            user?.data?.money ??
            0;
          entries.push({
            userID: uid,
            name: user?.name || `Membre ${uid.slice(-4)}`,
            score: Number(rawScore) || 0,
          });
        } catch (_) {}
      })
    );
  }

  // Repli si aucun score trouvé (ex. test hors base)
  if (entries.length === 0 || entries.every((e) => e.score <= 0)) {
    return [
      { userID: "1", name: "Souverain", score: 1250000 },
      { userID: "2", name: "Vanguard", score: 890000 },
      { userID: "3", name: "Aegis", score: 640000 },
      { userID: "4", name: "Nova", score: 410000 },
      { userID: "5", name: "Cipher", score: 275000 },
      { userID: "6", name: "Pulse", score: 150000 },
    ];
  }

  return entries;
}

async function runCommand({ event, message, args = [], usersData, threadsData }) {
  const firstArg = String(args[0] || "").toLowerCase();

  if (["themes", "theme", "list"].includes(firstArg)) {
    const lines = Object.entries(THEMES).map(
      ([key, cfg]) => `• **${cfg.label}** (\`${key}\`)`
    );
    return message.reply(`🎨 **Thèmes disponibles :**\n${lines.join("\n")}`);
  }

  const themeKey = THEMES[firstArg] ? firstArg : "gold";
  const theme = getTheme(themeKey);

  if (!canvasReady) {
    return message.reply(
      "❌ Impossible de générer l'image car le module `canvas` n'est pas installé."
    );
  }

  const tempDir = path.join(__dirname, "tmp");
  const tempFile = path.join(tempDir, `top_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.png`);

  try {
    await fs.ensureDir(tempDir);
    const entries = await collectEntries({ event, usersData, threadsData });
    const buffer = await generateLeaderboardImage({
      title: "PANTHÉON DU CLASSEMENT",
      subtitle: `${event?.threadName || "Groupe"} • ${theme.label}`,
      entries,
      themeKey,
    });

    await fs.writeFile(tempFile, buffer);

    await message.reply({
      body: `🏆 **Classement Top** — Thème *${theme.label}*`,
      attachment: fs.createReadStream(tempFile),
    });
  } catch (err) {
    console.error("[TOP COMMAND ERROR]", err);
    await message.reply(`❌ Erreur lors de la création du classement : ${err.message}`);
  } finally {
    await fs.remove(tempFile).catch(() => {});
  }
}

module.exports = {
  config: {
    name: "top",
    aliases: ["classement", "lb", "leaderboard"],
    version: "2.0.0",
    author: "Custom",
    countDown: 5,
    role: 0,
    category: "economy",
    guide: {
      fr: "{pn} [thème] — affiche l'image du classement\n{pn} themes — liste les thèmes disponibles",
    },
  },
  onStart: runCommand,
  onRun: runCommand,
  run: runCommand,
};
      
