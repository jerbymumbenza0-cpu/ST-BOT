
const { createCanvas } = require("canvas");

const TITLE = "👑 PEDRO BANK — ELITE FINANCE";
const DAY = 24 * 60 * 60 * 1000;

const STOCKS = {
  PED: { price: 500, name: "Pedro Corporation" },
  APP: { price: 350, name: "Apple" },
  BTC: { price: 1200, name: "Bitcoin Stock" },
  GOL: { price: 200, name: "Gold Industries" },
  TEC: { price: 150, name: "Tech Global" }
};

const CRYPTOS = {
  bitcoin: { price: 1200, symbol: "BTC" },
  ethereum: { price: 800, symbol: "ETH" },
  solana: { price: 450, symbol: "SOL" },
  dogecoin: { price: 100, symbol: "DOGE" }
};

const money = n =>
  "$" + Math.floor(Number(n) || 0).toLocaleString("en-US");

const validAmount = value => {
  if (!/^\d+$/.test(String(value || ""))) return 0;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : 0;
};

function initBank(user) {
  const b = user.pedroBank || {};

  b.bank = Number(b.bank) || 0;
  b.card = Number(b.card) || 0;
  b.cardNumber = b.cardNumber || null;
  b.stocks = b.stocks || {};
  b.crypto = b.crypto || {};
  b.history = b.history || [];
  b.tickets = b.tickets || [];
  b.lastInterest = Number(b.lastInterest) || 0;
  b.lastDaily = Number(b.lastDaily) || 0;

  return b;
}

function record(bank, type, amount, details = "") {
  bank.history.unshift({
    type,
    amount,
    details,
    date: new Date().toLocaleString("fr-FR")
  });

  bank.history = bank.history.slice(0, 30);
}

function investments(bank) {
  let total = 0;

  for (const [k, v] of Object.entries(bank.stocks)) {
    total += (STOCKS[k]?.price || 0) * Number(v || 0);
  }

  for (const [k, v] of Object.entries(bank.crypto)) {
    total += (CRYPTOS[k]?.price || 0) * Number(v || 0);
  }

  return total;
}

function drawRound(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

async function createTopImage(ranking, page) {
  const canvas = createCanvas(1200, 1450);
  const ctx = canvas.getContext("2d");

  const gold = "#EAC56B";
  const light = "#FFF0BF";

  const start = (page - 1) * 10;
  const entries = ranking.slice(start, start + 10);

  const background = ctx.createLinearGradient(0, 0, 1200, 1450);
  background.addColorStop(0, "#100D08");
  background.addColorStop(0.5, "#211806");
  background.addColorStop(1, "#090806");

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1200, 1450);

  ctx.strokeStyle = gold;
  ctx.lineWidth = 9;
  ctx.strokeRect(20, 20, 1160, 1410);

  ctx.textAlign = "center";

  ctx.fillStyle = gold;
  ctx.font = "bold 65px Arial";
  ctx.fillText("ROYAL BANK RANKING", 600, 115);

  ctx.fillStyle = "#C7B58A";
  ctx.font = "28px Arial";
  ctx.fillText("PEDRO BANK • ELITE FINANCE", 600, 165);

  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(75, 205);
  ctx.lineTo(1125, 205);
  ctx.stroke();

  ctx.fillStyle = light;
  ctx.font = "bold 42px Arial";
  ctx.fillText("🏆 TOP 50 DES PLUS RICHES", 600, 275);

  ctx.fillStyle = "#BBA675";
  ctx.font = "25px Arial";
  ctx.fillText(
    `PAGE ${page}/5 • POSITIONS ${start + 1} À ${Math.min(start + 10, 50)}`,
    600,
    320
  );

  const podium = entries.slice(0, 3);
  const positions = [
    { x: 75, y: 375, w: 320, h: 220, medal: "🥇" },
    { x: 440, y: 395, w: 320, h: 200, medal: "🥈" },
    { x: 805, y: 415, w: 320, h: 180, medal: "🥉" }
  ];

  positions.forEach((p, i) => {
    const item = podium[i];
    if (!item) return;

    drawRound(ctx, p.x, p.y, p.w, p.h, 18, "#302412");

    ctx.strokeStyle = gold;
    ctx.lineWidth = 3;
    ctx.strokeRect(p.x, p.y, p.w, p.h);

    ctx.fillStyle = gold;
    ctx.font = "bold 35px Arial";
    ctx.fillText(p.medal, p.x + p.w / 2, p.y + 48);

    ctx.fillStyle = light;
    ctx.font = "bold 27px Arial";
    ctx.fillText(
      item.name.slice(0, 18),
      p.x + p.w / 2,
      p.y + 105
    );

    ctx.fillStyle = "#E6C879";
    ctx.font = "bold 23px Arial";
    ctx.fillText(
      money(item.total),
      p.x + p.w / 2,
      p.y + 155
    );
  });

  let y = 650;

  entries.forEach((item, i) => {
    const rank = start + i + 1;

    drawRound(
      ctx,
      75,
      y,
      1050,
      65,
      12,
      i % 2 === 0 ? "#302617" : "#201A10"
    );

    ctx.textAlign = "left";
    ctx.fillStyle = gold;
    ctx.font = "bold 25px Arial";
    ctx.fillText(`#${rank}`, 100, y + 42);

    ctx.fillStyle = "#F7EBD0";
    ctx.font = "25px Arial";
    ctx.fillText(item.name.slice(0, 23), 210, y + 42);

    ctx.textAlign = "right";
    ctx.fillStyle = light;
    ctx.font = "bold 24px Arial";
    ctx.fillText(money(item.total), 1090, y + 42);

    y += 73;
  });

  ctx.textAlign = "center";

  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(75, 1370);
  ctx.lineTo(1125, 1370);
  ctx.stroke();

  ctx.fillStyle = gold;
  ctx.font = "24px Arial";
  ctx.fillText("💎 PEDRO BANK • ELITE FINANCE", 600, 1410);

  return canvas.toBuffer("image/png");
}

module.exports = {
  config: {
    name: "bank",
    aliases: ["pedrobank", "pb"],
    version: "4.0",
    author: "PEDRI",
    countDown: 2,
    role: 0,
    shortDescription: "Pedro Bank Elite Finance",
    longDescription: "Banque virtuelle avec carte, investissements et classement illustré",
    category: "economy",
    guide: "{pn} help"
  },

  onStart: async function ({ message, args, event, usersData }) {
    const uid = event.senderID;
    const command = (args[0] || "balance").toLowerCase();

    try {
      const user = await usersData.get(uid);

      user.money = Math.max(0, Number(user.money) || 0);

      const bank = initBank(user);
      const wallet = user.money;

      const save = async () => {
        await usersData.set(uid, user.money, "money");
        await usersData.set(uid, bank, "pedroBank");
      };

      const reply = text => message.reply(
        `${TITLE}\n━━━━━━━━━━━━━━━━━━\n${text}\n━━━━━━━━━━━━━━━━━━\n💎 PEDRO BANK • ELITE FINANCE`
      );

      const insufficient = (where, amount) =>
        reply(`❌ Fonds insuffisants !\nSolde ${where} : ${money(amount)}`);

      const clientName =
        user.name ||
        user.userName ||
        user.firstName ||
        "Client Pedro";

      switch (command) {

        case "help":
        case "menu":
          return reply(`
👑 BIENVENUE CHEZ PEDRO BANK

💰 COMPTE
• bank balance
• bank deposit <montant>
• bank withdraw <montant>
• bank daily
• bank interest

💳 CARTE
• bank card create
• bank card balance
• bank card deposit <montant>
• bank card withdraw <montant>

📈 BOURSE
• bank stocks list
• bank stocks buy <symbole> <quantité>
• bank stocks sell <symbole> <quantité>

₿ CRYPTOS
• bank crypto list
• bank crypto buy <nom> <quantité>
• bank crypto sell <nom> <quantité>

🎰 LOTERIE
• bank lottery info
• bank lottery buy <numéro>

🏆 CLASSEMENT
• bank top
• bank top 1
• bank top 2
• bank top 3
• bank top 4
• bank top 5

📜 AUTRES
• bank history
`);

        case "balance":
        case "bal": {
          const invest = investments(bank);
          const total = wallet + bank.bank + bank.card + invest;

          return reply(`
👑 PROFIL CLIENT

👤 Nom : ${clientName}
🆔 Identifiant : ${uid}

💵 PORTEFEUILLE
${money(wallet)}

🏦 COMPTE BANCAIRE
${money(bank.bank)}

💳 CARTE BANCAIRE
${money(bank.card)}

📊 INVESTISSEMENTS
${money(invest)}

━━━━━━━━━━━━━━━━━━

💎 PATRIMOINE TOTAL
${money(total)}

💳 Carte : ${bank.cardNumber ? "ACTIVE" : "NON CRÉÉE"}
`);
        }

        case "daily": {
          const now = Date.now();
          const remaining = DAY - (now - bank.lastDaily);

          if (bank.lastDaily && remaining > 0) {
            const hours = Math.floor(remaining / 3600000);
            const minutes = Math.floor((remaining % 3600000) / 60000);

            return reply(
              `⏳ RÉCOMPENSE DÉJÀ RÉCUPÉRÉE !\n\nReviens dans ${hours}h ${minutes}min.`
            );
          }

          const reward = 500;

          if (wallet + reward > Number.MAX_SAFE_INTEGER)
            return reply("❌ Limite du portefeuille atteinte.");

          user.money += reward;
          bank.lastDaily = now;

          record(bank, "Récompense quotidienne", reward);

          await save();

          return reply(`
🎁 RÉCOMPENSE QUOTIDIENNE !

Tu as reçu ${money(reward)}.

💰 Nouveau portefeuille :
${money(user.money)}

🏦 Banque :
${money(bank.bank)}
`);
        }

        case "deposit":
        case "dep": {
          const amount = validAmount(args[1]);

          if (!amount) return reply("❌ Montant invalide.");
          if (wallet < amount) return insufficient("du portefeuille", wallet);

          user.money -= amount;
          bank.bank += amount;

          record(bank, "Dépôt bancaire", amount);

          await save();

          return reply(`
✅ DÉPÔT EFFECTUÉ !

Montant : ${money(amount)}
Portefeuille : ${money(user.money)}
Banque : ${money(bank.bank)}
`);
        }

        case "withdraw":
        case "wd": {
          const amount = validAmount(args[1]);

          if (!amount) return reply("❌ Montant invalide.");
          if (bank.bank < amount) return insufficient("bancaire", bank.bank);

          if (user.money + amount > Number.MAX_SAFE_INTEGER)
            return reply("❌ Limite du portefeuille atteinte.");

          bank.bank -= amount;
          user.money += amount;

          record(bank, "Retrait bancaire", amount);

          await save();

          return reply(`
✅ RETRAIT EFFECTUÉ !

Montant : ${money(amount)}
Portefeuille : ${money(user.money)}
Banque : ${money(bank.bank)}
`);
        }

        case "interest": {
          if (bank.bank <= 0)
            return reply("❌ Dépose de l'argent en banque pour recevoir des intérêts.");

          const remaining = DAY - (Date.now() - bank.lastInterest);

          if (bank.lastInterest && remaining > 0) {
            return reply(
              `⏳ Reviens dans ${Math.ceil(remaining / 3600000)} heure(s).`
            );
          }

          const interest = Math.floor(bank.bank * 0.01);

          if (interest <= 0)
            return reply("❌ Solde bancaire trop faible.");

          bank.bank += interest;
          bank.lastInterest = Date.now();

          record(bank, "Intérêts bancaires", interest);

          await save();

          return reply(`
💎 INTÉRÊTS CRÉDITÉS !

Taux : 1 %
Gain : ${money(interest)}
Nouveau solde : ${money(bank.bank)}
`);
        }

        case "card": {
          const action = (args[1] || "").toLowerCase();

          if (action === "create") {
            if (bank.cardNumber) {
              return reply(
                `💳 VOUS POSSÉDEZ DÉJÀ UNE CARTE !\n\nNuméro : ${bank.cardNumber}\nTitulaire : ${clientName}\nStatut : ACTIVE`
              );
            }

            bank.cardNumber = "PB-" +
              Array.from({ length: 12 }, () =>
                Math.floor(Math.random() * 10)
              ).join("");

            await save();

            return reply(`
💳 CARTE PEDRO BANK CRÉÉE !

Numéro : ${bank.cardNumber}
Titulaire : ${clientName}
ID : ${uid}
Statut : ACTIVE
`);
          }

          if (!bank.cardNumber) {
            return reply(
              "❌ Vous ne possédez pas encore de carte.\n\nCréez-la avec : bank card create"
            );
          }

          if (action === "balance" || action === "bal") {
            return reply(`
💳 PROFIL DE VOTRE CARTE

Titulaire : ${clientName}
Numéro : ${bank.cardNumber}
Statut : ACTIVE

💰 Solde carte :
${money(bank.card)}
`);
          }

          const amount = validAmount(args[2]);

          if (!amount) return reply("❌ Montant invalide.");

          if (action === "deposit") {
            if (wallet < amount)
              return insufficient("du portefeuille", wallet);

            user.money -= amount;
            bank.card += amount;

            record(bank, "Dépôt carte", amount);

            await save();

            return reply(`
✅ DÉPÔT SUR CARTE EFFECTUÉ

Montant : ${money(amount)}
Solde carte : ${money(bank.card)}
Portefeuille : ${money(user.money)}
`);
          }

          if (action === "withdraw") {
            if (bank.card < amount)
              return insufficient("de la carte", bank.card);

            if (user.money + amount > Number.MAX_SAFE_INTEGER)
              return reply("❌ Limite du portefeuille atteinte.");

            bank.card -= amount;
            user.money += amount;

            record(bank, "Retrait carte", amount);

            await save();

            return reply(`
✅ RETRAIT DE CARTE EFFECTUÉ

Montant : ${money(amount)}
Solde carte : ${money(bank.card)}
Portefeuille : ${money(user.money)}
`);
          }

          return reply(
            "Utilisation : bank card create / balance / deposit / withdraw"
          );
        }

        case "stocks": {
          const action = (args[1] || "list").toLowerCase();

          if (action === "list") {
            let text = "📈 MARCHÉ BOURSIER\n\n";

            for (const [symbol, stock] of Object.entries(STOCKS)) {
              text += `${symbol} — ${stock.name}\nPrix : ${money(stock.price)} / part\n\n`;
            }

            return reply(text +
              "Achat : bank stocks buy PED 2\nVente : bank stocks sell PED 2"
            );
          }

          const symbol = (args[2] || "").toUpperCase();
          const shares = validAmount(args[3]);
          const stock = STOCKS[symbol];

          if (!stock) return reply("❌ Symbole inconnu.");
          if (!shares) return reply("❌ Quantité invalide.");

          const total = shares * stock.price;

          if (!Number.isSafeInteger(total))
            return reply("❌ Montant trop élevé.");

          if (action === "buy") {
            if (wallet < total)
              return insufficient("du portefeuille", wallet);

            user.money -= total;
            bank.stocks[symbol] = (bank.stocks[symbol] || 0) + shares;

            record(bank, "Achat actions", total, symbol);

            await save();

            return reply(`
📈 ACHAT RÉUSSI

${shares} parts de ${symbol}
Coût : ${money(total)}
Parts détenues : ${bank.stocks[symbol]}
`);
          }

          if (action === "sell") {
            if ((bank.stocks[symbol] || 0) < shares)
              return reply("❌ Vous ne possédez pas assez de parts.");

            if (wallet + total > Number.MAX_SAFE_INTEGER)
              return reply("❌ Limite du portefeuille atteinte.");

            bank.stocks[symbol] -= shares;
            user.money += total;

            record(bank, "Vente actions", total, symbol);

            await save();

            return reply(`
📈 VENTE RÉUSSIE

Parts vendues : ${shares}
Gain : ${money(total)}
Portefeuille : ${money(user.money)}
`);
          }

          return reply("Utilisation : bank stocks list / buy / sell");
	  }

        case "crypto": {
          const action = args[0]?.toLowerCase();
          const name = args[1]?.toLowerCase();
          const amount = Math.floor(Number(args[2]));

          if (!action || !["list", "buy", "sell"].includes(action)) {
            return message.reply(
              "₿ Utilisation :\n" +
              `${prefix}bank crypto list\n` +
              `${prefix}bank crypto buy <crypto> <montant>\n` +
              `${prefix}bank crypto sell <crypto> <montant>`
            );
          }

          if (action === "list") {
            const list = Object.entries(CRYPTOS)
              .map(([key, crypto]) =>
                `• ${crypto.name} (${key}) : ${formatMoney(crypto.price)}`
              )
              .join("\n");

            return message.reply(`₿ **PEDRO CRYPTO MARKET**\n\n${list}`);
          }

          const crypto = CRYPTOS[name];

          if (!crypto) {
            return message.reply(
              `❌ Crypto inconnue.\nUtilise ${prefix}bank crypto list`
            );
          }

          if (!Number.isFinite(amount) || amount <= 0) {
            return message.reply("❌ Montant invalide.");
          }

          const current = bank.crypto[name] || 0;

          if (action === "buy") {
            const total = amount * crypto.price;

            if (user.money < total) {
              return message.reply(
                `❌ Argent insuffisant.\nPrix total : ${formatMoney(total)}`
              );
            }

            user.money -= total;
            bank.crypto[name] = current + amount;

            await save();
            await record("crypto_buy", total);

            return message.reply(
              `✅ Achat effectué !\n\n` +
              `Crypto : ${crypto.name}\n` +
              `Quantité : ${amount}\n` +
              `Total payé : ${formatMoney(total)}`
            );
          }

          if (current < amount) {
            return message.reply("❌ Tu ne possèdes pas assez de cette crypto.");
          }

          const total = amount * crypto.price;

          bank.crypto[name] = current - amount;
          user.money += total;

          await save();
          await record("crypto_sell", total);

          return message.reply(
            `✅ Vente effectuée !\n\n` +
            `Crypto : ${crypto.name}\n` +
            `Quantité vendue : ${amount}\n` +
            `Montant reçu : ${formatMoney(total)}`
          );
        }

        case "lottery": {
          const ticketPrice = 100;

          if (user.money < ticketPrice) {
            return message.reply(
              `❌ Il te faut ${formatMoney(ticketPrice)} pour acheter un ticket.`
            );
          }

          user.money -= ticketPrice;

          const winningNumber = Math.floor(Math.random() * 100) + 1;
          const playerNumber = Math.floor(Math.random() * 100) + 1;

          const won = winningNumber === playerNumber;
          const prize = won ? 5000 : 0;

          if (won) user.money += prize;

          await save();
          await record("lottery", ticketPrice);

          return message.reply(
            `🎰 **PEDRO LOTTERY**\n\n` +
            `Ton numéro : ${playerNumber}\n` +
            `Numéro gagnant : ${winningNumber}\n\n` +
            (won
              ? `🎉 JACKPOT ! Tu gagnes ${formatMoney(prize)} !`
              : `😢 Perdu ! Tu as dépensé ${formatMoney(ticketPrice)}.`)
          );
        }

        case "history":
        case "transactions": {
          const history = bank.history || [];

          if (!history.length) {
            return message.reply("📜 Tu n'as encore aucune transaction.");
          }

          const recent = history.slice(-15).reverse();

          const lines = recent.map((item, index) => {
            const date = item.date
              ? new Date(item.date).toLocaleString("fr-FR")
              : "Date inconnue";

            return (
              `${index + 1}. ${item.type || "Transaction"} — ` +
              `${formatMoney(item.amount || 0)}\n` +
              `   ${date}`
            );
          });

          return message.reply(
            `📜 **HISTORIQUE PEDRO BANK**\n\n${lines.join("\n\n")}`
          );
        }

        case "top":
        case "leaderboard": {
          const page = Math.floor(Number(args[0]) || 1);

          if (page < 1 || page > 5) {
            return message.reply(
              `❌ Page invalide. Utilise ${prefix}bank top 1 à 5.`
            );
          }

          try {
            const allUsers = await usersData.getAll();

            const ranking = [];

            for (const entry of allUsers) {
              const uid = entry.userID || entry.id || entry.key;

              if (!uid) continue;

              const data = entry.data || entry;

              const wallet = Number(data.money || 0);
              const bankData = data.pedroBank || {};

              const bankBalance = Number(bankData.balance || 0);
              const cardBalance = Number(bankData.card || 0);

              let stockValue = 0;
              for (const [stockName, quantity] of Object.entries(
                bankData.stocks || {}
              )) {
                const stock = STOCKS[stockName];
                if (stock) stockValue += Number(quantity || 0) * stock.price;
              }

              let cryptoValue = 0;
              for (const [cryptoName, quantity] of Object.entries(
                bankData.crypto || {}
              )) {
                const crypto = CRYPTOS[cryptoName];
                if (crypto) {
                  cryptoValue += Number(quantity || 0) * crypto.price;
                }
              }

              ranking.push({
                id: uid,
                total: wallet + bankBalance + cardBalance + stockValue + cryptoValue
              });
            }

            ranking.sort((a, b) => b.total - a.total);

            const start = (page - 1) * 10;
            const pageRanking = ranking.slice(start, start + 10);

            if (!pageRanking.length) {
              return message.reply("❌ Aucun utilisateur dans ce classement.");
            }

            try {
              const imageBuffer = await createTopImage(ranking, page);

              return message.reply({
                body:
                  `🏆 **PEDRO BANK TOP**\n` +
                  `Page ${page}/5 — ${ranking.length} joueurs`,
                attachment: imageBuffer
              });
            } catch (imageError) {
              console.error("TOP IMAGE ERROR:", imageError);

              const textRanking = pageRanking
                .map((player, index) =>
                  `${start + index + 1}. ${player.id} — ${formatMoney(player.total)}`
                )
                .join("\n");

              return message.reply(
                `🏆 **PEDRO BANK TOP — PAGE ${page}**\n\n${textRanking}`
              );
            }
          } catch (error) {
            console.error("TOP ERROR:", error);
            return message.reply("❌ Impossible de charger le classement.");
          }
        }

        default:
          return message.reply(
            `❌ Commande inconnue.\nUtilise ${prefix}bank help`
          );
      }
    } catch (error) {
      console.error("PEDRO BANK ERROR:", error);
      return message.reply(
        "❌ Une erreur est survenue avec PEDRO BANK."
      );
    }
  }
};
			  
