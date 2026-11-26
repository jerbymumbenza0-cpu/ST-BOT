module.exports = {
	config: {
		name: "give",
		aliases: ["pay", "transfer"],
		version: "1.0",
		author: "PEDRI",
		countDown: 5,
		role: 0,
		description: {
			en: "Transfer money from your balance to another user",
			fr: "Transférer de l'argent de votre solde vers un autre utilisateur"
		},
		category: "economy",
		guide: {
			en: "   {pn} <amount> [@tag | userID | reply]\n   Example:\n   {pn} 500 @user\n   {pn} 1000 (reply to a message)",
			fr: "   {pn} <montant> [@mention | ID | répondre à un message]\n   Exemple :\n   {pn} 500 @utilisateur\n   {pn} 1000 (en répondant au message de la personne)"
		}
	},

	langs: {
		en: {
			noTarget: "⚠️ Please mention someone, provide a user ID, or reply to a message to transfer money.",
			cannotSelf: "⚠️ You cannot transfer money to yourself.",
			invalidAmount: "⚠️ Please enter a valid positive number for the amount.",
			notEnoughMoney: "⚠️ Insufficient balance! You only have %1$.",
			transferSuccess: "✅ Transferred %1$ to %2%!\n💰 Your new balance: %3$."
		},
		fr: {
			noTarget: "⚠️ Mentionnez quelqu'un, indiquez un ID ou répondez au message de la personne à qui envoyer de l'argent.",
			cannotSelf: "⚠️ Vous ne pouvez pas vous transférer de l'argent à vous-même.",
			invalidAmount: "⚠️ Veuillez entrer un montant valide supérieur à 0.",
			notEnoughMoney: "⚠️ Solde insuffisant ! Vous n'avez que %1$.",
			transferSuccess: "✅ Transfert de %1$ effectué vers %2% !\n💰 Votre nouveau solde : %3$."
		}
	},

	onStart: async function ({ message, event, args, usersData, getLang }) {
		const { senderID, messageReply, mentions } = event;

		// Déterminer le destinataire : réponse > mention > ID dans les arguments
		let targetID = null;

		if (messageReply) {
			targetID = messageReply.senderID;
		} else if (mentions && Object.keys(mentions).length > 0) {
			targetID = Object.keys(mentions)[0];
		} else if (args[1] && /^\d+$/.test(args[1])) {
			targetID = args[1];
		} else if (args[0] && /^\d+$/.test(args[0]) && args[1] && !isNaN(args[1])) {
			targetID = args[0];
		}

		if (!targetID) {
			return message.reply(getLang("noTarget"));
		}

		if (String(targetID) === String(senderID)) {
			return message.reply(getLang("cannotSelf"));
		}

		// Extraire le montant (souvent args[0], ou args[1] si l'ID était en args[0])
		let rawAmount = args[0];
		if (String(rawAmount) === String(targetID)) {
			rawAmount = args[1];
		}

		const amount = Math.floor(Number(rawAmount));
		if (!rawAmount || isNaN(amount) || !isFinite(amount) || amount <= 0) {
			return message.reply(getLang("invalidAmount"));
		}

		// Récupérer les données des deux utilisateurs
		const senderData = await usersData.get(senderID);
		const targetData = await usersData.get(targetID);

		if (!senderData || !targetData) {
			return message.reply(getLang("noTarget"));
		}

		const senderMoney = senderData.money || 0;
		if (senderMoney < amount) {
			return message.reply(getLang("notEnoughMoney", senderMoney));
		}

		// Effectuer le transfert
		const newSenderMoney = senderMoney - amount;
		const newTargetMoney = (targetData.money || 0) + amount;

		await usersData.set(senderID, { money: newSenderMoney });
		await usersData.set(targetID, { money: newTargetMoney });

		const targetName = targetData.name || targetID;

		return message.reply(
			getLang("transferSuccess", amount, targetName, newSenderMoney)
		);
	}
};
        
