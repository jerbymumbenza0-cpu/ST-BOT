module.exports = {
  config: {
    name: "ultimatum",
    aliases: ["stm", "botinfo"],
    version: "1.0",
    author: "MR ULTIMATUM",
    role: 0,
    category: "fun",
    guide: "{pn} [status | ping | quote]"
  },

  onStart: async function ({ api, event, args, threadsData, message }) {
    const startTime = Date.now();
    const sub = (args[0] || "status").toLowerCase();
    const botName = "𝐌𝐑 U𝐋𝐓I𝐌𝐀TUM 🗿";
    const prefix = "!";

    const quotes = [
      "« Le calme avant la tempête vaut mieux que le bruit sans direction. » 🗿",
      "« Ce n'est pas la vitesse qui gagne, c'est la constance. » ⚡",
      "« Un système bien réglé n'a pas besoin de crier pour prouver sa valeur. » 🔥",
      "« Reste focus, le reste suivra. » 🇫🇷"
    ];

    if (sub === "quote" || sub === "citation") {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      return message.reply(`🗿 ${botName}\n\n${randomQuote}`);
    }

    if (sub === "ping" || sub === "latence") {
      const latency = Date.now() - startTime;
      return message.reply(`⚡ Pong ! Réponse de ${botName} en ${latency} ms.`);
    }

    // Par défaut : affichage statut
    let heureKinshasa = "";
    try {
      heureKinshasa = new Date().toLocaleTimeString("fr-FR", {
        timeZone: "Africa/Kinshasa",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch (_) {
      heureKinshasa = new Date().toISOString();
    }

    let antiKickText = "N/A";
    let antiSpamText = "N/A";

    if (event.threadID && threadsData && typeof threadsData.get === "function") {
      try {
        const threadData = (await threadsData.get(event.threadID)) || {};
        const settings = threadData.settings || {};
        if (typeof settings.antiKick === "boolean") {
          antiKickText = settings.antiKick ? "Activé ✅" : "Désactivé ❌";
        }
        if (typeof settings.antiSpam === "boolean") {
          antiSpamText = settings.antiSpam
            ? `Activé ✅ (${settings.spamCooldownSec || 3}s)`
            : "Désactivé ❌";
        }
      } catch (_) {
        // Ignore si threadsData n'est pas initialisé sur ce thread
      }
    }

    const replyText =
      `╔══════════════════════╗\n` +
      `   ${botName}\n` +
      `╚══════════════════════╝\n` +
      `🇫🇷 Langue : Français\n` +
      `⌨️ Préfixe : ${prefix}\n` +
      `🕒 Kinshasa : ${heureKinshasa}\n` +
      `🛡️ Anti-Kick : ${antiKickText}\n` +
      `⏱️ Anti-Spam : ${antiSpamText}\n\n` +
      `Commandes : ${prefix}ultimatum ping | ${prefix}ultimatum quote`;

    return message.reply(replyText);
  }
};
            
