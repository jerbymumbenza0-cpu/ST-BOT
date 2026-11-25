
module.exports = {
  config: {
    name: "join",
    version: "3.1",
    author: "Kshitiz / ChatGPT",
    countDown: 5,
    role: 5,
    shortDescription: "Join a group",
    longDescription: "Display group information and join a selected group",
    category: "tools",
    guide: {
      en: "{p}join"
    }
  },

  // ================================
  //          ON START
  // ================================

  onStart: async function ({ api, event }) {
    try {
      const threads = await api.getThreadList(100, null, ["INBOX"]);

      if (!threads || threads.length === 0) {
        return api.sendMessage(
          "❌ Aucun groupe trouvé.",
          event.threadID
        );
      }

      // Récupérer les informations détaillées
      const results = await Promise.all(
        threads.map(async (thread) => {
          try {
            const info = await api.getThreadInfo(thread.threadID);

            return {
              ...thread,
              ...info,
              threadID: thread.threadID,
              name:
                info.name ||
                info.threadName ||
                thread.name ||
                thread.threadName ||
                null
            };
          } catch (error) {
            console.error(
              "Erreur groupe " + thread.threadID,
              error
            );

            return thread;
          }
        })
      );

      // Filtrer les groupes
      const groups = results.filter(group => {
        const members = group.participantIDs || [];

        return (
          group.isGroup === true ||
          members.length > 2 ||
          group.isGroupThread === true
        );
      });

      if (groups.length === 0) {
        return api.sendMessage(
          "❌ Aucun groupe accessible trouvé.",
          event.threadID
        );
      }

      // Créer la liste des groupes
      const list = groups.map((group, index) => {
        const name = group.name || "Unknown Group";
        const members = group.participantIDs || [];
        const admins = group.adminIDs || [];

        return (
          `╭━━〔 𝐆𝐑𝐎𝐔𝐏 ${String(index + 1).padStart(2, "0")} 〕\n` +
          `┃ ✦ 𝐍𝐀𝐌𝐄: ${name}\n` +
          `┃\n` +
          `┃ 🆔 𝐓𝐈𝐃: ${group.threadID}\n` +
          `┃ 👥 𝐌𝐄𝐌𝐁𝐄𝐑𝐒: ${members.length || "N/A"}\n` +
          `┃ 👑 𝐀𝐃𝐌𝐈𝐍𝐒: ${admins.length || "N/A"}\n` +
          `╰━━━━━━━━━━━━━━━━━━`
        );
      }).join("\n\n");

      // Message principal
      const message =
        `╔══════════════════════╗\n` +
        `     『 𝐆𝐑𝐎𝐔𝐏 𝐂𝐄𝐍𝐓𝐄𝐑 』\n` +
        `╚══════════════════════╝\n\n` +
        `✧ 𝐒𝐘𝐒𝐓𝐄𝐌: 𝐏𝐑𝐄𝐌𝐈𝐔𝐌\n` +
        `✧ 𝐆𝐑𝐎𝐔𝐏𝐒 𝐅𝐎𝐔𝐍𝐃: ${groups.length}\n` +
        `✧ 𝐒𝐓𝐀𝐓𝐔𝐒: 𝐎𝐍𝐋𝐈𝐍𝐄\n\n` +
        `${list}\n\n` +
        `╭─────〔 𝐒𝐄𝐋𝐄𝐂𝐓𝐈𝐎𝐍 〕─────╮\n` +
        `┃ 🎯 Réponds avec le numéro\n` +
        `┃ pour rejoindre le groupe.\n` +
        `┃\n` +
        `┃ ⚡ EXEMPLE: 1\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `       𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 国︱PEDRI ぐ條`;

      const sentMessage = await api.sendMessage(
        message,
        event.threadID
      );

      // Enregistrer les groupes
      global.GoatBot.onReply.set(sentMessage.messageID, {
        commandName: "join",
        messageID: sentMessage.messageID,
        author: event.senderID,
        groups: groups
      });

    } catch (error) {
      console.error("[JOIN ERROR]", error);

      return api.sendMessage(
        `╔═══『 𝐒𝐘𝐒𝐓𝐄𝐌 𝐄𝐑𝐑𝐎𝐑 』═══╗\n\n` +
        `  ❌ Impossible de récupérer les groupes.\n\n` +
        `╚══════════════════════╝`,
        event.threadID
      );
    }
  },

  // ================================
  //          ON REPLY
  // ================================

  onReply: async function ({ api, event, Reply, args }) {
    const { author, groups, messageID } = Reply;

    if (event.senderID !== author) return;

    try {
      const number = parseInt(args[0], 10);

      // Vérifier le numéro
      if (
        !Number.isInteger(number) ||
        number < 1 ||
        number > groups.length
      ) {
        return api.sendMessage(
          `╔═══『 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐒𝐄𝐋𝐄𝐂𝐓𝐈𝐎𝐍 』═══╗\n\n` +
          `  ⚠️ Numéro invalide !\n` +
          `  ✦ Choisis entre 1 et ${groups.length}.\n\n` +
          `╚══════════════════════════╝`,
          event.threadID,
          event.messageID
        );
      }

      const selectedGroup = groups[number - 1];
      const groupID = selectedGroup.threadID;

      // Récupérer les informations du groupe
      const info = await api.getThreadInfo(groupID);

      const participants = (
        info.participantIDs || []
      ).map(String);

      const groupName =
        info.name ||
        selectedGroup.name ||
        "Unknown Group";

      // Vérifier si déjà membre
      if (
        participants.includes(String(event.senderID))
      ) {
        return api.sendMessage(
          `╔═══『 𝐀𝐋𝐑𝐄𝐀𝐃𝐘 𝐈𝐍 』═══╗\n\n` +
          `  ⚠️ Tu es déjà membre !\n\n` +
          `  ✦ 𝐆𝐑𝐎𝐔𝐏: ${groupName}\n` +
          `  ✦ 𝐓𝐈𝐃: ${groupID}\n\n` +
          `╚══════════════════════╝`,
          event.threadID,
          event.messageID
        );
      }

      // Ajouter l'utilisateur au groupe
      await api.addUserToGroup(
        event.senderID,
        groupID
      );

      // Message de réussite
      return api.sendMessage(
        `╔═══『 𝐉𝐎𝐈𝐍 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 』═══╗\n\n` +
        `  ✦ 𝐒𝐓𝐀𝐓𝐔𝐒: 𝐒𝐔𝐂𝐂𝐄𝐒𝐒\n` +
        `  ✦ 𝐆𝐑𝐎𝐔𝐏: ${groupName}\n` +
        `  ✦ 𝐓𝐈𝐃: ${groupID}\n\n` +
        `╚══════════════════════╝\n` +
        `  ⚡ Welcome to the group!`,
        event.threadID,
        event.messageID
      );

    } catch (error) {
      console.error("[JOIN REPLY ERROR]", error);

      return api.sendMessage(
        `╔═══『 𝐉𝐎𝐈𝐍 𝐅𝐀𝐈𝐋𝐄𝐃 』═══╗\n\n` +
        `  ❌ Impossible de rejoindre ce groupe.\n` +
        `  ✦ Vérifie les permissions du groupe.\n` +
        `  ✦ Réessaie plus tard.\n\n` +
        `╚══════════════════════╝`,
        event.threadID,
        event.messageID
      );

    } finally {
      global.GoatBot.onReply.delete(messageID);
    }
  }
};
                              
