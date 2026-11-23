
module.exports.config = {
  name: "accept",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "国︱PEDRI ぐ條",
  description: "Gérer les demandes d'amis Facebook",
  commandCategory: "Admin",
  usages: "accept | accept 1 | accept all",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  try {
    // Récupérer les demandes d'amis
    const requests = await new Promise((resolve, reject) => {
      api.getFriendRequests((err, data) => {
        if (err) return reject(err);
        resolve(data || []);
      });
    });

    if (!requests.length) {
      return api.sendMessage(
        "✅ Aucune demande d'ami en attente.",
        event.threadID
      );
    }

    // Accepter toutes les demandes
    if (args[0] === "all") {
      for (const request of requests) {
        await api.handleFriendRequest(request.userID, true);
      }

      return api.sendMessage(
        `✅ ${requests.length} demande(s) acceptée(s).`,
        event.threadID
      );
    }

    // Accepter une demande précise
    if (args[0]) {
      const index = parseInt(args[0], 10) - 1;

      if (isNaN(index) || !requests[index]) {
        return api.sendMessage(
          "❌ Numéro de demande invalide.",
          event.threadID
        );
      }

      await api.handleFriendRequest(requests[index].userID, true);

      return api.sendMessage(
        `✅ Demande numéro ${index + 1} acceptée.`,
        event.threadID
      );
    }

    // Afficher la liste
    let message = "📩 LISTE DES DEMANDES D'AMIS\n\n";

    requests.forEach((request, index) => {
      message += `${index + 1}. ${request.fullName || request.userID}\n`;
    });

    message += "\n━━━━━━━━━━━━━━";
    message += "\nPour accepter : accept 1";
    message += "\nPour tout accepter : accept all";

    return api.sendMessage(message, event.threadID);

  } catch (error) {
    console.error(error);
    return api.sendMessage(
      "❌ Erreur : impossible de récupérer ou traiter les demandes.",
      event.threadID
    );
  }
};
    
