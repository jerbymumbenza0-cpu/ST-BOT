const { getStreamFromURL, uploadImgbb } = global.utils;

module.exports = {
	config: {
		name: "antichangeinfobox",
		version: "2.1",
		author: "Aminul Sardar",
		countDown: 5,
		role: 0,
		description: {
			en: "Turn on/off anti change info box",
			fr: "Activer ou désactiver l'anti-changement des infos du groupe"
		},
		category: "box chat",
		guide: {
			en: "   {pn} avt [on | off]: anti change avatar box chat\n   {pn} name [on | off]: anti change name box chat\n   {pn} nickname [on | off]: anti change nickname in box chat\n   {pn} theme [on | off]: anti change theme box chat\n   {pn} emoji [on | off]: anti change emoji box chat",
			fr: "   {pn} avt [on | off] : anti-changement de l'avatar du groupe\n   {pn} name [on | off] : anti-changement du nom du groupe\n   {pn} nickname [on | off] : anti-changement des surnoms dans le groupe\n   {pn} theme [on | off] : anti-changement du thème du groupe\n   {pn} emoji [on | off] : anti-changement de l'emoji du groupe"
		}
	},

	langs: {
		en: {
			antiChangeAvatarOn: "Turned on anti change avatar",
			antiChangeAvatarOff: "Turned off anti change avatar",
			missingAvt: "You have not set an avatar for this chat",
			antiChangeNameOn: "Turned on anti change name",
			antiChangeNameOff: "Turned off anti change name",
			antiChangeNicknameOn: "Turned on anti change nickname",
			antiChangeNicknameOff: "Turned off anti change nickname",
			antiChangeThemeOn: "Turned on anti change theme",
			antiChangeThemeOff: "Turned off anti change theme",
			antiChangeEmojiOn: "Turned on anti change emoji",
			antiChangeEmojiOff: "Turned off anti change emoji",
			antiChangeAvatarAlreadyOn: "This chat currently has anti change avatar enabled",
			antiChangeAvatarAlreadyOnButMissingAvt: "This chat currently has anti change avatar enabled but no avatar is set",
			antiChangeNameAlreadyOn: "This chat currently has anti change name enabled",
			antiChangeNicknameAlreadyOn: "This chat currently has anti change nickname enabled",
			antiChangeThemeAlreadyOn: "This chat currently has anti change theme enabled",
			antiChangeEmojiAlreadyOn: "This chat currently has anti change emoji enabled",
			errorAction: "An error occurred while performing this action"
		},
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
			antiChangeEmojiAlreadyOn: "L'anti-changement de l'emoji est actuellement activé dans ce groupe",
			errorAction: "Une erreur est survenue lors de l'exécution de cette action"
		}
	},

	onStart: async function ({ message, event, args, threadsData, api, getLang }) {
		const action = args[1]?.toLowerCase();
		const target = args[0]?.toLowerCase();

		if (!["on", "off"].includes(action))
			return message.SyntaxError();

		const { threadID } = event;
		const dataAntiChangeInfoBox = await threadsData.get(threadID, "data.antiChangeInfoBox", {});

		async function getSafeThreadInfo() {
			const dbData = (await threadsData.get(threadID)) || {};
			let apiData = {};
			if (typeof api.getThreadInfo === "function") {
				try {
					apiData = (await api.getThreadInfo(threadID)) || {};
				} catch (_) {
					apiData = {};
				}
			}
			return { ...dbData, ...apiData };
		}

		async function checkAndSaveData(key, data) {
			if (action === "off") {
				delete dataAntiChangeInfoBox[key];
			} else {
				dataAntiChangeInfoBox[key] = data;
			}
			await threadsData.set(threadID, dataAntiChangeInfoBox, "data.antiChangeInfoBox");
			const keyCap = key.slice(0, 1).toUpperCase() + key.slice(1);
			const actionCap = action.slice(0, 1).toUpperCase() + action.slice(1);
			return message.reply(getLang(`antiChange${keyCap}${actionCap}`));
		}

		try {
			switch (target) {
				case "avt":
				case "avatar":
				case "image": {
					if (action === "off")
						return await checkAndSaveData("avatar", null);

					const info = await getSafeThreadInfo();
					const imageSrc = info.imageSrc || info.thumbSrc;
					if (!imageSrc)
						return message.reply(getLang("missingAvt"));

					const uploaded = await uploadImgbb(imageSrc);
					const imageUrl = uploaded?.image?.url || uploaded?.data?.url;
					if (!imageUrl)
						return message.reply(getLang("errorAction"));

					return await checkAndSaveData("avatar", imageUrl);
				}
				case "name": {
					if (action === "off")
						return await checkAndSaveData("name", null);

					const info = await getSafeThreadInfo();
					const threadName = info.threadName || info.name || "";
					return await checkAndSaveData("name", threadName);
				}
				case "nickname": {
					if (action === "off")
						return await checkAndSaveData("nickname", null);

					const info = await getSafeThreadInfo();
					const nicknames = {};

					if (Array.isArray(info.members)) {
						for (const user of info.members) {
							if (user?.userID) {
								nicknames[user.userID] = user.nickname || "";
							}
						}
					}

					if (info.nicknames && typeof info.nicknames === "object") {
						for (const [userID, nick] of Object.entries(info.nicknames)) {
							nicknames[userID] = nick || "";
						}
					}

					return await checkAndSaveData("nickname", nicknames);
				}
				case "theme": {
					if (action === "off")
						return await checkAndSaveData("theme", null);

					const info = await getSafeThreadInfo();
					const threadThemeID = info.threadThemeID || info.color || "196241301102133";
					return await checkAndSaveData("theme", threadThemeID);
				}
				case "emoji": {
					if (action === "off")
						return await checkAndSaveData("emoji", null);

					const info = await getSafeThreadInfo();
					const emoji = info.emoji || info.reactionMute?.emoji || "👍";
					return await checkAndSaveData("emoji", emoji);
				}
				default: {
					return message.SyntaxError();
				}
			}
		} catch (err) {
			console.error("antichangeinfobox onStart error:", err);
			return message.reply(getLang("errorAction"));
		}
	},

	onEvent: async function ({ message, event, threadsData, role, api, getLang }) {
		const { threadID, logMessageType, logMessageData = {}, author } = event;
		const isAuthorized = role >= 1 || api.getCurrentUserID() === author;

		switch (logMessageType) {
			case "log:thread-image": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!dataAntiChange.avatar && !isAuthorized)
					return;

				return async function () {
					try {
						if (!isAuthorized) {
							if (dataAntiChange.avatar && dataAntiChange.avatar !== "REMOVE") {
								await message.reply(getLang("antiChangeAvatarAlreadyOn"));
								const stream = await getStreamFromURL(dataAntiChange.avatar);
								await api.changeGroupImage(stream, threadID);
							} else {
								await message.reply(getLang("antiChangeAvatarAlreadyOnButMissingAvt"));
							}
						} else {
							const imageSrc = logMessageData.url;
							if (!imageSrc) {
								await threadsData.set(threadID, "REMOVE", "data.antiChangeInfoBox.avatar");
								return;
							}
							const uploaded = await uploadImgbb(imageSrc);
							const imageUrl = uploaded?.image?.url || uploaded?.data?.url;
							if (imageUrl) {
								await threadsData.set(threadID, imageUrl, "data.antiChangeInfoBox.avatar");
							}
						}
					} catch (err) {
						console.error("antichangeinfobox image event error:", err);
					}
				};
			}

			case "log:thread-name": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!Object.prototype.hasOwnProperty.call(dataAntiChange, "name"))
					return;

				return async function () {
					try {
						if (!isAuthorized) {
							await message.reply(getLang("antiChangeNameAlreadyOn"));
							await api.setTitle(dataAntiChange.name || "", threadID);
						} else {
							const threadName = logMessageData.name ?? "";
							await threadsData.set(threadID, threadName, "data.antiChangeInfoBox.name");
						}
					} catch (err) {
						console.error("antichangeinfobox name event error:", err);
					}
				};
			}

			case "log:user-nickname": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!Object.prototype.hasOwnProperty.call(dataAntiChange, "nickname"))
					return;

				return async function () {
					try {
						const { nickname = "", participant_id } = logMessageData;
						if (!participant_id)
							return;

						if (!isAuthorized) {
							const oldNickname = dataAntiChange.nickname?.[participant_id] ?? "";
							await message.reply(getLang("antiChangeNicknameAlreadyOn"));
							await api.changeNickname(oldNickname, threadID, participant_id);
						} else {
							await threadsData.set(threadID, nickname, `data.antiChangeInfoBox.nickname.${participant_id}`);
						}
					} catch (err) {
						console.error("antichangeinfobox nickname event error:", err);
					}
				};
			}

			case "log:thread-color": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!Object.prototype.hasOwnProperty.call(dataAntiChange, "theme"))
					return;

				return async function () {
					try {
						if (!isAuthorized) {
							await message.reply(getLang("antiChangeThemeAlreadyOn"));
							await api.changeThreadColor(dataAntiChange.theme || "196241301102133", threadID);
						} else {
							const threadThemeID = logMessageData.theme_id;
							if (threadThemeID) {
								await threadsData.set(threadID, threadThemeID, "data.antiChangeInfoBox.theme");
							}
						}
					} catch (err) {
						console.error("antichangeinfobox theme event error:", err);
					}
				};
			}

			case "log:thread-icon": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!Object.prototype.hasOwnProperty.call(dataAntiChange, "emoji"))
					return;

				return async function () {
					try {
						if (!isAuthorized) {
							await message.reply(getLang("antiChangeEmojiAlreadyOn"));
							if (dataAntiChange.emoji) {
								await api.changeThreadEmoji(dataAntiChange.emoji, threadID);
							}
						} else {
							const threadEmoji = logMessageData.thread_icon;
							if (threadEmoji) {
								await threadsData.set(threadID, threadEmoji, "data.antiChangeInfoBox.emoji");
							}
						}
					} catch (err) {
						console.error("antichangeinfobox emoji event error:", err);
					}
				};
			}
		}
	}
};
				
