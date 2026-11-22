
const fs = require("fs");
const path = require("path");

const BOT_NAME = "꧁༺ GOAT-PEDRO ༻꧂";
const BOT_AUTHOR = "国︱PEDRI ぐ條";

module.exports = {
	config: {
		name: "help",
		version: "2.4.75",
		role: 0,
		countDown: 0,
		author: BOT_AUTHOR,
		description: "Affiche toutes les commandes disponibles et leurs catégories.",
		category: "aide"
	},

	ST: async ({ api, event, args }) => {
		const cmdsFolderPath = __dirname;
		const files = fs.readdirSync(cmdsFolderPath).filter(file => file.endsWith(".js"));

		const sendMessage = async (message, threadID, messageID = null) => {
			try {
				return await api.sendMessage(message, threadID, messageID);
			} catch (error) {
				console.error("Erreur d'envoi :", error);
			}
		};

		const getCategories = () => {
			const categories = {};
			for (const file of files) {
				try {
					const command = require(path.join(cmdsFolderPath, file));
					if (!command.config) continue;
					const category = command.config.category || "Sans catégorie";
					if (!categories[category]) categories[category] = [];
					categories[category].push(command.config);
				} catch (error) {}
			}
			return categories;
		};

		const getDetails = (command) => {
			let details = `╭─────────────────────◊\n`;
			details += `│  🔹 DÉTAILS DE LA COMMANDE\n`;
			details += `├─────────────────────◊\n`;
			details += `│ ⚡ Nom : ${command.config.name}\n`;
			details += `│ 📝 Version : ${command.config.version || "N/A"}\n`;
			details += `│ 👤 Auteur : ${command.config.author || BOT_AUTHOR}\n`;
			details += `│ 🔐 Rôle : ${command.config.role ?? "N/A"}\n`;
			details += `│ 📂 Catégorie : ${command.config.category || "Sans catégorie"}\n`;
			details += `│ 💎 Premium : ${command.config.premium ? "✅ Requis" : "❌ Non requis"}\n`;
			details += `│ 🔧 Préfixe : ${command.config.usePrefix === undefined ? "⚙️ Réglage global" : command.config.usePrefix ? "✅ Requis" : "❌ Non requis"}\n`;

			if (command.config.aliases?.length)
				details += `│ 🔄 Alias : ${command.config.aliases.join(", ")}\n`;

			if (command.config.countDown !== undefined)
				details += `│ ⏱️ Délai : ${command.config.countDown}s\n`;

			if (command.config.unsend !== undefined && command.config.unsend !== null)
				details += `│ 🗑️ Suppression automatique : ${command.config.unsend}s\n`;

			details += `├─────────────────────◊\n`;

			if (command.config.description) {
				const desc = typeof command.config.description === "string"
					? command.config.description
					: command.config.description.fr || command.config.description.en || "Aucune description disponible";
				details += `│ 📋 Description :\n│ ${desc}\n├─────────────────────◊\n`;
			}

			const guide = command.config.guide;
			const guideText = typeof guide === "string"
				? guide
				: guide?.fr || guide?.en || "Aucun guide disponible";

			details += `│ 📚 Guide d'utilisation :\n│ ${guideText.replace(/{pn}/g, `!${command.config.name}`)}\n`;
			details += `╰─────────────────────◊\n`;
			details += `     💫 ${BOT_NAME}`;

			return details;
		};

		try {
			if (args[0] && !/^\d+$/.test(args[0])) {
				const commandName = args[0].toLowerCase();

				const command = files.map(file => {
					try {
						return require(path.join(cmdsFolderPath, file));
					} catch {
						return null;
					}
				}).filter(cmd => cmd?.config).find(cmd =>
					cmd.config.name.toLowerCase() === commandName ||
					(cmd.config.aliases || []).includes(commandName)
				);

				if (command)
					return sendMessage(getDetails(command), event.threadID);

				return sendMessage(`❌ Commande introuvable : ${commandName}`, event.threadID);
			}

			const categories = getCategories();
			const categoryNames = Object.keys(categories).sort();

			let help = `╭────────────────────────◊\n`;
			help += `│       📋 CATÉGORIES DES COMMANDES\n`;
			help += `├────────────────────────◊\n`;

			categoryNames.forEach((category, index) => {
				help += `│ ${index + 1}. ${category}\n`;
				help += `│    └─ ${categories[category].length} commande(s)\n`;
			});

			help += `├────────────────────────◊\n`;
			help += `│ 💡 Réponds avec le numéro d'une catégorie\n`;
			help += `│ 💡 Écris !help <nom> pour les détails\n`;
			help += `╰────────────────────────◊\n`;
			help += `       💫 ${BOT_NAME}`;

			const sent = await sendMessage(help, event.threadID);

			if (sent) {
				global.GoatBot.onReply.set(sent.messageID, {
					commandName: "help",
					messageID: sent.messageID,
					author: event.senderID,
					stage: 1,
					categories: categoryNames,
					categoriesData: categories
				});
			}
		} catch (error) {
			console.error("Erreur help :", error);
			await sendMessage("❌ Une erreur est survenue lors de l'affichage du menu.", event.threadID);
		}
	},

	onReply: async ({ api, event, Reply }) => {
		if (Reply.author != event.senderID)
			return api.sendMessage("❌ Ce menu ne t'est pas destiné.", event.threadID, event.messageID);

		const choice = parseInt(event.body.trim());

		try {
			if (Reply.stage === 1) {
				if (isNaN(choice) || choice < 1 || choice > Reply.categories.length)
					return api.sendMessage(`❌ Choix invalide. Réponds avec un nombre entre 1 et ${Reply.categories.length}.`, event.threadID, event.messageID);

				const category = Reply.categories[choice - 1];
				const commands = Reply.categoriesData[category].sort((a, b) => a.name.localeCompare(b.name));

				let msg = `╭────────────────────────◊\n`;
				msg += `│ 📂 COMMANDES : ${category.toUpperCase()}\n`;
				msg += `├────────────────────────◊\n`;

				commands.forEach((cmd, index) => {
					msg += `│ ${index + 1}. ${cmd.name}\n`;
				});

				msg += `├────────────────────────◊\n`;
				msg += `│ 💡 Réponds avec le numéro d'une commande\n`;
				msg += `│ 💡 Réponds 0 pour revenir aux catégories\n`;
				msg += `╰────────────────────────◊\n`;
				msg += `Total : ${commands.length} commande(s)`;

				global.GoatBot.onReply.delete(Reply.messageID);
				try { await api.unsendMessage(Reply.messageID); } catch {}

				const sent = await api.sendMessage(msg, event.threadID);

				if (sent) {
					global.GoatBot.onReply.set(sent.messageID, {
						commandName: "help",
						messageID: sent.messageID,
						author: event.senderID,
						stage: 2,
						commands,
						selectedCategory: category,
						parentCategories: Reply.categories,
						parentCategoriesData: Reply.categoriesData
					});
				}
			}

			else if (Reply.stage === 2) {
				if (choice === 0) {
					global.GoatBot.onReply.delete(Reply.messageID);
					try { await api.unsendMessage(Reply.messageID); } catch {}

					let msg = `╭────────────────────────◊\n`;
					msg += `│ 📋 CATÉGORIES DES COMMANDES\n`;
					msg += `├────────────────────────◊\n`;

					Reply.parentCategories.forEach((category, index) => {
						msg += `│ ${index + 1}. ${category}\n`;
						msg += `│    └─ ${Reply.parentCategoriesData[category].length} commande(s)\n`;
					});

					msg += `├────────────────────────◊\n`;
					msg += `│ 💡 Réponds avec un numéro de catégorie\n`;
					msg += `╰────────────────────────◊\n`;
					msg += `       💫 ${BOT_NAME}`;

					const sent = await api.sendMessage(msg, event.threadID);

					if (sent) {
						global.GoatBot.onReply.set(sent.messageID, {
							commandName: "help",
							messageID: sent.messageID,
							author: event.senderID,
							stage: 1,
							categories: Reply.parentCategories,
							categoriesData: Reply.parentCategoriesData
						});
					}
					return;
				}

				if (isNaN(choice) || choice < 1 || choice > Reply.commands.length)
					return api.sendMessage(`❌ Choix invalide. Réponds entre 1 et ${Reply.commands.length}, ou 0 pour revenir.`, event.threadID, event.messageID);

				const selected = Reply.commands[choice - 1];
				global.GoatBot.onReply.delete(Reply.messageID);
				try { await api.unsendMessage(Reply.messageID); } catch {}

				let fullCommand = null;

				for (const file of fs.readdirSync(__dirname).filter(file => file.endsWith(".js"))) {
					try {
						const cmd = require(path.join(__dirname, file));
						if (cmd.config?.name.toLowerCase() === selected.name.toLowerCase()) {
							fullCommand = cmd;
							break;
						}
					} catch {}
				}

				if (!fullCommand)
					fullCommand = { config: selected };

				return api.sendMessage(getDetails(fullCommand), event.threadID);
			}
		} catch (error) {
			console.error("Erreur de navigation help :", error);
			return api.sendMessage("❌ Une erreur est survenue.", event.threadID, event.messageID);
		}
	}
};
		
