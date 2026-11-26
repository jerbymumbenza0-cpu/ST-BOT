const { createCanvas } = require('canvas');
const GIFEncoder = require('gif-encoder-2');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "slot",
    aliases: [],
    version: "2.5.0",
    author: "ST | Sheikh Tamim",
    countDown: 10,
    role: 0,
    premium: false,
    usePrefix: true,
    description: "Play hexagonal slot machine with beautiful animations!",
    category: "game",
    guide: "{pn} [bet amount] - Spin the hexagonal slots! (Default bet: 10,000$)",
    envConfig: {
      defaultBet: 10000,      // Mise par défaut si aucun montant n'est précisé
      minBet: 100,            // Mise minimum
      maxBet: 100000000,      // Limite maximale de mise (100 000 000 $)
      pairMultiplier: 3,      // Multiplicateur pour 2 symboles identiques (au lieu de 2)
      baseBonus: 5000,        // Prime de base ajoutée à chaque gain
      jackpotBonus: 250000    // Prime supplémentaire en cas de gros gain / jackpot
    }
  },

  langs: {
    en: {
      invalidBet: "❌ Invalid bet amount! Enter a number between ${min} and ${max}.",
      betTooLow: "❌ Minimum bet is $${min}!",
      betTooHigh: "❌ Maximum bet limit is $${max}!",
      notEnoughMoney: "❌ You don't have enough money!\n💰 Your balance: $${balance}\n💸 Bet amount: $${bet}",
      processing: "🎰 Spinning hexagonal slots... Please wait!"
    }
  },

  ST: async function({ message, args, event, usersData, getLang, envCommands, commandName, api }) {
    const { senderID, threadID } = event;
    const cfg = envCommands?.[commandName] || this.config.envConfig;

    const defaultBet = cfg.defaultBet ?? 10000;
    const minBet = cfg.minBet ?? 100;
    const maxBet = cfg.maxBet ?? 100000000;
    const pairMultiplier = cfg.pairMultiplier ?? 3;
    const baseBonus = cfg.baseBonus ?? 5000;
    const jackpotBonus = cfg.jackpotBonus ?? 250000;

    // Utilise la mise par défaut si aucun argument n'est donné
    let betAmount = defaultBet;
    if (args[0]) {
      betAmount = parseInt(args[0].replace(/[,_$]/g, ''), 10);
      if (isNaN(betAmount)) {
        return message.reply(getLang("invalidBet")
          .replace("${min}", minBet.toLocaleString("en-US"))
          .replace("${max}", maxBet.toLocaleString("en-US")));
      }
    }

    if (betAmount < minBet) {
      return message.reply(getLang("betTooLow").replace("${min}", minBet.toLocaleString("en-US")));
    }

    if (betAmount > maxBet) {
      return message.reply(getLang("betTooHigh").replace("${max}", maxBet.toLocaleString("en-US")));
    }

    const userData = await usersData.get(senderID);
    const userName = userData.name || "Player";
    const userMoney = userData.money || 0;

    if (userMoney < betAmount) {
      return message.reply(getLang("notEnoughMoney")
        .replace("${balance}", userMoney.toLocaleString("en-US"))
        .replace("${bet}", betAmount.toLocaleString("en-US")));
    }

    await message.reply(getLang("processing"));

    // Récompenses (payout) augmentées
    const symbols = {
      'SEVEN':   { emoji: '7️⃣', color: '#FF0000', payout: 500 },
      'DIAMOND': { emoji: '💎', color: '#00D4FF', payout: 250 },
      'BELL':    { emoji: '🔔', color: '#FFD700', payout: 120 },
      'STAR':    { emoji: '⭐', color: '#FFA500', payout: 75 },
      'MELON':   { emoji: '🍉', color: '#2ECC71', payout: 50 },
      'ORANGE':  { emoji: '🍊', color: '#FF8C42', payout: 35 },
      'GRAPE':   { emoji: '🍇', color: '#9B59B6', payout: 25 },
      'LEMON':   { emoji: '🍋', color: '#FFD93D', payout: 18 },
      'CHERRY':  { emoji: '🍒', color: '#FF6B6B', payout: 12 }
    };

    const symbolKeys = Object.keys(symbols);

    const result = [];
    for (let i = 0; i < 3; i++) {
      result.push(symbolKeys[Math.floor(Math.random() * symbolKeys.length)]);
    }

    let winMultiplier = 0;
    let bonusAmount = 0;
    let winMessage = '';

    if (result[0] === result[1] && result[1] === result[2]) {
      winMultiplier = symbols[result[0]].payout;
      winMessage = `${symbols[result[0]].emoji}${symbols[result[1]].emoji}${symbols[result[2]].emoji}`;
      bonusAmount = baseBonus + (winMultiplier >= 100 ? jackpotBonus : Math.floor(baseBonus * 2));
    } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
      winMultiplier = pairMultiplier;
      bonusAmount = baseBonus;
    }

    const winAmount = winMultiplier > 0 ? (betAmount * winMultiplier) + bonusAmount : 0;
    const newBalance = userMoney - betAmount + winAmount;

    const tempDir = path.join(__dirname, 'temp');
    await fs.ensureDir(tempDir);
    const gifPath = path.join(tempDir, `hexslot_${senderID}_${Date.now()}.gif`);

    const width = 1100;
    const height = 1200;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    function drawHexagon(x, y, size, fillGradient, strokeColor, lineWidth, glow = false, glowColor = '#FFD700') {
      if (glow) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 30;
      }

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const hx = x + size * Math.cos(angle);
        const hy = y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();

      if (fillGradient) {
        ctx.fillStyle = fillGradient;
        ctx.fill();
      }

      if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
    }

    const encoder = new GIFEncoder(width, height);
    const stream = encoder.createReadStream().pipe(fs.createWriteStream(gifPath));

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);

      encoder.start();
      encoder.setRepeat(0);
      encoder.setDelay(80);
      encoder.setQuality(15);

      const totalFrames = 50;
      const spinFrames = 38;

      const slotPositions = [
        { x: width / 2 - 220, y: 450 },
        { x: width / 2, y: 450 },
        { x: width / 2 + 220, y: 450 }
      ];

      for (let frame = 0; frame < totalFrames; frame++) {
        const bgTime = frame * 0.02;
        const bgGradient = ctx.createLinearGradient(0, 0, width, height);
        bgGradient.addColorStop(0, `hsl(${(bgTime * 50) % 360}, 40%, 10%)`);
        bgGradient.addColorStop(0.5, `hsl(${(bgTime * 50 + 60) % 360}, 50%, 15%)`);
        bgGradient.addColorStop(1, `hsl(${(bgTime * 50 + 120) % 360}, 40%, 10%)`);
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < 20; i++) {
          const starX = (width / 20) * i + (frame * 2) % (width / 20);
          const starY = (i * 73) % height;
          const starSize = 2 + (i % 3);
          const starOpacity = 0.3 + Math.sin(frame * 0.1 + i) * 0.2;

          ctx.fillStyle = `rgba(255, 255, 255, ${starOpacity})`;
          ctx.beginPath();
          ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
          ctx.fill();
        }

        const headerGradient = ctx.createLinearGradient(0, 0, width, 180);
        headerGradient.addColorStop(0, '#6a11cb');
        headerGradient.addColorStop(0.5, '#2575fc');
        headerGradient.addColorStop(1, '#ff6a00');
        ctx.fillStyle = headerGradient;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 25;
        ctx.fillRect(0, 0, width, 180);
        ctx.shadowBlur = 0;

        const titlePulse = 1 + Math.sin(frame * 0.15) * 0.03;
        ctx.save();
        ctx.translate(width / 2, 70);
        ctx.scale(titlePulse, titlePulse);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 15;
        ctx.fillText('🎰 SLOT MACHINE 🎰', 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Player: ${userName}`, width / 2, 140);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(`Bet: $${betAmount.toLocaleString("en-US")}`, width / 2, 240);

        for (let i = 0; i < 3; i++) {
          const pos = slotPositions[i];
          const stopFrame = spinFrames - (i * 8);

          let displaySymbol;
          if (frame < stopFrame) {
            const spinSpeed = Math.floor(frame * 3) % symbolKeys.length;
            displaySymbol = symbolKeys[spinSpeed];
          } else {
            displaySymbol = result[i];
          }

          const hexSize = 130;
          let scale = 1;
          let rotation = 0;

          if (frame < stopFrame) {
            scale = 0.92 + Math.sin(frame * 0.8) * 0.08;
            rotation = (frame * 0.3) % (Math.PI * 2);
          } else if (frame >= stopFrame && frame < stopFrame + 8) {
            const bounceProgress = (frame - stopFrame) / 8;
            scale = 1 + Math.sin(bounceProgress * Math.PI) * 0.25;
          } else {
            scale = 1;
          }

          ctx.save();
          ctx.translate(pos.x, pos.y);
          ctx.rotate(rotation);
          ctx.scale(scale, scale);

          const hexGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, hexSize);
          hexGradient.addColorStop(0, symbols[displaySymbol].color + 'CC');
          hexGradient.addColorStop(0.5, symbols[displaySymbol].color + '66');
          hexGradient.addColorStop(1, symbols[displaySymbol].color + '22');

          const isLocked = frame >= stopFrame;
          drawHexagon(0, 0, hexSize, hexGradient,
            isLocked ? '#FFD700' : '#4a5568',
            isLocked ? 8 : 5,
            isLocked,
            symbols[displaySymbol].color);

          ctx.font = 'bold 100px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = symbols[displaySymbol].color;
          ctx.shadowBlur = isLocked ? 25 : 10;
          ctx.fillText(symbols[displaySymbol].emoji, 0, 0);
          ctx.shadowBlur = 0;

          if (isLocked) {
            ctx.font = 'bold 22px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.fillText(displaySymbol, 0, hexSize + 35);
          }

          ctx.restore();
        }

        if (frame >= spinFrames + 5) {
          const resultY = 700;

          if (winMultiplier > 0) {
            if (winMultiplier >= 100) {
              const megaPulse = 1 + Math.sin((frame - spinFrames) * 0.4) * 0.15;

              for (let i = 0; i < 10; i++) {
                const angle = (i / 10) * Math.PI * 2 + frame * 0.2;
                const radius = 200 + Math.sin(frame * 0.3 + i) * 30;
                const starX = width / 2 + Math.cos(angle) * radius;
                const starY = resultY + Math.sin(angle) * radius;

                ctx.fillStyle = `rgba(255, 215, 0, ${0.6 + Math.sin(frame * 0.5 + i) * 0.4})`;
                ctx.font = 'bold 40px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('⭐', starX, starY);
              }

              ctx.save();
              ctx.translate(width / 2, resultY - 50);
              ctx.scale(megaPulse, megaPulse);

              const jackpotGradient = ctx.createLinearGradient(-200, 0, 200, 0);
              jackpotGradient.addColorStop(0, '#FFD700');
              jackpotGradient.addColorStop(0.5, '#FFA500');
              jackpotGradient.addColorStop(1, '#FFD700');
              ctx.fillStyle = jackpotGradient;
              ctx.font = 'bold 80px Arial';
              ctx.textAlign = 'center';
              ctx.shadowColor = '#FFD700';
              ctx.shadowBlur = 40;
              ctx.fillText('💎 JACKPOT 💎', 0, 0);
              ctx.shadowBlur = 0;
              ctx.restore();

              ctx.fillStyle = '#FFFFFF';
              ctx.font = 'bold 52px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(winMessage, width / 2, resultY + 25);

              ctx.fillStyle = '#FFD700';
              ctx.font = 'bold 58px Arial';
              ctx.fillText(`WIN: $${winAmount.toLocaleString("en-US")}`, width / 2, resultY + 95);

              ctx.fillStyle = '#00FFAA';
              ctx.font = 'bold 34px Arial';
              ctx.fillText(`🎁 Bonus: +$${bonusAmount.toLocaleString("en-US")}`, width / 2, resultY + 145);
            } else {
              ctx.fillStyle = '#2ECC71';
              ctx.font = 'bold 52px Arial';
              ctx.textAlign = 'center';
              ctx.shadowColor = '#2ECC71';
              ctx.shadowBlur = 20;
              ctx.fillText('🎉 WINNER! 🎉', width / 2, resultY);
              ctx.shadowBlur = 0;

              if (winMessage) {
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 50px Arial';
                ctx.fillText(winMessage, width / 2, resultY + 55);
              }

              ctx.fillStyle = '#FFD700';
              ctx.font = 'bold 54px Arial';
              ctx.fillText(`WIN: $${winAmount.toLocaleString("en-US")}`, width / 2, resultY + 120);

              ctx.fillStyle = '#00FFAA';
              ctx.font = 'bold 32px Arial';
              ctx.fillText(`🎁 Bonus: +$${bonusAmount.toLocaleString("en-US")}`, width / 2, resultY + 168);
            }

            ctx.fillStyle = '#4ecca3';
            ctx.font = 'bold 42px Arial';
            ctx.fillText(`Balance: $${newBalance.toLocaleString("en-US")}`, width / 2, resultY + 225);
          } else {
            ctx.fillStyle = '#E74C3C';
            ctx.font = 'bold 56px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#E74C3C';
            ctx.shadowBlur = 20;
            ctx.fillText('😢 NO WIN', width / 2, resultY);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#95a5a6';
            ctx.font = 'bold 44px Arial';
            ctx.fillText(`Balance: $${newBalance.toLocaleString("en-US")}`, width / 2, resultY + 80);
          }

          ctx.fillStyle = '#ecf0f1';
          ctx.font = 'bold 36px Arial';
          ctx.fillText('Good Luck Next Time!', width / 2, height - 80);
        }

        encoder.addFrame(ctx);
      }

      encoder.finish();
    });

    await usersData.set(senderID, {
      money: newBalance,
      data: userData.data
    });

    api.sendMessage({
      attachment: fs.createReadStream(gifPath)
    }, threadID, () => fs.unlinkSync(gifPath));
  }
};
    
