
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "bal",
    aliases: ["balance", "solde"],
    version: "3.0.0",
    author: "PEDRI",
    countDown: 5,
    role: 0,
    shortDescription: "Profil bancaire graphique",
    longDescription: "Solde, banque, rang, transferts et récompenses",
    category: "economy",
    guide: "{pn} | {pn} @mention | {pn} give @mention montant | {pn} daily | {pn} top | {pn} stats"
  },

  onStart: async function ({ message, args, event, usersData, api }) {
    const senderID = event.senderID;
    const prefix = event.prefix || "!";
    const subCommand = (args[0] || "").toLowerCase();

    // DONNÉES UTILISATEUR
    const getUser = async (uid) => {
      return await usersData.get(uid);
    };

    const getMoney = async (uid) => {
      const user = await getUser(uid);
      return Number(user?.money || 0);
    };

    const setMoney = async (uid, amount) => {
      await usersData.set(uid, amount, "money");
    };

    const getStats = async (uid) => {
      const user = await getUser(uid);
      const stats = user?.balStats || {};

      return {
        daily: Number(stats.daily || 0),
        sent: Number(stats.sent || 0),
        received: Number(stats.received || 0)
      };
    };

    const setStats = async (uid, stats) => {
      await usersData.set(uid, stats, "balStats");
    };

    const formatMoney = (amount) =>
      Math.floor(Number(amount) || 0).toLocaleString("fr-FR");

    // PROFIL FACEBOOK
    const getFacebookInfo = async (uid) => {
      try {
        const info = await api.getUserInfo(uid);
        return info[uid] || info;
      } catch (error) {
        console.log("Erreur profil Facebook :", error);
        return {};
      }
    };

    // CALCUL DU CLASSEMENT
    const getRanking = async () => {
      const allUsers = await usersData.getAll();

      const ranking = allUsers
        .map(user => {
          const bankData = user.pedroBank || {};

          const money = Number(user.money || 0);
          const bank = Number(bankData.bank || 0);

          return {
            id: user.userID,
            money,
            bank,
            total: money + bank
          };
        })
        .sort((a, b) => b.total - a.total);

      return ranking;
    };

    // ==========================================
    // TRANSFERT
    // ==========================================
    if (subCommand === "give") {
      let targetID = null;
      let amount = 0;

      if (event.messageReply) {
        targetID = event.messageReply.senderID;
        amount = Number(args[1]);
      } else if (
        event.mentions &&
        Object.keys(event.mentions).length > 0
      ) {
        targetID = Object.keys(event.mentions)[0];
        amount = Number(args[args.length - 1]);
      } else {
        targetID = args[1];
        amount = Number(args[2]);
      }

      if (!targetID || !Number.isFinite(amount) || amount <= 0) {
        return message.reply(
          `UTILISATION :\n${prefix}bal give @mention montant\n${prefix}bal give UID montant\nRépondre à un message : ${prefix}bal give montant`
        );
      }

      if (targetID === senderID) {
        return message.reply("Tu ne peux pas t'envoyer de l'argent.");
      }

      const senderMoney = await getMoney(senderID);

      if (senderMoney < amount) {
        return message.reply("Tu n'as pas assez d'argent.");
      }

      const tax = Math.floor(amount * 0.02);
      const received = amount - tax;
      const targetMoney = await getMoney(targetID);

      await setMoney(senderID, senderMoney - amount);
      await setMoney(targetID, targetMoney + received);

      const senderStats = await getStats(senderID);
      const targetStats = await getStats(targetID);

      senderStats.sent += amount;
      targetStats.received += received;

      await setStats(senderID, senderStats);
      await setStats(targetID, targetStats);

      return message.reply(
        `💸 TRANSFERT EFFECTUÉ !\n\n` +
        `👤 Destinataire : ${targetID}\n` +
        `💰 Envoyé : ${formatMoney(amount)} pièces\n` +
        `📉 Taxe (2 %) : ${formatMoney(tax)} pièces\n` +
        `💎 Reçu : ${formatMoney(received)} pièces`
      );
    }

    // ==========================================
    // RÉCOMPENSE DAILY
    // ==========================================
    if (subCommand === "daily") {
      const stats = await getStats(senderID);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      if (stats.daily && now - stats.daily < oneDay) {
        const remaining = oneDay - (now - stats.daily);
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor(
          (remaining % 3600000) / 60000
        );

        return message.reply(
          `🎁 Tu as déjà reçu ta récompense !\nReviens dans ${hours}h ${minutes}min.`
        );
      }

      const reward = 500;
      const money = await getMoney(senderID);

      await setMoney(senderID, money + reward);

      stats.daily = now;
      await setStats(senderID, stats);

      return message.reply(
        `🎁 RÉCOMPENSE QUOTIDIENNE !\n\n` +
        `Tu as reçu ${formatMoney(reward)} pièces.\n` +
        `💰 Nouveau solde : ${formatMoney(money + reward)} pièces.`
      );
    }

    // ==========================================
    // CLASSEMENT TOP
    // ==========================================
    if (subCommand === "top") {
      const ranking = await getRanking();
      let text = "🏆 ROYAL GOLD - TOP 10\n\n";

      for (let i = 0; i < Math.min(10, ranking.length); i++) {
        const user = ranking[i];
        const info = await getFacebookInfo(user.id);
        const name = info.name || user.id;

        text +=
          `${i + 1}. ${name}\n` +
          `💰 Argent : ${formatMoney(user.money)}\n` +
          `🏦 Banque : ${formatMoney(user.bank)}\n` +
          `💎 Fortune : ${formatMoney(user.total)} pièces\n\n`;
      }

      return message.reply(text);
    }

    // ==========================================
    // STATISTIQUES
    // ==========================================
    if (subCommand === "stats") {
      const stats = await getStats(senderID);

      return message.reply(
        `📊 TES STATISTIQUES\n\n` +
        `💸 Total envoyé : ${formatMoney(stats.sent)} pièces\n` +
        `💰 Total reçu : ${formatMoney(stats.received)} pièces`
      );
    }

    // ==========================================
    // IDENTIFICATION DU JOUEUR
    // ==========================================
    let targetID = senderID;

    if (event.messageReply) {
      targetID = event.messageReply.senderID;
    } else if (
      event.mentions &&
      Object.keys(event.mentions).length > 0
    ) {
      targetID = Object.keys(event.mentions)[0];
    } else if (args[0] && /^\d+$/.test(args[0])) {
      targetID = args[0];
    }

    const user = await getUser(targetID);

    const money = Number(user?.money || 0);

    // SOLDE DU COMPTE PEDRO BANK
    const bank = Number(user?.pedroBank?.bank || 0);

    const total = money + bank;

    const fbUser = await getFacebookInfo(targetID);

    const name =
      fbUser.name ||
      user?.name ||
      "Utilisateur";

    const avatarUrl =
      fbUser.thumbSrc ||
      fbUser.profilePicUrl ||
      fbUser.profileUrl ||
      null;

    // RANG DU JOUEUR
    const ranking = await getRanking();
    const rankIndex = ranking.findIndex(
      item => String(item.id) === String(targetID)
    );

    const rank = rankIndex === -1 ? "N/A" : rankIndex + 1;
    const totalPlayers = ranking.length;

    // ==========================================
    // CRÉATION DE LA CARTE
    // ==========================================
    const canvas = createCanvas(1100, 750);
    const ctx = canvas.getContext("2d");

    // FOND
    const bg = ctx.createLinearGradient(0, 0, 1100, 750);
    bg.addColorStop(0, "#08090c");
    bg.addColorStop(0.5, "#211a0d");
    bg.addColorStop(1, "#050505");

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1100, 750);

    // BORDURE
    ctx.strokeStyle = "#d6aa38";
    ctx.lineWidth = 5;
    ctx.strokeRect(15, 15, 1070, 720);

    // EN-TÊTE
    ctx.textAlign = "center";
    ctx.fillStyle = "#f3d477";
    ctx.font = "bold 45px Arial";
    ctx.fillText("ROYAL GOLD BANK", 550, 75);

    ctx.fillStyle = "#b9a36c";
    ctx.font = "22px Arial";
    ctx.fillText("PLAYER FINANCIAL PROFILE", 550, 112);

    ctx.fillStyle = "#d6aa38";
    ctx.fillRect(65, 140, 970, 2);

    // PHOTO DE PROFIL
    if (avatarUrl) {
      try {
        const avatar = await loadImage(avatarUrl);

        ctx.save();
        ctx.beginPath();
        ctx.arc(550, 250, 85, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(avatar, 465, 165, 170, 170);
        ctx.restore();

        ctx.strokeStyle = "#edc75c";
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(550, 250, 88, 0, Math.PI * 2);
        ctx.stroke();
      } catch (error) {
        console.log("Photo indisponible :", error);
      }
    }

    // NOM
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 37px Arial";
    ctx.fillText(name, 550, 385, 900);

    // ID
    ctx.fillStyle = "#999999";
    ctx.font = "19px Arial";
    ctx.fillText(`ID : ${targetID}`, 550, 420);

    // CARTES DES SOLDES
    const drawCard = (x, y, width, height, title, value) => {
      ctx.fillStyle = "#201b10";
      ctx.fillRect(x, y, width, height);

      ctx.strokeStyle = "#a98942";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      ctx.textAlign = "center";

      ctx.fillStyle = "#d8b95f";
      ctx.font = "bold 23px Arial";
      ctx.fillText(title, x + width / 2, y + 43);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 29px Arial";
      ctx.fillText(
        formatMoney(value) + " pièces",
        x + width / 2,
        y + 100,
        width - 25
      );
    };

    drawCard(65, 465, 465, 125, "💰 SOLDE NORMAL", money);
    drawCard(570, 465, 465, 125, "🏦 SOLDE BANCAIRE", bank);

    // FORTUNE TOTALE
    ctx.fillStyle = "#d6aa38";
    ctx.fillRect(65, 615, 970, 2);

    ctx.fillStyle = "#d8b95f";
    ctx.font = "bold 23px Arial";
    ctx.fillText("💎 FORTUNE TOTALE", 550, 655);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px Arial";
    ctx.fillText(
      `${formatMoney(total)} PIÈCES`,
      550,
      700,
      900
    );

    // RANG DU JOUEUR
    ctx.textAlign = "center";

    ctx.fillStyle = "#e8c66d";
    ctx.font = "bold 24px Arial";
    ctx.fillText(
      `🏆 RANG TOP : #${rank}`,
      550,
      445
    );

    ctx.fillStyle = "#a99b78";
    ctx.font = "16px Arial";
    ctx.fillText(
      `${totalPlayers} joueurs classés`,
      550,
      465
    );

    // ==========================================
    // ENVOI DIRECT DE L'IMAGE
    // ==========================================
    const buffer = canvas.toBuffer("image/png");

    const imagePath = path.join(
      __dirname,
      `balance_${targetID}_${Date.now()}.png`
    );

    try {
      fs.writeFileSync(imagePath, buffer);

      return await message.reply({
        body: `💎 ROYAL GOLD BANK - ${name}`,
        attachment: fs.createReadStream(imagePath)
      });
    } catch (error) {
      console.log("Erreur envoi image :", error);

      return message.reply(
        "❌ Impossible d'envoyer la carte bancaire."
      );
    } finally {
      setTimeout(() => {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }, 30000);
    }
  }
};
    
