
const TITLE = "👑 PEDRO BANK — ELITE FINANCE";
const DAY = 24 * 60 * 60 * 1000;
const MAX = Number.MAX_SAFE_INTEGER;

const STOCKS = {
  PED: { price: 500, name: "Pedro Corporation" },
  APP: { price: 350, name: "Apple" },
  BTC: { price: 1200, name: "Bitcoin Stock" },
  GOL: { price: 200, name: "Gold Industries" },
  TEC: { price: 150, name: "Tech Global" }
};

const CRYPTOS = {
  bitcoin: { price: 1200, symbol: "BTC", name: "Bitcoin" },
  ethereum: { price: 800, symbol: "ETH", name: "Ethereum" },
  solana: { price: 450, symbol: "SOL", name: "Solana" },
  dogecoin: { price: 100, symbol: "DOGE", name: "Dogecoin" }
};

const money = n =>
  "$" + Math.floor(Number(n) || 0).toLocaleString("en-US");

const validAmount = value => {
  if (!/^\d+$/.test(String(value || ""))) return 0;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : 0;
};

function safeAdd(a, b) {
  const result = Number(a || 0) + Number(b || 0);
  return Number.isSafeInteger(result) && result >= 0 ? result : null;
}

function initBank(user) {
  const b = user.pedroBank || {};

  b.bank = Math.max(0, Number(b.bank) || 0);
  b.card = Math.max(0, Number(b.card) || 0);
  b.cardNumber = b.cardNumber || null;
  b.stocks = b.stocks || {};
  b.crypto = b.crypto || {};
  b.history = Array.isArray(b.history) ? b.history : [];
  b.tickets = Array.isArray(b.tickets) ? b.tickets : [];
  b.lastInterest = Number(b.lastInterest) || 0;
  b.lastDaily = Number(b.lastDaily) || 0;

  user.pedroBank = b;
  return b;
}

function record(bank, type, amount, details = "") {
  bank.history.unshift({
    type,
    amount: Number(amount) || 0,
    details,
    date: new Date().toLocaleString("fr-FR")
  });

  bank.history = bank.history.slice(0, 30);
}

function investments(bank) {
  let total = 0;

  for (const [key, quantity] of Object.entries(bank.stocks || {})) {
    total += (STOCKS[key]?.price || 0) * Math.max(0, Number(quantity) || 0);
  }

  for (const [key, quantity] of Object.entries(bank.crypto || {})) {
    total += (CRYPTOS[key]?.price || 0) * Math.max(0, Number(quantity) || 0);
  }

  return Number.isFinite(total) ? total : 0;
}

function getUserData(entry) {
  let data = entry?.data || entry;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = {};
    }
  }

  return data || {};
}

module.exports = {
  config: {
    name: "bank",
    aliases: ["pedrobank", "pb"],
    version: "5.0",
    author: "PEDRI",
    countDown: 2,
    role: 0,
    shortDescription: "Pedro Bank Elite Finance",
    longDescription: "Banque virtuelle avec carte, investissements et classement",
    category: "economy",
    guide: "{pn} help"
  },

  onStart: async function ({ message, args, event, usersData }) {
    const uid = event.senderID;
    const command = (args[0] || "balance").toLowerCase();

    try {
      const user = await usersData.get(uid);

      if (!user) {
        return message.reply("❌ Impossible de charger ton compte.");
      }

      user.money = Math.max(0, Number(user.money) || 0);

      const bank = initBank(user);
      const wallet = user.money;

      const save = async () => {
        user.pedroBank = bank;
        await usersData.set(uid, user.money, "money");
        await usersData.set(uid, bank, "pedroBank");
      };

      const reply = text =>
        message.reply(
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
• bank lottery buy [numéro 1-100]

🏆 CLASSEMENT
• bank top
• bank top 2
• bank top 3
• bank top 4...

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
          const newWallet = safeAdd(user.money, reward);

          if (newWallet === null) {
            return reply("❌ Limite du portefeuille atteinte.");
          }

          user.money = newWallet;
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

          const newBank = safeAdd(bank.bank, amount);
          if (newBank === null) return reply("❌ Limite bancaire atteinte.");

          user.money -= amount;
          bank.bank = newBank;

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

          const newWallet = safeAdd(user.money, amount);
          if (newWallet === null) return reply("❌ Limite du portefeuille atteinte.");

          bank.bank -= amount;
          user.money = newWallet;

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
          if (bank.bank <= 0) {
            return reply("❌ Dépose de l'argent en banque pour recevoir des intérêts.");
          }

          const remaining = DAY - (Date.now() - bank.lastInterest);

          if (bank.lastInterest && remaining > 0) {
            return reply(
              `⏳ Reviens dans ${Math.ceil(remaining / 3600000)} heure(s).`
            );
          }

          const interest = Math.floor(bank.bank * 0.01);

          if (interest <= 0) {
            return reply("❌ Solde bancaire trop faible.");
          }

          const newBank = safeAdd(bank.bank, interest);
          if (newBank === null) return reply("❌ Limite bancaire atteinte.");

          bank.bank = newBank;
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
              return reply(`
💳 VOUS POSSÉDEZ DÉJÀ UNE CARTE !

Numéro : ${bank.cardNumber}
Titulaire : ${clientName}
Statut : ACTIVE
`);
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
            if (wallet < amount) {
              return insufficient("du portefeuille", wallet);
            }

            const newCard = safeAdd(bank.card, amount);
            if (newCard === null) return reply("❌ Limite de la carte atteinte.");

            user.money -= amount;
            bank.card = newCard;

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
            if (bank.card < amount) {
              return insufficient("de la carte", bank.card);
            }

            const newWallet = safeAdd(user.money, amount);
            if (newWallet === null) {
              return reply("❌ Limite du portefeuille atteinte.");
            }

            bank.card -= amount;
            user.money = newWallet;

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
            "Utilisation : bank card create / balance / deposit <montant> / withdraw <montant>"
          );
        }

        case "stocks": {
          const action = (args[1] || "list").toLowerCase();

          if (action === "list") {
            let text = "📈 MARCHÉ BOURSIER\n\n";

            for (const [symbol, stock] of Object.entries(STOCKS)) {
              text += `${symbol} — ${stock.name}\nPrix : ${money(stock.price)} / part\n\n`;
            }

            return reply(
              text +
              "Achat : bank stocks buy PED 2\nVente : bank stocks sell PED 2"
            );
          }

          if (action !== "buy" && action !== "sell") {
            return reply("❌ Utilisation : bank stocks list / buy / sell");
          }

          const symbol = (args[2] || "").toUpperCase();
          const shares = validAmount(args[3]);
          const stock = STOCKS[symbol];

          if (!stock) return reply("❌ Symbole inconnu.");
          if (!shares) return reply("❌ Quantité invalide.");

          const total = shares * stock.price;

          if (!Number.isSafeInteger(total)) {
            return reply("❌ Montant trop élevé.");
          }

          const currentShares = Number(bank.stocks[symbol]) || 0;

          if (action === "buy") {
            if (wallet < total) {
              return insufficient("du portefeuille", wallet);
            }

            const newShares = safeAdd(currentShares, shares);
            if (newShares === null) return reply("❌ Quantité maximale atteinte.");

            user.money -= total;
            bank.stocks[symbol] = newShares;

            record(bank, "Achat actions", total, symbol);
            await save();

            return reply(`
📈 ACHAT RÉUSSI

${shares} parts de ${symbol}
Coût : ${money(total)}
Parts détenues : ${bank.stocks[symbol]}
`);
          }

          if (currentShares < shares) {
            return reply("❌ Vous ne possédez pas assez de parts.");
          }

          const newWallet = safeAdd(user.money, total);
          if (newWallet === null) {
            return reply("❌ Limite du portefeuille atteinte.");
          }

          bank.stocks[symbol] = currentShares - shares;
          user.money = newWallet;

          record(bank, "Vente actions", total, symbol);
          await save();

          return reply(`
📈 VENTE RÉUSSIE

Parts vendues : ${shares}
Gain : ${money(total)}
Portefeuille : ${money(user.money)}
`);
        }

        case "crypto": {
          const action = (args[1] || "").toLowerCase();

          if (action === "list") {
            let text = "₿ PEDRO CRYPTO MARKET\n\n";

            for (const [key, crypto] of Object.entries(CRYPTOS)) {
              text += `${crypto.name} (${key}) — ${crypto.symbol}\nPrix : ${money(crypto.price)}\n\n`;
            }

            return reply(
              text +
              "Achat : bank crypto buy bitcoin 2\nVente : bank crypto sell bitcoin 2"
            );
          }

          if (action !== "buy" && action !== "sell") {
            return reply(
              "❌ Utilisation :\nbank crypto list\nbank crypto buy <crypto> <quantité>\nbank crypto sell <crypto> <quantité>"
            );
          }

          const name = (args[2] || "").toLowerCase();
          const amount = validAmount(args[3]);
          const crypto = CRYPTOS[name];

          if (!crypto) return reply("❌ Crypto inconnue. Utilise bank crypto list.");
          if (!amount) return reply("❌ Quantité invalide.");

          const total = amount * crypto.price;

          if (!Number.isSafeInteger(total)) {
            return reply("❌ Montant trop élevé.");
          }

          const current = Number(bank.crypto[name]) || 0;

          if (action === "buy") {
            if (wallet < total) {
              return insufficient("du portefeuille", wallet);
            }

            const newQuantity = safeAdd(current, amount);
            if (newQuantity === null) {
              return reply("❌ Quantité maximale atteinte.");
            }

            user.money -= total;
            bank.crypto[name] = newQuantity;

            record(bank, "Achat crypto", total, crypto.name);
            await save();

            return reply(`
₿ ACHAT EFFECTUÉ !

Crypto : ${crypto.name}
Quantité : ${amount}
Total payé : ${money(total)}
Quantité détenue : ${bank.crypto[name]}
`);
          }

          if (current < amount) {
            return reply("❌ Tu ne possèdes pas assez de cette crypto.");
          }

          const newWallet = safeAdd(user.money, total);
          if (newWallet === null) {
            return reply("❌ Limite du portefeuille atteinte.");
          }

          bank.crypto[name] = current - amount;
          user.money = newWallet;

          record(bank, "Vente crypto", total, crypto.name);
          await save();

          return reply(`
₿ VENTE EFFECTUÉE !

Crypto : ${crypto.name}
Quantité vendue : ${amount}
Montant reçu : ${money(total)}
Portefeuille : ${money(user.money)}
`);
        }

        case "lottery": {
          const action = (args[1] || "info").toLowerCase();
          const ticketPrice = 100;

          if (action === "info") {
            return reply(`
🎰 PEDRO LOTTERY

Prix du ticket : ${money(ticketPrice)}
Numéros disponibles : 1 à 100
Jackpot : ${money(5000)}

Pour jouer :
bank lottery buy
ou
bank lottery buy <numéro>
`);
          }

          if (action !== "buy") {
            return reply("❌ Utilisation : bank lottery info / buy [numéro]");
          }

          if (wallet < ticketPrice) {
            return insufficient("du portefeuille", wallet);
          }

          let playerNumber;

          if (args[2] !== undefined) {
            playerNumber = validAmount(args[2]);

            if (!playerNumber || playerNumber > 100) {
              return reply("❌ Choisis un numéro entre 1 et 100.");
            }
          } else {
            playerNumber = Math.floor(Math.random() * 100) + 1;
          }

          const winningNumber = Math.floor(Math.random() * 100) + 1;
          const won = playerNumber === winningNumber;
          const prize = won ? 5000 : 0;

          const afterTicket = user.money - ticketPrice;
          const finalWallet = safeAdd(afterTicket, prize);

          if (finalWallet === null) {
            return reply("❌ Limite du portefeuille atteinte.");
          }

          user.money = finalWallet;

          bank.tickets.unshift({
            playerNumber,
            winningNumber,
            won,
            date: new Date().toLocaleString("fr-FR")
          });

          bank.tickets = bank.tickets.slice(0, 20);

          record(
            bank,
            won ? "Loterie gagnée" : "Ticket de loterie",
            won ? prize : ticketPrice,
            `Numéro choisi : ${playerNumber}`
          );

          await save();

          return reply(`
🎰 PEDRO LOTTERY

Ton numéro : ${playerNumber}
Numéro gagnant : ${winningNumber}

${won
  ? `🎉 JACKPOT ! Tu gagnes ${money(prize)} !`
  : `😢 Perdu ! Tu as dépensé ${money(ticketPrice)}.`}

💰 Portefeuille : ${money(user.money)}
`);
        }

        case "history":
        case "transactions": {
          const history = bank.history || [];

          if (!history.length) {
            return reply("📜 Tu n'as encore aucune transaction.");
          }

          const recent = history.slice(0, 15);

          const lines = recent.map((item, index) => {
            return (
              `${index + 1}. ${item.type || "Transaction"} — ${money(item.amount || 0)}\n` +
              `   ${item.details ? item.details + "\n   " : ""}${item.date || "Date inconnue"}`
            );
          });

          return reply(
            `📜 HISTORIQUE PEDRO BANK\n\n${lines.join("\n\n")}`
          );
        }

        case "top":
        case "leaderboard": {
          const page = args[1] === undefined ? 1 : Number(args[1]);

          if (!Number.isSafeInteger(page) || page < 1) {
            return reply("❌ Page invalide. Exemple : bank top 2");
          }

          try {
            const allUsers = await usersData.getAll();
            const entries = Array.isArray(allUsers)
              ? allUsers
              : Object.entries(allUsers || {}).map(([key, value]) => ({
                  key,
                  ...(value || {})
                }));

            const ranking = [];

            for (const entry of entries) {
              const id =
                entry.userID ||
                entry.uid ||
                entry.id ||
                entry.key;

              if (!id) continue;

              const data = getUserData(entry);
              const walletBalance = Math.max(0, Number(data.money) || 0);
              const bankData = data.pedroBank || {};

              // Important : le vrai solde bancaire est bank.bank.
              const bankBalance = Math.max(0, Number(bankData.bank) || 0);
              const cardBalance = Math.max(0, Number(bankData.card) || 0);

              let stockValue = 0;

              for (const [stockName, quantity] of Object.entries(bankData.stocks || {})) {
                const stock = STOCKS[stockName];
                const qty = Math.max(0, Number(quantity) || 0);

                if (stock && Number.isFinite(qty)) {
                 
                  stockValue += stock.price * qty;
                }
              }

              let cryptoValue = 0;

              for (const [cryptoName, quantity] of Object.entries(bankData.crypto || {})) {
                const crypto = CRYPTOS[cryptoName];
                const qty = Math.max(0, Number(quantity) || 0);

                if (crypto && Number.isFinite(qty)) {
                  cryptoValue += crypto.price * qty;
                }
              }

              const total = Math.min(
                MAX,
                walletBalance +
                bankBalance +
                cardBalance +
                stockValue +
                cryptoValue
              );

              const name =
                data.name ||
                data.userName ||
                data.firstName ||
                entry.name ||
                `Client ${id}`;

              ranking.push({
                id: String(id),
                name,
                total
              });
            }

            // Trier du plus riche au moins riche
            ranking.sort((a, b) => {
              if (b.total !== a.total) return b.total - a.total;
              return a.name.localeCompare(b.name);
            });

            // 10 membres par page
            const perPage = 10;
            const totalPages = Math.max(
              1,
              Math.ceil(ranking.length / perPage)
            );

            if (page > totalPages) {
              return reply(
                `❌ Cette page n'existe pas.\n\n` +
                `📄 Pages disponibles : ${totalPages}\n` +
                `Utilise : bank top ${totalPages}`
              );
            }

            const start = (page - 1) * perPage;
            const members = ranking.slice(start, start + perPage);

            const medals = ["🥇", "🥈", "🥉"];

            let result = `🏆 CLASSEMENT PEDRO BANK\n`;
            result += `📄 PAGE ${page}/${totalPages}\n`;
            result += `👥 ${ranking.length} membres classés\n`;
            result += `━━━━━━━━━━━━━━━━━━\n\n`;

            for (let i = 0; i < members.length; i++) {
              const member = members[i];
              const rank = start + i + 1;
              const medal = medals[rank - 1] || `#${rank}`;

              result +=
                `${medal} ${member.name}\n` +
                `💎 Fortune : ${money(member.total)}\n` +
                `🆔 ID : ${member.id}\n\n`;
            }

            result += `━━━━━━━━━━━━━━━━━━\n`;
            result += `📊 TOTAL : ${ranking.length} membres\n`;
            result += `📄 Page ${page} sur ${totalPages}\n\n`;

            if (page < totalPages) {
              result += `➡️ Page suivante : bank top ${page + 1}\n`;
            }

            if (page > 1) {
              result += `⬅️ Page précédente : bank top ${page - 1}\n`;
            }

            result += `🏆 Classement des 10 meilleurs par page.`;

            return reply(result);

          } catch (error) {
            console.error("[PEDRO BANK TOP]", error);
            return reply(
              "❌ Impossible de charger le classement. Réessaie plus tard."
            );
          }
        }

        default:
          return reply(`
❌ COMMANDE INCONNUE !

Utilise :
bank help

Pour consulter ton compte :
bank balance

Pour voir le classement :
bank top
`);
      }

    } catch (error) {
      console.error("[PEDRO BANK ERROR]", error);

      return message.reply(
        "❌ Une erreur est survenue dans PEDRO BANK. Réessaie plus tard."
      );
    }
  }
};
                
