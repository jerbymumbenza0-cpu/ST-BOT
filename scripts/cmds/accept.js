module.exports = {
  config: {
    name: "accept",
    aliases: ["acceptfriend"],
    version: "2.0.0",
    author: "国︱PEDRI ぐ條",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Manage friend requests",
      fr: "Gérer les demandes d'amis"
    },
    longDescription: {
      en: "List and accept friend requests",
      fr: "Afficher et accepter les demandes d'amis"
    },
    category: "owner",
    guide: {
      en: "{pn} - List requests\n{pn} all - Accept all"
    }
  },

  onStart: async function ({ api, event, args, commandName }) {
    if (!global.GoatBot.friendRequests)
      global.GoatBot.friendRequests = new Map();

    const requests = [...global.GoatBot.friendRequests.values()];

    if (!requests.length)
      return api.sendMessage(
        "📭 Aucune nouvelle demande capturée.\nLe bot doit rester connecté pour détecter les nouvelles demandes.",
        event.threadID
      );

    if (args[0] === "all") {
      return acceptRequests(api, requests, event.threadID);
    }

    const index = Number(args[0]);

    if (args[0]) {
      if (!Number.isInteger(index) || index < 1 || index > requests.length)
        return api.sendMessage("❌ Numéro invalide.", event.threadID);

      return acceptRequests(api, [requests[index - 1]], event.threadID);
    }

    let msg = "📩 DEMANDES D'AMIS\n━━━━━━━━━━━━━━\n";

    requests.forEach((r, i) => {
      msg += `\n${i + 1}. ${r.name || r.userID}`;
    });

    msg += "\n\n━━━━━━━━━━━━━━";
    msg += "\nRéponds avec un numéro pour accepter.";
    msg += "\nÉcris all pour tout accepter.";
    msg += "\nÉcris cancel pour annuler.";

    return api.sendMessage(msg, event.threadID, (err, info) => {
      if (err || !info) return;

      global.GoatBot.onReply.set(info.messageID, {
        commandName,
        author: String(event.senderID),
        messageID: info.messageID,
        requests
      });
    });
  },

  onReply: async function ({ api, event, Reply }) {
    if (String(event.senderID) !== String(Reply.author))
      return;

    const answer = String(event.body || "").trim().toLowerCase();

    if (answer === "cancel") {
      global.GoatBot.onReply.delete(Reply.messageID);
      return api.sendMessage("✅ Opération annulée.", event.threadID);
    }

    if (answer === "all") {
      global.GoatBot.onReply.delete(Reply.messageID);
      return acceptRequests(api, Reply.requests, event.threadID);
    }

    const index = Number(answer);

    if (!Number.isInteger(index) || index < 1 || index > Reply.requests.length)
      return api.sendMessage("❌ Numéro invalide.", event.threadID);

    global.GoatBot.onReply.delete(Reply.messageID);

    return acceptRequests(
      api,
      [Reply.requests[index - 1]],
      event.threadID
    );
  }
};

async function acceptRequests(api, requests, threadID) {
  let success = 0;
  let failed = 0;

  for (const request of requests) {
    try {
      await api.handleFriendRequest(String(request.userID), true);
      global.GoatBot.friendRequests.delete(String(request.userID));
      success++;
    } catch (error) {
      console.error("[ACCEPT]", error);
      failed++;
    }
  }

  return api.sendMessage(
    `✅ Acceptées : ${success}\n❌ Échecs : ${failed}`,
    threadID
  );
        }
      
