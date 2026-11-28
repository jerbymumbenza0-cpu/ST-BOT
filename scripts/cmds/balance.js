const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "bal",
    aliases: ["balance", "solde"],
    version: "1.0.0",
    author: "PEDRI",
    countDown: 5,
    role: 0,
    shortDescription: "Consulter et gérer son solde",
    longDescription: "Solde, transferts, récompenses et classement",
    category: "economy",
    guide: "{pn} | {pn} @mention | {pn} give @mention montant | {pn} daily | {pn} top"
  },

  onStart: async function ({ message, args, event, usersData }) {
    const senderID = event.senderID;
    const prefix = event.prefix || "";
    const subCommand = (args[0] || "").toLowerCase();

    const getMoney = async (uid) => {
      const user = await usersData.get(uid);
      return Number(user.money || 0);
    };

    const setMoney = async (uid, amount) => {
      await usersData.set(uid, amount, "money");
    };

    const getStats = async (uid) => {
      const user = await usersData.get(uid);
      return user.balStats || { daily: 0, sent: 0, received: 0 };
    };

    const setStats = async (uid, stats) => {
      await usersData.set(uid, stats, "balStats");
    };

    const formatMoney = (amount) =>
      Math.floor(amount).toLocaleString("fr-FR");

    // TRANSFERT
    if (subCommand === "give") {
      let targetID = null;
      let amount = 0;

      if (event.messageReply) {
        targetID = event.messageReply.senderID;
        amount = Number(args[1]);
      } else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
        amount = Number(args[args.length - 1]);
      } else {
        targetID = args[1];
        amount = Number(args[2]);
      }

      if (!targetID || !Number.isFinite(amount) || amount <= 0) {
        return message.reply(
          `Utilisation :\n${prefix}bal give @mention montant\n${prefix}bal give UID montant\nOu réponds au message avec : ${prefix}bal give montant`
        );
      }

      if (targetID === senderID)
        return message.reply("Tu ne peux pas t'envoyer de l'argent.");

      const senderMoney = await getMoney(senderID);

      if (senderMoney < amount)
        return message.reply("Tu n'as pas assez d'argent.");

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
        `Montant envoyé : ${formatMoney(amount)} pièces\n` +
        `Taxe (2 %) : ${formatMoney(tax)} pièces\n` +
        `Montant reçu : ${formatMoney(received)} pièces`
      );
    }

    // RÉCOMPENSE QUOTIDIENNE
    if (subCommand === "daily") {
      const stats = await getStats(senderID);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      if (stats.daily && now - stats.daily < oneDay) {
        const remaining = oneDay - (now - stats.daily);
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);

        return message.reply(
          `Tu as déjà récupéré ta récompense.\nReviens dans ${hours}h ${minutes}min.`
        );
      }

      const reward = 500;
      const money = await getMoney(senderID);

      await setMoney(senderID, money + reward);
      stats.daily = now;
      await setStats(senderID, stats);

      return message.reply(
        `🎁 Récompense quotidienne !\nTu as reçu ${formatMoney(reward)} pièces.`
      );
    }

    // CLASSEMENT
    if (subCommand === "top") {
      const allUsers = await usersData.getAll();

      const ranking = allUsers
        .map(user => ({
          id: user.userID,
          money: Number(user.money || 0)
        }))
        .sort((a, b) => b.money - a.money)
        .slice(0, 10);

      let text = "🏆 CLASSEMENT DES PLUS RICHES\n\n";

      ranking.forEach((user, index) => {
        text += `${index + 1}. UID ${user.id} — ${formatMoney(user.money)} pièces\n`;
      });

      return message.reply(text);
    }

    // STATISTIQUES
    if (subCommand === "stats") {
      const stats = await getStats(senderID);

      return message.reply(
        `📊 TES STATISTIQUES\n\n` +
        `Total envoyé : ${formatMoney(stats.sent)} pièces\n` +
        `Total reçu : ${formatMoney(stats.received)} pièces`
      );
    }

    // CONSULTATION DU SOLDE
    let targetID = senderID;

    if (event.messageReply) {
      targetID = event.messageReply.senderID;
    } else if (event.mentions && Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } else if (args[0] && /^\d+$/.test(args[0])) {
      targetID = args[0];
    }

    const money = await getMoney(targetID);

    return message.reply(
      `💎 CARTE DE SOLDE\n\n` +
      `👤 Utilisateur : ${targetID}\n` +
      `💰 Solde : ${formatMoney(money)} pièces`
    );
  }
};
