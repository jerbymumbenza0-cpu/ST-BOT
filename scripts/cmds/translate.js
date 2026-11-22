
const axios = require('axios');
const defaultEmojiTranslate = "🌐";

module.exports = {
	config: {
		name: "translate",
		aliases: ["trans", "traduire"],
		version: "1.5",
		author: "国︱PEDRI ぐ條",
		countDown: 5,
		role: 0,
		description: {
			fr: "Traduire un texte dans la langue souhaitée"
		},
		category: "utilitaire",
		guide: {
			fr: "   {pn} <texte> : Traduire un texte dans la langue du groupe ou la langue par défaut du bot"
				+ "\n   {pn} <texte> -> <code ISO 639-1> : Traduire un texte dans la langue souhaitée"
				+ "\n   Vous pouvez également répondre à un message pour traduire son contenu."
				+ "\n   Exemples :"
				+ "\n    {pn} hello -> fr"
				+ "\n    {pn} bonjour -> en"
				+ "\n   {pn} -r [on | off] : Activer ou désactiver la traduction automatique lorsqu'une personne réagit à un message."
				+ "\n   {pn} -r set <emoji> : Définir l'emoji qui déclenchera la traduction automatique dans le groupe."
		}
	},

	langs: {
		fr: {
			translateTo: "🌐 Traduction de %1 vers %2",
			invalidArgument: "❌ Argument invalide ! Veuillez choisir « on » ou « off ».",
			turnOnTransWhenReaction: `✅ La traduction automatique par réaction est activée ! Réagissez avec l'emoji "${defaultEmojiTranslate}" à un message pour le traduire (les messages du bot ne sont pas pris en charge).\nSeuls les messages envoyés après l'activation de cette fonctionnalité pourront être traduits.`,
			turnOffTransWhenReaction: "✅ La traduction automatique par réaction a été désactivée.",
			inputEmoji: "🌀 Réagissez à ce message avec l'emoji que vous souhaitez utiliser pour déclencher la traduction automatique.",
			emojiSet: "✅ L'emoji de traduction a été défini sur : %1"
		}
	},

	onStart: async function ({ message, event, args, threadsData, getLang, commandName }) {
		if (["-r", "-react", "-reaction"].includes(args[0])) {
			if (args[1] == "set") {
				return message.reply(getLang("inputEmoji"), (err, info) =>
					global.GoatBot.onReaction.set(info.messageID, {
						type: "setEmoji",
						commandName,
						messageID: info.messageID,
						authorID: event.senderID
					})
				);
			}

			const isEnable = args[1] == "on" ? true : args[1] == "off" ? false : null;

			if (isEnable == null)
				return message.reply(getLang("invalidArgument"));

			await threadsData.set(event.threadID, isEnable, "data.translate.autoTranslateWhenReaction");

			return message.reply(
				isEnable
					? getLang("turnOnTransWhenReaction")
					: getLang("turnOffTransWhenReaction")
			);
		}

		const { body = "" } = event;
		let content;
		let langCodeTrans;

		const langOfThread = await threadsData.get(event.threadID, "data.lang") || global.GoatBot.config.language;

		if (event.messageReply) {
			content = event.messageReply.body;

			let lastIndexSeparator = body.lastIndexOf("->");

			if (lastIndexSeparator == -1)
				lastIndexSeparator = body.lastIndexOf("=>");

			if (lastIndexSeparator != -1 && (body.length - lastIndexSeparator == 4 || body.length - lastIndexSeparator == 5))
				langCodeTrans = body.slice(lastIndexSeparator + 2).trim();
			else if ((args[0] || "").match(/\w{2,3}/))
				langCodeTrans = args[0].match(/\w{2,3}/)[0];
			else
				langCodeTrans = langOfThread;
		}
		else {
			content = event.body;

			let lastIndexSeparator = content.lastIndexOf("->");

			if (lastIndexSeparator == -1)
				lastIndexSeparator = content.lastIndexOf("=>");

			if (lastIndexSeparator != -1 && (content.length - lastIndexSeparator == 4 || content.length - lastIndexSeparator == 5)) {
				langCodeTrans = content.slice(lastIndexSeparator + 2).trim();
				content = content.slice(content.indexOf(args[0]), lastIndexSeparator).trim();
			}
			else
				langCodeTrans = langOfThread;
		}

		if (!content)
			return message.SyntaxError();

		translateAndSendMessage(content, langCodeTrans, message, getLang);
	},

	onChat: async ({ event, threadsData }) => {
		if (!await threadsData.get(event.threadID, "data.translate.autoTranslateWhenReaction"))
			return;

		global.GoatBot.onReaction.set(event.messageID, {
			commandName: 'translate',
			messageID: event.messageID,
			body: event.body,
			type: "translate"
		});
	},

	onReaction: async ({ message, Reaction, event, threadsData, getLang }) => {
		switch (Reaction.type) {
			case "setEmoji": {
				if (event.userID != Reaction.authorID)
					return;

				const emoji = event.reaction;

				if (!emoji)
					return;

				await threadsData.set(event.threadID, emoji, "data.translate.emojiTranslate");

				return message.reply(getLang("emojiSet", emoji), () => message.unsend(Reaction.messageID));
			}

			case "translate": {
				const emojiTrans = await threadsData.get(event.threadID, "data.translate.emojiTranslate") || "🌐";

				if (event.reaction == emojiTrans) {
					const langCodeTrans = await threadsData.get(event.threadID, "data.lang") || global.GoatBot.config.language;
					const content = Reaction.body;

					Reaction.delete();

					translateAndSendMessage(content, langCodeTrans, message, getLang);
				}
			}
		}
	}
};

async function translate(text, langCode) {
	const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`);

	return {
		text: res.data[0].map(item => item[0]).join(''),
		lang: res.data[2]
	};
}

async function translateAndSendMessage(content, langCodeTrans, message, getLang) {
	const { text, lang } = await translate(content.trim(), langCodeTrans.trim());

	return message.reply(`${text}\n\n${getLang("translateTo", lang, langCodeTrans)}`);
				}
