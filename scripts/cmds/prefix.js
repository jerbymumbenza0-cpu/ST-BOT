
const fs = require("fs-extra");
const { utils } = global;

module.exports = {
	config: {
		name: "prefix",
		version: "1.4",
		author: "国︱PEDRI ぐ條",
		countDown: 5,
		role: 0,
		description: "Permet de changer le préfixe du bot dans un groupe ou dans tout le système.",
		category: "config",
		guide: {
			fr: "   {pn} <nouveau préfixe> : changer le préfixe de votre groupe"
				+ "\n   Exemple :"
				+ "\n    {pn} #"
				+ "\n\n   {pn} <nouveau préfixe> -g : changer le préfixe global (administrateur uniquement)"
				+ "\n   Exemple :"
				+ "\n    {pn} # -g"
				+ "\n\n   {pn} reset : réinitialiser le préfixe de votre groupe"
		}
	},

	langs: {
		fr: {
			reset: "Votre préfixe a été réinitialisé : %1",
			onlyAdmin: "Seul l'administrateur peut changer le préfixe global du bot.",
			confirmGlobal: "Veuillez réagir à ce message pour confirmer le changement du préfixe global.",
			confirmThisThread: "Veuillez réagir à ce message pour confirmer le changement du préfixe de votre groupe.",
			successGlobal: "Le préfixe global du bot a été changé en : %1",
			successThisThread: "Le préfixe de votre groupe a été changé en : %1",
			myPrefix: "🌐 Préfixe global du bot : %1\n🛸 Préfixe de votre groupe : %2"
		}
	},

	onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
		if (!args[0])
			return message.SyntaxError();

		if (args[0] == 'reset') {
			await threadsData.set(event.threadID, null, "data.prefix");
			return message.reply(getLang("reset", global.GoatBot.config.prefix));
		}

		const newPrefix = args[0];
		const formSet = {
			commandName,
			author: event.senderID,
			newPrefix
		};

		if (args[1] === "-g")
			if (role < 2)
				return message.reply(getLang("onlyAdmin"));
			else
				formSet.setGlobal = true;
		else
			formSet.setGlobal = false;

		return message.reply(args[1] === "-g" ? getLang("confirmGlobal") : getLang("confirmThisThread"), (err, info) => {
			formSet.messageID = info.messageID;
			global.GoatBot.onReaction.set(info.messageID, formSet);
		});
	},

	onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
		const { author, newPrefix, setGlobal } = Reaction;
		if (event.userID !== author)
			return;
		if (setGlobal) {
			global.GoatBot.config.prefix = newPrefix;
			fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			return message.reply(getLang("successGlobal", newPrefix));
		}
		else {
			await threadsData.set(event.threadID, newPrefix, "data.prefix");
			return message.reply(getLang("successThisThread", newPrefix));
		}
	},

	onChat: async function ({ event, message, getLang }) {
		if (event.body && event.body.toLowerCase() === "prefix")
			return () => {
				return message.reply(getLang("myPrefix", global.GoatBot.config.prefix, utils.getPrefix(event.threadID)));
			};
	}
};
										  
