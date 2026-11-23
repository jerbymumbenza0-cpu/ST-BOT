
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "prefix",
    aliases: ["setprefix"],
    version: "2.0",
    author: "国︱PEDRI ぐ條",
    countDown: 5,
    role: 0,
    description: {
      en: "Manage the bot prefix"
    },
    category: "system",
    guide: {
      en:
        "╭━━━『 PREFIX MANAGER 』\n" +
        "┃ {pn} <symbol>\n" +
        "┃ Change the prefix in this group.\n" +
        "┃ Example: {pn} #\n" +
        "┃\n" +
        "┃ {pn} <symbol> -g\n" +
        "┃ Change the global prefix (Admin).\n" +
        "┃ Example: {pn} ! -g\n" +
        "┃\n" +
        "┃ {pn} reset\n" +
        "┃ Restore the default group prefix.\n" +
        "┃\n" +
        "┃ {pn} refresh\n" +
        "┃ Reload the group prefix cache.\n" +
        "┃\n" +
        "┃ {pn}\n" +
        "┃ Display current prefix settings.\n" +
        "╰━━━━━━━━━━━━━━━━"
    }
  },

  onStart: async function ({
    message, role, args, commandName,
    event, threadsData, usersData
  }) {
    const globalPrefix = global.GoatBot.config.prefix;
    const userName =
      await usersData.getName(event.senderID) || "User";

    const replyInfo = async (title, groupPrefix) => {
      return message.reply({
        body:
          `╭━━━〔 SYSTEM PREFIX 〕━━━╮\n` +
          `┃ 👤 User: ${userName}\n` +
          `┃ 🌍 Global: ${globalPrefix}\n` +
          `┃ 💬 Group: ${groupPrefix}\n` +
          `╰━━━━━━━━━━━━━━━━━━╯\n` +
          `✦ ${title}\n` +
          `⚡ Powered by 国︱PEDRI ぐ條`,
        mentions: [{
          id: event.senderID,
          tag: userName
        }]
      });
    };

    if (!args[0]) {
      const groupPrefix =
        await threadsData.get(event.threadID, "data.prefix")
        || globalPrefix;

      return replyInfo(
        `Use ${groupPrefix}help to explore my commands.`,
        groupPrefix
      );
    }

    if (args[0] === "reset") {
      await threadsData.set(event.threadID, null, "data.prefix");

      return replyInfo(
        "The group prefix has returned to its default value.",
        globalPrefix
      );
    }

    if (args[0] === "refresh") {
      try {
        const threadID = event.threadID;

        if (threadsData.cache?.[threadID]) {
          delete threadsData.cache[threadID].data?.prefix;
        }

        const refreshed =
          await threadsData.get(threadID, "data.prefix")
          || globalPrefix;

        return replyInfo(
          "Prefix cache successfully reloaded.",
          refreshed
        );
      } catch (error) {
        return message.reply(
          "⚠️ Unable to reload the prefix cache."
        );
      }
    }

    const newPrefix = args[0];
    const setGlobal = args[1] === "-g";

    if (!newPrefix || newPrefix.length > 10) {
      return message.reply(
        "⚠️ Invalid prefix. Please use a symbol or a short text."
      );
    }

    if (setGlobal && role < 2) {
      return message.reply(
        "🔒 Access denied. Administrator permission is required."
      );
    }

    const currentPrefix = await threadsData.get(
      event.threadID,
      "data.prefix"
    ) || globalPrefix;

    const confirmation = setGlobal
      ? `╭━━━〔 GLOBAL CONFIGURATION 〕━━━╮\n` +
        `┃ Current: ${globalPrefix}\n` +
        `┃ Requested: ${newPrefix}\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━╯\n` +
        `⚠️ React to this message to authorize the change.`
      : `╭━━━〔 GROUP CONFIGURATION 〕━━━╮\n` +
        `┃ Current: ${currentPrefix}\n` +
        `┃ Requested: ${newPrefix}\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━╯\n` +
        `🔧 React to approve this modification.`;

    return message.reply(confirmation, (err, info) => {
      if (err) return;

      global.GoatBot.onReaction.set(info.messageID, {
        author: event.senderID,
        newPrefix,
        setGlobal,
        commandName
      });
    });
  },

  onReaction: async function ({
    message, event, Reaction, threadsData, usersData
  }) {
    const { author, newPrefix, setGlobal } = Reaction;

    if (event.userID !== author) return;

    const userName =
      await usersData.getName(event.userID) || "User";

    if (setGlobal) {
      try {
        global.GoatBot.config.prefix = newPrefix;

        const configPath =
          global.client.dirConfig ||
          path.join(process.cwd(), "config.json");

        fs.writeFileSync(
          configPath,
          JSON.stringify(global.GoatBot.config, null, 2)
        );

        return message.reply(
          `╭━━━〔 UPDATE COMPLETE 〕━━━╮\n` +
          `┃ 🌍 Global prefix: ${newPrefix}\n` +
          `┃ 👤 Authorized by: ${userName}\n` +
          `╰━━━━━━━━━━━━━━━━━━╯\n` +
          `⚡ 国︱PEDRI ぐ條`
        );
      } catch (error) {
        return message.reply(
          "❌ Configuration could not be saved."
        );
      }
    }

    try {
      await threadsData.set(
        event.threadID,
        newPrefix,
        "data.prefix"
      );

      return message.reply(
        `╭━━━〔 GROUP UPDATED 〕━━━╮\n` +
        `┃ 💬 New prefix: ${newPrefix}\n` +
        `┃ 👤 Modified by: ${userName}\n` +
        `╰━━━━━━━━━━━━━━━━━━╯\n` +
        `⚡ 国︱PEDRI ぐ條`
      );
    } catch (error) {
      return message.reply(
        "❌ Database error: the group prefix was not saved."
      );
    }
  },

  onChat: async function ({
    event, message, threadsData, usersData
  }) {
    const triggerText = event.body?.toLowerCase().trim();

    if (!triggerText) return;

    const triggers = [
      "prefix",
      "my prefix",
      "bot prefix"
    ];

    if (!triggers.includes(triggerText)) return;

    const userName =
      await usersData.getName(event.senderID) || "User";

    const globalPrefix = global.GoatBot.config.prefix;

    const groupPrefix =
      await threadsData.get(event.threadID, "data.prefix")
      || globalPrefix;

    return message.reply({
      body:
        `╭━━━〔 MY PREFIX 〕━━━╮\n` +
        `┃ 🌍 Global: ${globalPrefix}\n` +
        `┃ 💬 This group: ${groupPrefix}\n` +
        `╰━━━━━━━━━━━━━━━━╯\n` +
        `✦ Need commands? Type ${groupPrefix}help\n` +
        `⚡ 国︱PEDRI ぐ條`,
      mentions: [{
        id: event.senderID,
        tag: userName
      }]
    });
  }
};
