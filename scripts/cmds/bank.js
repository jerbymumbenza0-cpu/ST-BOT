
const title = "👑 𝗣𝗘𝗗𝗥𝗢 𝗕𝗔𝗡𝗞 — ELITE FINANCE";
const VERSION = "3.0";
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

const money = n => "$" + Math.floor(Number(n) || 0).toLocaleString("en-US");

function validAmount(value) {
  if (!/^\d+$/.test(String(value || ""))) return 0;
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : 0;
}

function initBank(user) {
  if (!user.pedroBank) {
    user.pedroBank = {
      bank: 0,
      card: 0,
      cardNumber: null,
      stocks: {},
      crypto: {},
      history: [],
      lastInterest: 0,
      tickets: []
    };
  }

  const b = user.pedroBank;
  b.bank = Number(b.bank) || 0;
  b.card = Number(b.card) || 0;
  b.stocks ||= {};
  b.crypto ||= {};
  b.history ||= [];
  b.tickets ||= [];

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

function totalInvestments(bank) {
  let total = 0;

  for (const [symbol, shares] of Object.entries(bank.stocks)) {
    if (STOCKS[symbol]) total += shares * STOCKS[symbol].price;
  }

  for (const [name, quantity] of Object.entries(bank.crypto)) {
    if (CRYPTOS[name]) total += quantity * CRYPTOS[name].price;
  }

  return total;
}

module.exports = {
  config: {
    name: "bank",
    aliases: ["pedrobank", "pb"],
    version: VERSION,
    author: "国︱PEDRI ぐ條",
    countDown: 2,
    role: 0,
    description: {
      fr: "Banque virtuelle Pedro Bank Elite Finance",
      en: "Pedro Bank virtual banking system"
    },
    category: "economy",
    guide: {
      fr: "{pn} help"
    }
  },

  langs: {
    fr: {
      success: "Opération effectuée avec succès.",
      error: "Une erreur est survenue."
    }
  },

  onStart: async function ({ message, args, event, usersData }) {
    const uid = event.senderID;
    const command = (args[0] || "help").toLowerCase();

    try {
      const user = await usersData.get(uid);
      const bank = initBank(user);
      user.money = Math.max(0, Number(user.money) || 0);

      const wallet = user.money;

      const save = async () => {
        await usersData.set(uid, user);
      };

      const reply = text => message.reply(
        `${title}\n━━━━━━━━━━━━━━━━━━\n${text}\n━━━━━━━━━━━━━━━━━━\n💎 PEDRO BANK • ELITE FINANCE`
      );

      const insufficient = (where, amount) =>
        reply(`❌ Fonds insuffisants !\nSolde ${where}: ${money(amount)}`);

      switch (command) {

        // HELP
        case "help":
        case "menu":
          return reply(`
👑 BIENVENUE CHEZ PEDRO BANK

💰 BANQUE
• bank balance
• bank deposit <montant>
• bank withdraw <montant>
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

₿ CRYPTOMONNAIES
• bank crypto list
• bank crypto buy <nom> <quantité>
• bank crypto sell <nom> <quantité>

🎰 LOTERIE
• bank lottery info
• bank lottery buy <numéro>

📜 AUTRES
• bank history
• bank leaderboard

━━━━━━━━━━━━━━━━━━
💡 Devise virtuelle : USD ($)
`);

        // BALANCE
        case "balance":
        case "bal": {
          const investments = totalInvestments(bank);
          const total = wallet + bank.bank + bank.card + investments;

          return reply(`
👤 COMPTE CLIENT

💵 Portefeuille : ${money(wallet)}
🏦 Banque : ${money(bank.bank)}
💳 Carte : ${money(bank.card)}

📊 INVESTISSEMENTS
• Actions : ${money(
  Object.entries(bank.stocks).reduce(
    (s, [k, v]) => s + (STOCKS[k]?.price || 0) * v, 0
  )
)}
• Cryptos : ${money(
  Object.entries(bank.crypto).reduce(
    (s, [k, v]) => s + (CRYPTOS[k]?.price || 0) * v, 0
  )
)}

💎 PATRIMOINE TOTAL
${money(total)}

🎟️ Tickets actifs : ${bank.tickets.length}
🆔 ID : ${uid}
`);
        }

        // DEPOSIT
        case "deposit":
        case "dep": {
          const amount = validAmount(args[1]);
          if (!amount) return reply("❌ Montant invalide.");
          if (wallet < amount) return insufficient("du portefeuille", wallet);

          user.money -= amount;
          bank.bank += amount;

          record(bank, "Dépôt", amount);
          await save();

          return reply(`
✅ DÉPÔT EFFECTUÉ
Montant : ${money(amount)}
Portefeuille : ${money(user.money)}
Compte bancaire : ${money(bank.bank)}
`);
        }

        // WITHDRAW
        case "withdraw":
        case "wd": {
          const amount = validAmount(args[1]);
          if (!amount) return reply("❌ Montant invalide.");

          if (bank.bank < amount) {
            return insufficient("bancaire", bank.bank);
          }

          if (user.money + amount > Number.MAX_SAFE_INTEGER) {
            return reply("❌ Limite maximale du portefeuille atteinte.");
          }

          bank.bank -= amount;
          user.money += amount;

          record(bank, "Retrait", amount);
          await save();

          return reply(`
✅ RETRAIT EFFECTUÉ
Montant : ${money(amount)}
Portefeuille : ${money(user.money)}
Banque : ${money(bank.bank)}
`);
        }

        // INTEREST
        case "interest": {
          const now = Date.now();
          const remaining = DAY - (now - bank.lastInterest);

          if (bank.bank <= 0) {
            return reply("❌ Vous devez avoir de l'argent en banque pour recevoir des intérêts.");
          }

          if (bank.lastInterest && remaining > 0) {
            const hours = Math.ceil(remaining / 3600000);
            return reply(`⏳ Revenez dans ${hours} heure(s) pour vos prochains intérêts.`);
          }

          const interest = Math.floor(bank.bank * 0.01);

          if (interest <= 0) {
            return reply("❌ Votre solde est trop faible pour générer des intérêts.");
          }

          bank.bank += interest;
          bank.lastInterest = now;

          record(bank, "Intérêts", interest);
          await save();

          return reply(`
💎 INTÉRÊTS CRÉDITÉS !
Taux : 1 %
Gain : ${money(interest)}
Nouveau solde : ${money(bank.bank)}
`);
        }

        // CARD
        case "card": {
          const action = (args[1] || "").toLowerCase();

          if (action === "create") {
            if (bank.cardNumber) {
              return reply("❌ Vous possédez déjà une carte PEDRO BANK.");
            }

            bank.cardNumber = "PB-" +
              Array.from({ length: 12 }, () =>
                Math.floor(Math.random() * 10)
              ).join("");

            await save();

            return reply(`
💳 CARTE PEDRO BANK CRÉÉE !

Numéro : ${bank.cardNumber}
Titulaire : ${user.name || "Client Pedro"}
Statut : ACTIVE
`);
          }

          if (!bank.cardNumber) {
            return reply("❌ Créez d'abord votre carte : bank card create");
          }

          if (action === "balance" || action === "bal") {
            return reply(`💳 SOLDE DE LA CARTE\n${money(bank.card)}\nCarte : ${bank.cardNumber}`);
          }

          const amount = validAmount(args[2]);
          if (!amount) return reply("❌ Montant invalide.");

          if (action === "deposit") {
            if (wallet < amount) return insufficient("du portefeuille", wallet);

            user.money -= amount;
            bank.card += amount;

            record(bank, "Dépôt carte", amount);
            await save();

            return reply(`✅ Dépôt carte effectué : ${money(amount)}\nSolde carte : ${money(bank.card)}`);
          }

          if (action === "withdraw") {
            if (bank.card < amount) return insufficient("de la carte", bank.card);

            bank.card -= amount;
            user.money += amount;

            record(bank, "Retrait carte", amount);
            await save();

            return reply(`✅ Retrait effectué : ${money(amount)}\nSolde carte : ${money(bank.card)}\nPortefeuille : ${money(user.money)}`);
          }

          return reply("Utilisation : bank card create / balance / deposit / withdraw");
        }

        // STOCKS
        case "stocks": {
          const action = (args[1] || "list").toLowerCase();

          if (action === "list") {
            let text = "📈 MARCHÉ BOURSIER\n\n";

            for (const [symbol, stock] of Object.entries(STOCKS)) {
              text += `${symbol} — ${stock.name}\nPrix : ${money(stock.price)} / part\n\n`;
            }

            text += "Achat : bank stocks buy PED 2\nVente : bank stocks sell PED 2";
            return reply(text);
          }

          const symbol = (args[2] || "").toUpperCase();
          const shares = validAmount(args[3]);
          const stock = STOCKS[symbol];

          if (!stock) return reply("❌ Symbole inconnu. Utilisez bank stocks list.");
          if (!shares) return reply("❌ Quantité invalide.");

          const total = shares * stock.price;
          if (!Number.isSafeInteger(total)) return reply("❌ Montant trop élevé.");

          if (action === "buy") {
            if (wallet < total) return insufficient("du portefeuille", wallet);

            user.money -= total;
            bank.stocks[symbol] = (bank.stocks[symbol] || 0) + shares;

            record(bank, "Achat actions", total, symbol);
            await save();

            return reply(`📈 ACHAT RÉUSSI\n${shares} parts de ${symbol}\nPrix : ${money(total)}\nParts détenues : ${bank.stocks[symbol]}`);
          }

          if (action === "sell") {
            if ((bank.stocks[symbol] || 0) < shares) {
              return reply("❌ Vous ne possédez pas assez de parts.");
            }

            if (wallet + total > Number.MAX_SAFE_INTEGER) {
              return reply("❌ Limite du portefeuille atteinte.");
            }

            bank.stocks[symbol] -= shares;
            user.money += total;

            record(bank, "Vente actions", total, symbol);
            await save();

            return reply(`📈 VENTE RÉUSSIE\n${shares} parts de ${symbol}\nGain : ${money(total)}\nPortefeuille : ${money(user.money)}`);
          }

          return reply("Utilisation : bank stocks list / buy / sell");
        }

        // CRYPTO
        case "crypto": {
          const action = (args[1] || "list").toLowerCase();

          if (action === "list") {
            let text = "₿ MARCHÉ CRYPTO\n\n";

            for (const [name, crypto] of Object.entries(CRYPTOS)) {
              text += `${crypto.symbol} (${name}) : ${money(crypto.price)} / unité\n`;
            }

            text += "\nAchat : bank crypto buy bitcoin 2\nVente : bank crypto sell bitcoin 2";
            return reply(text);
          }

          const name = (args[2] || "").toLowerCase();
          const quantity = validAmount(args[3]);
          const crypto = CRYPTOS[name];

          if (!crypto) return reply("❌ Crypto inconnue. Utilisez bank crypto list.");
          if (!quantity) return reply("❌ Quantité invalide.");

          const total = quantity * crypto.price;
          if (!Number.isSafeInteger(total)) return reply("❌ Montant trop élevé.");

          if (action === "buy") {
            if (wallet < total) return insufficient("du portefeuille", wallet);

            user.money -= total;
            bank.crypto[name] = (bank.crypto[name] || 0) + quantity;

            record(bank, "Achat crypto", total, name);
            await save();

            return reply(`₿ ACHAT RÉUSSI\n${quantity} ${crypto.symbol}\nCoût : ${money(total)}\nQuantité détenue : ${bank.crypto[name]}`);
          }

          if (action === "sell") {
            if ((bank.crypto[name] || 0) < quantity) {
              return reply("❌ Vous ne possédez pas assez de cryptos.");
            }

            if (wallet + total > Number.MAX_SAFE_INTEGER) {
              return reply("❌ Limite du portefeuille atteinte.");
            }

            bank.crypto[name] -= quantity;
            user.money += total;

            record(bank, "Vente crypto", total, name);
            await save();

            return reply(`₿ VENTE RÉUSSIE\n${quantity} ${crypto.symbol}\nValeur : ${money(total)}\nPortefeuille : ${money(user.money)}`);
          }

          return reply("Utilisation : bank crypto list / buy / sell");
        }

        // LOTTERY
        case "lottery": {
          const action = (args[1] || "info").toLowerCase();

          if (action === "info") {
            return reply(`
🎰 PEDRO JACKPOT

Prix du ticket : ${money(100)}
Numéro : 1 à 100
Chance de jackpot : 1 %
Gain du jackpot : ${money(5000)}

Commande : bank lottery buy <numéro>
`);
          }

          if (action === "buy") {
            const number = Number(args[2]);

            if (!Number.isInteger(number) || number < 1 || number > 100) {
              return reply("❌ Choisissez un numéro entre 1 et 100.");
            }

            if (wallet < 100) return insufficient("du portefeuille", wallet);

            user.money -= 100;

            const win = Math.floor(Math.random() * 100) === 0;
            const prize = win ? 5000 : 0;

            if (prize) user.money += prize;

            bank.tickets.push({
              number,
              win,
              date: new Date().toLocaleString("fr-FR")
            });

            bank.tickets = bank.tickets.slice(-20);

            record(bank, "Ticket loterie", 100, `Numéro ${number}`);

            if (win) record(bank, "Jackpot", prize);

            await save();

            return reply(win
              ? `🎉 JACKPOT !\nNuméro : ${number}\nGain : ${money(prize)}\nNouveau portefeuille : ${money(user.money)}`
              : `🎟️ Ticket acheté !\nNuméro : ${number}\nDésolé, pas de gain cette fois.\nPortefeuille : ${money(user.money)}`
            );
          }

          return reply("Utilisation : bank lottery info / buy <numéro>");
        }

        // HISTORY
        case "history":
        case "transactions": {
          if (!bank.history.length) {
            return reply("📜 Aucune transaction enregistrée.");
          }

          let text = "📜 HISTORIQUE DES TRANSACTIONS\n\n";

          bank.history.slice(0, 15).forEach((item, index) => {
            text += `${index + 1}. ${item.type}\n`;
            text += `Montant : ${money(item.amount)}\n`;
            if (item.details) text += `Détail : ${item.details}\n`;
            text += `Date : ${item.date}\n\n`;
          });

          return reply(text);
        }

        // LEADERBOARD
        case "leaderboard":
        case "top": {
          if (typeof usersData.getAll !== "function") {
            return reply("⚠️ Le classement nécessite la fonction usersData.getAll() dans votre framework.");
          }

          const allUsers = await usersData.getAll();
          const list = Array.isArray(allUsers)
            ? allUsers
            : Object.values(allUsers || {});

          const ranking = list.map(u => {
            const b = u.pedroBank || {};
            const stocks = Object.entries(b.stocks || {}).reduce(
              (s, [k, v]) => s + (STOCKS[k]?.price || 0) * v, 0
            );
            const crypto = Object.entries(b.crypto || {}).reduce(
              (s, [k, v]) => s + (CRYPTOS[k]?.price || 0) * v, 0
            );

            return {
              name: u.name || "Utilisateur",
              total: (Number(u.money) || 0) +
                (Number(b.bank) || 0) +
                (Number(b.card) || 0) +
                stocks + crypto
            };
          }).sort((a, b) => b.total - a.total).slice(0, 10);

          let text = "🏆 TOP 10 DES PLUS RICHES\n\n";

          ranking.forEach((u, i) => {
            const medal = ["🥇", "🥈", "🥉"][i] || `${i + 1}.`;
            text += `${medal} ${u.name}\n💎 ${money(u.total)}\n\n`;
          });

          return reply(text);
        }

        default:
          return reply(`❌ Commande inconnue : ${command}\nUtilisez bank help.`);
      }

    } catch (error) {
      console.error("PEDRO BANK ERROR:", error);
      return message.reply(
        `${title}\n\n❌ Une erreur est survenue. Réessayez plus tard.`
      );
    }
  }
};
	  
