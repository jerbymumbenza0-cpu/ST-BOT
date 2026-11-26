module.exports = {
  config: {
    name: "listbox",
    aliases: [],
    author: "Aminul Sardar",
    version: "2.2",
    cooldowns: 5,
    role: 2,
    shortDescription: {
      en: "List all group chats the bot is in."
    },
    longDescription: {
      en: "Use this command to list all group chats the bot is currently in."
    },
    category: "owner",
    guide: {
      en: "{p}{n}\n{p}{n} leave [number]\n{p}{n} leave all"
    }
  },

  onStart: async function ({ api, event, args, threadsData }) {
    try {
      const threadList = await api.getThreadList(100, null, ['INBOX']);
      const rawGroups = threadList.filter(thread => thread.isGroup === true);

      const groupList = await Promise.all(
        rawGroups.map(async (group) => {
          let dbThread = {};
          if (threadsData) {
            try {
              dbThread = (await threadsData.get(group.threadID)) || {};
            } catch (_) {
              dbThread = {};
            }
          }

          const resolvedName =
            group.name ||
            group.threadName ||
            dbThread.threadName ||
            dbThread.name ||
            `Group ${group.threadID}`;

          const memberCount = Array.isArray(group.participantIDs)
            ? group.participantIDs.length
            : (Array.isArray(dbThread.members) ? dbThread.members.length : null);

          return {
            threadID: group.threadID,
            threadName: resolvedName,
            memberCount
          };
        })
      );

      if (args[0] === "leave" && args[1] === "all") {
        if (groupList.length === 0) {
          return await api.sendMessage('⚠️ No active group chats found.', event.threadID);
        }

        for (const group of groupList) {
          await api.removeUserFromGroup(api.getCurrentUserID(), group.threadID);
          await api.sendMessage(`🚪 Left **${group.threadName}** (\`${group.threadID}\`).`, event.threadID);
        }

        await api.sendMessage('✅ Successfully left all group chats.', event.threadID);
        return;
      }

      if (args[0] === "leave") {
        if (!args[1] || isNaN(args[1])) {
          return await api.sendMessage('⚠️ Please provide a valid group number.', event.threadID);
        }

        const groupIndex = parseInt(args[1], 10) - 1;
        if (groupIndex < 0 || groupIndex >= groupList.length) {
          return await api.sendMessage('⚠️ Group number out of range.', event.threadID);
        }

        const groupToRemove = groupList[groupIndex];
        await api.removeUserFromGroup(api.getCurrentUserID(), groupToRemove.threadID);
        await api.sendMessage(`🚪 Bot has left **${groupToRemove.threadName}**!`, event.threadID);
        return;
      }

      if (groupList.length === 0) {
        await api.sendMessage('✨ No group chats connected right now.', event.threadID);
      } else {
        const totalMembers = groupList.reduce(
          (sum, group) => sum + (typeof group.memberCount === "number" ? group.memberCount : 0),
          0
        );

        const formattedList = groupList.map((group, index) => {
          const badge = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;
          const membersLine = group.memberCount !== null
            ? `\n┃  👥 𝐌𝐞𝐦𝐛𝐞𝐫𝐬 : ${group.memberCount}`
            : "";
          return (
            `┣━━〔 #${badge} 〕━━\n` +
            `┃  🏷️ 𝐍𝐚𝐦𝐞    : ${group.threadName}\n` +
            `┃  🆔 𝐓𝐈𝐃     : ${group.threadID}${membersLine}`
          );
        });

        const msg =
          `╭───✦ 𝐆𝐑𝐎𝐔𝐏 𝐍𝐄𝐓𝐖𝐎𝐑𝐊 ✦───╮\n` +
          `┃  🌐 𝐆𝐫𝐨𝐮𝐩𝐬  : ${groupList.length}\n` +
          `┃  🔥 𝐑𝐞𝐚𝐜𝐡   : ${totalMembers} members\n` +
          `${formattedList.join("\n")}\n` +
          `╰───────────────────────╯\n` +
          `💡 Tip: Use "listbox leave [#]" or "listbox leave all"`;

        await api.sendMessage(msg, event.threadID);
      }
    } catch (error) {
      console.error("Error listing or removing group chats", error);
      await api.sendMessage("❌ An error occurred while fetching group chats.", event.threadID);
    }
  }
};
                      
