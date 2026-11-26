const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const GIFEncoder = require("gif-encoder-2");
const twemoji = require("twemoji");
const fetch = require("node-fetch");

// --- Game Configuration ---
const symbols = ["🍒", "🍋", "🍊", "🍉", "⭐", "🔔", "💎", "7️⃣"];

// Récompenses (multiplicateurs) augmentées
const payouts = {
  "7️⃣7️⃣7️⃣": 500,
  "💎💎💎": 250,
  "🔔🔔🔔": 120,
  "⭐⭐⭐": 75,
  "🍉🍉🍉": 50,
  "🍊🍊🍊": 35,
  "🍋🍋🍋": 25,
  "🍒🍒🍒": 15,
  "🍒🍒": 5,
  "🍋🍋": 5,
  "🍊🍊": 5,
  "🍉🍉": 5,
  "⭐⭐": 6,
  "🔔🔔": 8,
  "💎💎": 12,
  "7️⃣7️⃣": 20,
};

// --- Weighted Reels ---
function generateWeightedReelStrip() {
  const weights = {
    "🍒": 10,
    "🍋": 9,
    "🍊": 8,
    "🍉": 7,
    "⭐": 6,
    "🔔": 5,
    "💎": 4,
    "7️⃣": 3,
  };
  const weightedStrip = [];
  for (const [symbol, weight] of Object.entries(weights)) {
    for (let i = 0; i < weight; i++) weightedStrip.push(symbol);
  }
  // Shuffle
  for (let i = weightedStrip.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [weightedStrip[i], weightedStrip[j]] = [weightedStrip[j], weightedStrip[i]];
  }
  return weightedStrip;
}
const weightedReelStrips = [
  generateWeightedReelStrip(),
  generateWeightedReelStrip(),
  generateWeightedReelStrip(),
];

// --- Colored Emoji Loader using Twemoji CDN ---
const emojiCache = {};

async function preloadEmojis() {
  for (const emoji of symbols) {
    if (emojiCache[emoji]) continue;

    try {
      const codePoint = twemoji.convert.toCodePoint(emoji);
      const emojiUrl = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${codePoint}.png`;

      const response = await fetch(emojiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch emoji: ${response.statusText}`);
      }

      const buffer = await response.buffer();
      const img = await loadImage(buffer);
      emojiCache[emoji] = img;
    } catch (error) {
      console.warn(`Failed to load emoji ${emoji}: ${error.message}`);
      const tempCanvas = createCanvas(72, 72);
      const tempCtx = tempCanvas.getContext("2d");

      const colors = {
        "🍒": "#FF0000", "🍋": "#FFFF00", "🍊": "#FFA500", "🍉": "#008000",
        "⭐": "#FFD700", "🔔": "#FFD700", "💎": "#4169E1", "7️⃣": "#FFFFFF"
      };

      tempCtx.fillStyle = colors[emoji] || "#FFFFFF";
      tempCtx.font = "bold 50px Arial";
      tempCtx.textAlign = "center";
      tempCtx.textBaseline = "middle";
      tempCtx.fillText(emoji, 36, 36);

      emojiCache[emoji] = await loadImage(tempCanvas.toBuffer());
    }
  }
}

function drawEmoji(ctx, x, y, emoji, size = 70) {
  const img = emojiCache[emoji];
  if (!img) {
    const colors = {
      "🍒": "#FF0000", "🍋": "#FFFF00", "🍊": "#FFA500", "🍉": "#008000",
      "⭐": "#FFD700", "🔔": "#FFD700", "💎": "#4169E1", "7️⃣": "#FFFFFF"
    };

    ctx.font = `bold ${Math.floor(size * 0.9)}px Arial`;
    ctx.textAlign = "center";
    ctx.fillStyle = colors[emoji] || "#FFFFFF";
    ctx.fillText(emoji, x, y + Math.floor(size * 0.3));
    return;
  }
  ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
}

// --- Shorten Number Helper ---
const units = ["", "K", "M", "B", "T", "Q", "S", "O", "N", "D"];

function shortenNumber(num) {
  if (typeof num !== "number") num = Number(num) || 0;
  if (num < 1000) return String(num);
  let unitIndex = 0;
  let n = num;
  while (n >= 1000 && unitIndex < units.length - 1) {
    n /= 1000;
    unitIndex++;
  }
  return n.toFixed(2).replace(/\.?0+$/, "") + units[unitIndex];
}

// --- Game Functions ---
function getResult() {
  const reel1 = weightedReelStrips[0][Math.floor(Math.random() * weightedReelStrips[0].length)];
  let reel2, reel3;
  const rand = Math.random();
  if (rand < 0.59) {
    reel2 = reel1;
    reel3 = Math.random() < 0.2 ? reel1 : symbols[Math.floor(Math.random() * symbols.length)];
  } else {
    reel2 = weightedReelStrips[1][Math.floor(Math.random() * weightedReelStrips[1].length)];
    reel3 = weightedReelStrips[2][Math.floor(Math.random() * weightedReelStrips[2].length)];
  }
  return [reel1, reel2, reel3];
}

function calculateWinnings(result, bet, baseBonus = 5000, jackpotBonus = 250000) {
  const joined = result.join("");
  if (payouts[joined]) {
    const mult = payouts[joined];
    const bonus = baseBonus + (mult >= 100 ? jackpotBonus : baseBonus * 2);
    return { amount: (bet * mult) + bonus, bonus, winType: "JACKPOT" };
  }
  const two01 = result[0] + result[1];
  const two12 = result[1] + result[2];
  if (payouts[two01]) {
    return { amount: (bet * payouts[two01]) + baseBonus, bonus: baseBonus, winType: "DOUBLE" };
  }
  if (payouts[two12]) {
    return { amount: (bet * payouts[two12]) + baseBonus, bonus: baseBonus, winType: "DOUBLE" };
  }
  return { amount: 0, bonus: 0, winType: "LOSS" };
}

// --- Module Export ---
module.exports = {
  config: {
    name: "slots",
    aliases: ["slots"],
    version: "2.5.0",
    author: "TawsiN | Updated by ST",
    role: 0,
    shortDescription: { en: "Play the slot machine" },
    longDescription: { en: "Slot machine game with animated GIF + colored Twemoji rendering." },
    category: "economy",
    guide: { en: "{pn} [bet_amount] (Default: 10,000)" },
    envConfig: {
      defaultBet: 10000,      // Mise par défaut si aucun montant n'est précisé
      minBet: 100,            // Mise minimum
      maxBet: 100000000,      // Limite maximale de mise (100 000 000 $)
      baseBonus: 5000,        // Prime de base sur chaque gain
      jackpotBonus: 250000    // Prime supplémentaire sur les jackpots
    }
  },

  ST: async function ({ api, event, message, usersData, args, envCommands, commandName }) {
    const cfg = envCommands?.[commandName] || this.config.envConfig;
    const defaultBet = cfg.defaultBet ?? 10000;
    const minBet = cfg.minBet ?? 100;
    const maxBet = cfg.maxBet ?? 100000000;
    const baseBonus = cfg.baseBonus ?? 5000;
    const jackpotBonus = cfg.jackpotBonus ?? 250000;

    let betAmount = defaultBet;
    if (args[0]) {
      betAmount = parseInt(args[0].replace(/[,_$]/g, ""), 10);
      if (isNaN(betAmount)) {
        return message.reply("Please enter a valid bet amount.");
      }
    }

    if (betAmount < minBet) {
      return message.reply(`Minimum bet is $${shortenNumber(minBet)}.`);
    }

    if (betAmount > maxBet) {
      return message.reply(`Maximum bet limit is $${shortenNumber(maxBet)}.`);
    }

    const senderID = event.senderID;

    if (!usersData || typeof usersData.get !== "function" || typeof usersData.set !== "function") {
      return message.reply("Internal error: user data store not available.");
    }

    let userData = await usersData.get(senderID);
    if (!userData) {
      userData = { money: 500, name: null, data: {} };
    }

    if (typeof userData.money !== "number" || userData.money < betAmount) {
      return message.reply("You don't have enough money to place that bet.");
    }

    const processingMessage = await message.reply("🎰 Slot machine creating, please wait...");

    try {
      await preloadEmojis();

      userData.money -= betAmount;
      await usersData.set(senderID, { ...userData });

      const result = getResult();
      const { amount: winnings, bonus, winType } = calculateWinnings(result, betAmount, baseBonus, jackpotBonus);

      if (winnings > 0) {
        userData.money += winnings;
        await usersData.set(senderID, { ...userData });
      }

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const gifPath = path.join(cacheDir, `slot_${senderID}_${Date.now()}.gif`);

      const canvasWidth = 600;
      const canvasHeight = 400;
      const encoder = new GIFEncoder(canvasWidth, canvasHeight);
      const gifStream = fs.createWriteStream(gifPath);
      encoder.createReadStream().pipe(gifStream);

      encoder.start();
      encoder.setRepeat(0);
      encoder.setDelay(100);
      encoder.setQuality(15);

      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      const reelWidth = 100;
      const reelHeight = 100;
      const reelPositionsX = [150, 300, 450];
      const reelWindowY = 190;
      const frameCount = 30;
      const spinDurationBase = 10;

      for (let i = 0; i < frameCount; i++) {
        const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
        gradient.addColorStop(0, "#1a1a2e");
        gradient.addColorStop(1, "#16213e");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.fillStyle = "#222242";
        ctx.fillRect(80, 110, 440, 160);
        ctx.strokeStyle = "#ffcc00";
        ctx.lineWidth = 5;
        ctx.strokeRect(80, 110, 440, 160);

        ctx.fillStyle = "#ffcc00";
        ctx.shadowColor = "rgba(255, 204, 0, 0.6)";
        ctx.shadowBlur = 10;
        ctx.font = "bold 44px Arial";
        ctx.textAlign = "center";
        ctx.fillText("SLOT MACHINE", canvasWidth / 2, 60);
        ctx.shadowBlur = 0;
        ctx.textAlign = "left";

        for (let r = 0; r < 3; r++) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(reelPositionsX[r] - reelWidth / 2, reelWindowY - reelHeight / 2, reelWidth, reelHeight);
          ctx.clip();

          const stopFrame = spinDurationBase + r * 6;
          if (i < stopFrame) {
            const spinOffset = (i * 20 + r * 10) % 120;
            for (let s = -1; s < 2; s++) {
              const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
              drawEmoji(ctx, reelPositionsX[r], reelWindowY + spinOffset + s * 100 - 50, randomSymbol, 70);
            }
          } else {
            if (winType !== "LOSS") {
              ctx.shadowColor = "#ffcc00";
              ctx.shadowBlur = 15;
            }
            drawEmoji(ctx, reelPositionsX[r], reelWindowY, result[r], 70);
            ctx.shadowBlur = 0;
          }
          ctx.restore();

          ctx.strokeStyle = "#444466";
          ctx.lineWidth = 2;
          ctx.strokeRect(reelPositionsX[r] - reelWidth / 2, reelWindowY - reelHeight / 2, reelWidth, reelHeight);
        }

        if (i >= frameCount - 2) {
          ctx.fillStyle = winnings > 0 ? "#4ade80" : "#ef4444";
          ctx.font = "bold 26px Arial";
          ctx.textAlign = "center";

          if (winType === "JACKPOT") {
            ctx.fillText(`JACKPOT! ${result.join(" ")}`, canvasWidth / 2, 312);
          } else if (winType === "DOUBLE") {
            ctx.fillText(`DOUBLE! ${result.join(" ")}`, canvasWidth / 2, 312);
          } else {
            ctx.fillText("NO WIN", canvasWidth / 2, 318);
            ctx.fillStyle = "#ef4444";
            ctx.font = "bold 20px Arial";
            ctx.fillText(`You lost: $${shortenNumber(betAmount)}`, canvasWidth / 2, 350);
          }

          if (winnings > 0) {
            ctx.fillStyle = "#ffcc00";
            ctx.font = "bold 20px Arial";
            ctx.fillText(`Won: $${shortenNumber(winnings)} (Bonus: +$${shortenNumber(bonus)})`, canvasWidth / 2, 348);
          }

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 18px Arial";
          ctx.fillText(`Bet: $${shortenNumber(betAmount)} | Balance: $${shortenNumber(userData.money)}`, canvasWidth / 2, 382);
        }

        encoder.addFrame(ctx);
      }

      for (let hold = 0; hold < 12; hold++) encoder.addFrame(ctx);

      encoder.finish();

      await new Promise((resolve, reject) => {
        gifStream.on("finish", resolve);
        gifStream.on("error", reject);
      });

      let resultMessage = "🎰 Slot Result 🎰\n";
      resultMessage += `Bet: $${shortenNumber(betAmount)}\n`;
      resultMessage += `Result: ${result.join(" ")}\n`;

      if (winType === "JACKPOT") {
        resultMessage += `JACKPOT! Three ${result[0]} symbols!\n`;
      } else if (winType === "DOUBLE") {
        resultMessage += `DOUBLE! Two matching symbols!\n`;
      } else {
        resultMessage += `No winning combination.\n`;
        resultMessage += `You lost: $${shortenNumber(betAmount)}\n`;
      }

      if (winnings > 0) {
        resultMessage += `Bonus: +$${shortenNumber(bonus)}\n`;
        resultMessage += `You won: $${shortenNumber(winnings)}!\n`;
      }

      resultMessage += `New balance: $${shortenNumber(userData.money)}`;

      await message.reply({
        body: resultMessage,
        attachment: fs.createReadStream(gifPath),
      });

      try {
        await fs.unlink(gifPath);
      } catch (e) {}

      try {
        if (processingMessage && processingMessage.messageID && typeof message.unsend === "function") {
          message.unsend(processingMessage.messageID).catch(() => {});
        }
      } catch (e) {}
    } catch (error) {
      console.error("Slot machine error:", error);
      try {
        if (processingMessage && typeof message.unsend === "function") {
          message.unsend(processingMessage.messageID).catch(() => {});
        }
      } catch (e) {}
      return message.reply("Sorry, the slot machine encountered an error. Please try again later.");
    }
  },
};
  
