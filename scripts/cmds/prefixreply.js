module.exports = {
	config: {
		name: "prefixreply",
		version: "1.0.0",
		author: "国︱PEDRI ぐ條",
		countDown: 5,
		role: 0,
		shortDescription: "Répond quand on tape uniquement le préfixe",
		longDescription: "Envoie un message stylé si quelqu'un écrit juste le préfixe du bot",
		category: "system"
	},

	onStart: async function () {
		// Rien à faire ici, tout se passe dans onChat
	},

	onChat: async function ({ event, message }) {
		if (!event.body) return;

		const prefix = global.utils.getPrefix(event.threadID);
		const body = event.body.trim();

		if (body === prefix) {
			return message.reply(
				`╭━━━━━━━━━━━━━━━━━━━━━━╮\n` +
				`📡 Prefix détecté : ${prefix}\n` +
				`╰━━━━━━━━━━━━━━━━━━━━━━╯\n` +
				`┏━━ ⚡ SYSTEM READY ━━┓\n` +
				`┃ ✦ Aide : tape ${prefix}help\n` +
				`┃ ✦ Statut : en ligne\n` +
				`┗━━━━━━━━━━━━━━━━━━━━┛\n` +
				`━━━━━━━━━━━━━━━┛\n` +
				`➤ Tape ${prefix}help pour voir toutes les commandes !`
			);
		}
	}
};
