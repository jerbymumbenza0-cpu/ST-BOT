const { getStreamFromURL, uploadImgbb } = global.utils;

module.exports = {
	config: {
		name: "antichangeinfobox",
		version: "1.9",
		author: "Aminul Sardar",
		countDown: 5,
		role: 0,
		description: {
			fr: "Activer ou désactiver l'anti-changement des infos du groupe"
		},
		category: "box chat",
		guide: {
			fr: "   {pn} avt [on | off] : anti-changement de l'avatar du groupe\n   {pn} name [on | off] : anti-changement du nom du groupe\n   {pn} nickname [on | off] : anti-changement des surnoms dans le groupe\n   {pn} theme [on | off] : anti-changement du thème du groupe\n   {pn} emoji [on | off] : anti-changement de l'emoji du groupe"
		}
	},

	langs: {
		fr: {
			antiChangeAvatarOn: "Anti-changement de l'avatar activé",
			antiChangeAvatarOff: "Anti-changement de l'avatar désactivé",
			missingAvt: "Aucun avatar n'est défini pour ce groupe",
			antiChangeNameOn: "Anti-changement du nom activé",
			antiChangeNameOff: "Anti-changement du nom désactivé",
			antiChangeNicknameOn: "Anti-changement des surnoms activé",
			antiChangeNicknameOff: "Anti-changement des surnoms désactivé",
			antiChangeThemeOn: "Anti-changement du thème activé",
			antiChangeThemeOff: "Anti-changement du thème désactivé",
			antiChangeEmojiOn: "Anti-changement de l'emoji activé",
			antiChangeEmojiOff: "Anti-changement de l'emoji désactivé",
			antiChangeAvatarAlreadyOn: "L'anti-changement de l'avatar est actuellement activé dans ce groupe",
			antiChangeAvatarAlreadyOnButMissingAvt: "L'anti-changement de l'avatar est activé mais aucun avatar n'est défini",
			antiChangeNameAlreadyOn: "L'anti-changement du nom est actuellement activé dans ce groupe",
			antiChangeNicknameAlreadyOn: "L'anti-changement des surnoms est actuellement activé dans ce groupe",
			antiChangeThemeAlreadyOn: "L'anti-changement du thème est actuellement activé dans ce groupe",
			antiChangeEmojiAlreadyOn: "L'anti-changement de l'emoji est actuellement activé dans ce groupe"
		}
	},

	onStart: async function ({ message, event, args, threadsData, getLang }) {
		if (!["on", "off"].includes(args[1]))
			return message.SyntaxError();
		const { threadID } = event;
		const dataAntiChangeInfoBox = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
		async function checkAndSaveData(key, data) {
			if (args[1] === "off")
				delete dataAntiChangeInfoBox[key];
			else
				dataAntiChangeInfoBox[key] = data;
			await threadsData.set(threadID, dataAntiChangeInfoBox, "data.antiChangeInfoBox");
			message.reply(getLang(`antiChange${key.slice(0, 1).toUpperCase()}${key.slice(1)}${args[1].slice(0, 1).toUpperCase()}${args[1].slice(1)}`));
		}
		switch (args[0]) {
			case "avt":
			case "avatar":
			case "image": {
				const { imageSrc } = await threadsData.get(threadID);
				if (!imageSrc)
					return message.reply(getLang("missingAvt"));
				const newImageSrc = await uploadImgbb(imageSrc);
				await checkAndSaveData("avatar", newImageSrc.image.url);
				break;
			}
			case "name": {
				const { threadName } = await threadsData.get(threadID);
				await checkAndSaveData("name", threadName);
				break;
			}
			case "nickname": {
				const { members } = await threadsData.get(threadID);
				await checkAndSaveData("nickname", members.map(user => ({ [user.userID]: user.nickname })).reduce((a, b) => ({ ...a, ...b }), {}));
				break;
			}
			case "theme": {
				const { threadThemeID } = await threadsData.get(threadID);
				await checkAndSaveData("theme", threadThemeID);
				break;
			}
			case "emoji": {
				const { emoji } = await threadsData.get(threadID);
				await checkAndSaveData("emoji", emoji);
				break;
			}
			default: {
				return message.SyntaxError();
			}
		}
	},

	onEvent: async function ({ message, event, threadsData, role, api, getLang }) {
		const { threadID, logMessageType, logMessageData, author } = event;
		switch (logMessageType) {
			case "log:thread-image": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!dataAntiChange.avatar && role < 1)
					return;
				return async function () {
					if (role < 1 && api.getCurrentUserID() !== author) {
						if (dataAntiChange.avatar != "REMOVE") {
							message.reply(getLang("antiChangeAvatarAlreadyOn"));
							api.changeGroupImage(await getStreamFromURL(dataAntiChange.avatar), threadID);
						} else {
							message.reply(getLang("antiChangeAvatarAlreadyOnButMissingAvt"));
						}
					} else {
						const imageSrc = logMessageData.url;
						if (!imageSrc)
							return await threadsData.set(threadID, "REMOVE", "data.antiChangeInfoBox.avatar");
						const newImageSrc = await uploadImgbb(imageSrc);
						await threadsData.set(threadID, newImageSrc.image.url, "data.antiChangeInfoBox.avatar");
					}
				};
			}
			case "log:thread-name": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!dataAntiChange.hasOwnProperty("name"))
					return;
				return async function () {
					if (role < 1 && api.getCurrentUserID() !== author) {
						message.reply(getLang("antiChangeNameAlreadyOn"));
						api.setTitle(dataAntiChange.name, threadID);
					} else {
						const threadName = logMessageData.name;
						await threadsData.set(threadID, threadName, "data.antiChangeInfoBox.name");
					}
				};
			}
			case "log:user-nickname": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!dataAntiChange.hasOwnProperty("nickname"))
					return;
				return async function () {
					const { nickname, participant_id } = logMessageData;
					if (role < 1 && api.getCurrentUserID() !== author) {
						message.reply(getLang("antiChangeNicknameAlreadyOn"));
						api.changeNickname(dataAntiChange.nickname[participant_id], threadID, participant_id);
					} else {
						await threadsData.set(threadID, nickname, `data.antiChangeInfoBox.nickname.${participant_id}`);
					}
				};
			}
			case "log:thread-color": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!dataAntiChange.hasOwnProperty("theme"))
					return;
				return async function () {
					if (role < 1 && api.getCurrentUserID() !== author) {
						message.reply(getLang("antiChangeThemeAlreadyOn"));
						api.changeThreadColor(dataAntiChange.theme || "196241301102133", threadID);
					} else {
						const threadThemeID = logMessageData.theme_id;
						await threadsData.set(threadID, threadThemeID, "data.antiChangeInfoBox.theme");
					}
				};
			}
			case "log:thread-icon": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!dataAntiChange.hasOwnProperty("emoji"))
					return;
				return async function () {
					if (role < 1 && api.getCurrentUserID() !== author) {
						message.reply(getLang("antiChangeEmojiAlreadyOn"));
						api.changeThreadEmoji(dataAntiChange.emoji, threadID);
					} else {
						const threadEmoji = logMessageData.thread_icon;
						await threadsData.set(threadID, threadEmoji, "data.antiChangeInfoBox.emoji");
					}
				};
			}
		}
	}
};
				
