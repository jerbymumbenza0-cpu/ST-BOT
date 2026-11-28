
module.exports = {
	config: {
		name: "kick",
		version: "2.0",
		author: "PEDRI",
		countDown: 5,
		role: 1,
		description: {
			vi: "Kick thành viên khỏi box chat",
			en: "Kick member out of chat box"
		},
		category: "box chat",
		guide: {
			vi: "   {pn} @tags: dùng để kick những người được tag",
			en: "   {pn} @tags: use to kick members who are tagged"
		}
	},

	langs: {
		vi: {
			needAdmin: "Bot phải là quản trị viên nhóm mới có thể kick thành viên.",
			success: "Đã kick thành công %1 thành viên.",
			failed: "Không thể kick thành viên: %1",
			noTarget: "Vui lòng tag người cần kick hoặc trả lời tin nhắn của họ."
		},
		en: {
			needAdmin: "The bot must be a group admin to kick members.",
			success: "Successfully kicked %1 member(s).",
			failed: "Failed to kick member: %1",
			noTarget: "Please tag the member or reply to their message."
		}
	},

	onStart: async function ({
		message,
		event,
		args,
		threadsData,
		api,
		getLang
	}) {
		try {
			const adminIDs = await threadsData.get(
				event.threadID,
				"adminIDs"
			);

			if (!adminIDs || !adminIDs.includes(api.getCurrentUserID())) {
				return message.reply(getLang("needAdmin"));
			}

			let uids = [];

			if (event.messageReply && !args[0]) {
				uids.push(event.messageReply.senderID);
			}
			else {
				uids = Object.keys(event.mentions || {});
			}

			uids = [...new Set(uids)].filter(
				uid => uid !== api.getCurrentUserID()
			);

			if (uids.length === 0) {
				return message.reply(getLang("noTarget"));
			}

			let success = 0;
			let failed = 0;

			for (const uid of uids) {
				try {
					await api.removeUserFromGroup(uid, event.threadID);
					success++;
				}
				catch (err) {
					failed++;
				}
			}

			if (success > 0) {
				await message.reply(
					getLang("success", success)
				);
			}

			if (failed > 0) {
				await message.reply(
					getLang("failed", failed)
				);
			}
		}
		catch (err) {
			console.error(err);
			return message.reply(
				"Une erreur est survenue pendant l'exécution de la commande."
			);
		}
	}
};
				
