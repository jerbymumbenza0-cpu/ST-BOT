const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

let fonts;
try {
  fonts = require('../../func/font.js');
} catch (error) {
  fonts = {
    bold: function (t) { return t; },
    sansSerif: function (t) { return t; },
    monospace: function (t) { return t; },
    fancy: function (t) { return t; }
  };
}

function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

const AUTHOR_NAME = "\u56FD\uFE31PEDRI \u3050\u689D";

const categoryIcons = {
  ai: "\uD83E\uDD16",
  admin: "\uD83D\uDEE1\uFE0F",
  "box chat": "\uD83D\uDCAC",
  config: "\u2699\uFE0F",
  "contacts admin": "\uD83D\uDCDE",
  custom: "\uD83C\uDFA8",
  downloader: "\uD83D\uDCE5",
  economy: "\uD83D\uDCB0",
  "events configure": "\uD83C\uDF89",
  fun: "\uD83C\uDFAD",
  funny: "\uD83D\uDE02",
  game: "\uD83C\uDFAE",
  games: "\uD83C\uDFB2",
  group: "\uD83D\uDC65",
  image: "\uD83D\uDDBC\uFE0F",
  "image generator": "\u2728",
  "image url": "\uD83D\uDD17",
  info: "\u2139\uFE0F",
  islam: "\uD83D\uDD4C",
  love: "\u2764\uFE0F",
  media: "\uD83C\uDFAC",
  music: "\uD83C\uDFB5",
  noprefix: "\u26A1",
  other: "\uD83D\uDCE6",
  owner: "\uD83D\uDC51",
  profile: "\uD83D\uDC64",
  rank: "\uD83C\uDFC6",
  software: "\uD83D\uDCBB",
  system: "\uD83D\uDDA5\uFE0F",
  "syst\u00E8me": "\uD83D\uDDA5\uFE0F",
  tools: "\uD83D\uDEE0\uFE0F",
  utility: "\uD83E\uDDF0",
  "voice generator": "\uD83C\uDF99\uFE0F",
  wiki: "\uD83D\uDCDA"
};

module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "aide"],
    version: "4.0.5",
    author: AUTHOR_NAME,
    countDown: 5,
    role: 0,
    description: {
      fr: "Affiche le menu interactif des commandes et leurs details"
    },
    category: "info",
    guide: {
      fr: "{pn} : afficher le menu principal\n{pn} <commande> : details d'une commande\n{pn} basics : commandes essentielles\n{pn} search <mot> : rechercher une commande"
    }
  },

  onStart: async function ({ message, args, event, role }) {
    const prefix = getPrefix(event.threadID);
    const arg = args[0] ? args[0].toLowerCase() : null;

    const allCommands = [];
    const seen = new Set();

    for (const [name, cmd] of commands) {
      if (!cmd || !cmd.config) continue;
      if (cmd.config.role > role) continue;
      if (!seen.has(name)) {
        seen.add(name);
        allCommands.push(cmd);
      }
    }

    allCommands.sort(function (a, b) {
      return a.config.name.localeCompare(b.config.name);
    });

    // 1. MENU PRINCIPAL
    if (!arg || arg === "all") {
      const categorized = {};

      for (const cmd of allCommands) {
        const rawCat = (cmd.config.category || "other").toLowerCase().trim();
        if (!categorized[rawCat]) categorized[rawCat] = [];
        categorized[rawCat].push(cmd.config.name);
      }

      const sortedCats = Object.keys(categorized).sort();

      let msg = "\u250F\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2513\n";
      msg += "\u2503   \uD83D\uDCBB " + fonts.bold("MENU DU BOT") + " \uD83D\uDCBB   \u2503\n";
      msg += "\u2523\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u252B\n";
      msg += "\u2503 \u26A1 " + fonts.bold("Statut") + " : En ligne\n";
      msg += "\u2503 \uD83D\uDD11 " + fonts.bold("Pr\u00E9fixe") + " : " + fonts.monospace(prefix) + "\n";
      msg += "\u2503 \uD83D\uDCCA " + fonts.bold("Total") + " : " + fonts.bold(String(allCommands.length)) + " commandes\n";
      msg += "\u2517\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u251B\n\n";

      for (const cat of sortedCats) {
        const icon = categoryIcons[cat] || "\uD83D\uDCA0";
        const catTitle = toTitleCase(cat);
        const cmds = categorized[cat].sort();

        msg += "\u256D\u2500 " + icon + " " + fonts.bold(catTitle) + " (" + cmds.length + ")\n";

        for (let i = 0; i < cmds.length; i += 3) {
          const line = cmds
            .slice(i, i + 3)
            .map(function (c) { return fonts.sansSerif(c); })
            .join(" \u2022 ");
          msg += "\u2502 \u25B8 " + line + "\n";
        }
        msg += "\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n";
      }

      msg += "\uD83D\uDCA1 " + fonts.bold("NAVIGATION RAPIDE") + "\n";
      msg += "\u2523 \uD83D\uDD0D D\u00E9tails : " + fonts.monospace(prefix + "help <commande>") + "\n";
      msg += "\u2523 \u2B50 Essentiels : " + fonts.monospace(prefix + "help basics") + "\n";
      msg += "\u2517 \uD83D\uDD0E Recherche : " + fonts.monospace(prefix + "help search <mot>") + "\n\n";
      msg += "\uD83D\uDC51 " + fonts.bold("Cr\u00E9\u00E9 par @" + AUTHOR_NAME);

      return message.reply(msg);
    }

    // 2. COMMANDES DE BASE
    if (arg === "basics") {
      const basicCmdList = [
        "register", "items", "gift", "bal", "bank", "active", "streak",
        "vault", "bag", "rank", "ratings", "report", "trade", "uid",
        "pet", "rosashop", "garden", "arena", "mtls", "daily", "balance", "profile"
      ];

      const validCommands = [];

      for (const cmdName of basicCmdList) {
        const cmd = commands.get(cmdName);
        if (cmd && cmd.config.role <= role) {
          validCommands.push(cmd);
        }
      }

      if (validCommands.length === 0) {
        return message.reply(fonts.bold("\u274C Aucune commande de base disponible pour ton r\u00F4le."));
      }

      let msg = "\u250F\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2513\n";
      msg += "\u2503 \u2B50 " + fonts.bold("COMMANDES ESSENTIELLES") + " \u2503\n";
      msg += "\u2517\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u251B\n\n";

      for (const cmd of validCommands) {
        const cfg = cmd.config;
        const desc = (cfg.description && (cfg.description.fr || cfg.description.en)) || "Aucune description";
        msg += "\uD83D\uDD39 " + fonts.bold(prefix + cfg.name) + "\n   \u2514 " + desc + "\n\n";
      }

      msg += "\uD83D\uDCCC Tape " + fonts.monospace(prefix + "help") + " pour voir toutes les commandes.\n";
      msg += "\uD83D\uDC51 " + fonts.bold("Cr\u00E9\u00E9 par @" + AUTHOR_NAME);

      return message.reply(msg);
    }

    // 3. RECHERCHE
    if (arg === "search" || arg === "find") {
      const searchStr = args[1];
      if (!searchStr) {
        return message.reply(
          "\uD83D\uDD0E " + fonts.bold("Recherche de commande") + "\nEntrez un mot-cl\u00E9 apr\u00E8s la commande.\n\n\uD83D\uDCCC " + fonts.bold("Exemple :") + " " + fonts.monospace(prefix + "help search money")
        );
      }

      const results = [];
      const searchLower = searchStr.toLowerCase();

      for (const [name, cmd] of commands) {
        if (!cmd || !cmd.config) continue;
        if (cmd.config.role > role) continue;
        const cfg = cmd.config;
        const desc = (cfg.description && (cfg.description.fr || cfg.description.en)) || "";
        const aliasStr = Array.isArray(cfg.aliases) ? cfg.aliases.join(" ") : "";
        const searchableText = (cfg.name + " " + (cfg.category || "") + " " + aliasStr + " " + desc).toLowerCase();
        if (searchableText.includes(searchLower)) {
          results.push(cmd);
        }
      }

      if (results.length === 0) {
        return message.reply("\uD83D\uDD0E " + fonts.bold("R\u00E9sultats (0)") + "\n\u274C Aucune commande trouv\u00E9e pour \"" + searchStr + "\".");
      }

      const topResults = results.slice(0, 8);
      let msg = "\uD83D\uDD0E " + fonts.bold("R\u00C9SULTATS POUR \"" + searchStr.toUpperCase() + "\"") + " (" + topResults.length + "/" + results.length + ")\n\n";

      for (const cmd of topResults) {
        const cfg = cmd.config;
        const aliasesList = Array.isArray(cfg.aliases) && cfg.aliases.length > 0 ? " (" + cfg.aliases.join(", ") + ")" : "";
        const desc = (cfg.description && (cfg.description.fr || cfg.description.en)) || "Aucune description";
        msg += "\uD83D\uDD38 " + fonts.bold(prefix + cfg.name) + aliasesList + "\n";
        msg += "   \u2514 " + desc + "\n\n";
      }

      msg += "\uD83D\uDC51 " + fonts.bold("Cr\u00E9\u00E9 par @" + AUTHOR_NAME);

      return message.reply(msg);
    }

    // 4. DETAILS D'UNE COMMANDE
    const cmdName = arg;
    let cmd = commands.get(cmdName);
    if (!cmd) {
      const alias = aliases.get(cmdName);
      if (alias) cmd = commands.get(alias);
    }

    if (!cmd) {
      return message.reply("\u274C La commande " + fonts.bold("\"" + cmdName + "\"") + " est introuvable.\n\uD83D\uDCA1 Tape " + fonts.monospace(prefix + "help search " + cmdName) + " pour chercher.");
    }

    const cfg = cmd.config;

    let usage = (cfg.guide && (cfg.guide.fr || cfg.guide.en)) || "Aucun guide disponible";
    usage = usage.replace(/{pn}/g, prefix + cfg.name).replace(/{p}/g, prefix).replace(/{n}/g, cfg.name);

    const roleText =
      cfg.role == 0 ? "\uD83D\uDC64 Tous les utilisateurs" :
      cfg.role == 1 ? "\uD83D\uDEE1\uFE0F Admins du groupe" :
      cfg.role == 2 ? "\uD83D\uDC51 Cr\u00E9ateur du bot" : "\u2753 Inconnu";

    const catIcon = categoryIcons[(cfg.category || "").toLowerCase()] || "\uD83D\uDCA0";
    const descText = (cfg.description && (cfg.description.fr || cfg.description.en)) || "Aucune";
    const aliasText = Array.isArray(cfg.aliases) && cfg.aliases.length > 0 ? cfg.aliases.join(", ") : "Aucun";

    const detail =
      "\u256D\u2500\u2500\u2500\u2500\u300C " + catIcon + " " + fonts.bold(toTitleCase(cfg.name)) + " \u300D\u2500\u2500\u2500\u2500\n" +
      "\u2502\n" +
      "\u2502 \uD83D\uDCDD " + fonts.bold("Description :") + "\n" +
      "\u2502    " + descText + "\n" +
      "\u2502\n" +
      "\u2502 \uD83D\uDCBB " + fonts.bold("Utilisation :") + "\n" +
      "\u2502    " + fonts.monospace(usage) + "\n" +
      "\u2502\n" +
      "\u2502 \uD83D\uDCC2 " + fonts.bold("Cat\u00E9gorie : ") + toTitleCase(cfg.category || "Autre") + "\n" +
      "\u2502 \u23F1\uFE0F " + fonts.bold("Cooldown : ") + (cfg.countDown || 1) + " seconde(s)\n" +
      "\u2502 \uD83D\uDD10 " + fonts.bold("Permission : ") + roleText + "\n" +
      "\u2502 \uD83C\uDFF7\uFE0F " + fonts.bold("Alias : ") + aliasText + "\n" +
      "\u2502 \uD83D\uDC68\u200D\uD83D\uDCBB " + fonts.bold("Auteur : ") + (cfg.author || "Inconnu") + "\n" +
      "\u2502\n" +
      "\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500";

    return message.reply(detail);
  }
};
		  
