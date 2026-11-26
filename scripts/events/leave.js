const { getTime, drive } = global.utils;

async function resolveUserName(usersData, api, userID) {
	if (!userID) return "Unknown User";
	let name = await usersData.getName(userID);
	if (!name || name === `User ${userID}` || /^User \d+$/.test(name)) {
		try {
			const info = await api.getUserInfo(userID);
			const userInfo = info && (info[userID] || info[String(userID)]);
			if (userInfo && userInfo.name) {
				name = userInfo.name;
			}
		} catch (e) {
			// Garde le nom par défaut si l'API échoue
		}
	}
	return name || `User ${userID}`;
}

module.exports = {
	config: {
		name: "leave",
		version: "2.4.82",
		author: "NTKhang | enhanced by ST",
		category: "events"
	},

	langs: {
		vi: {
			session1: "sáng",
			session2: "trưa",
			session3: "chiều",
			session4: "tối",
			leaveType1: "tự rời nhóm",
			leaveType2: "bị xóa khỏi nhóm",
			statusType1: "tự rời nhóm",
			statusType2: "bị {authorName} xóa khỏi nhóm",
			defaultLeaveMessage: "╭━━━━━━━━━━━━━━━━━━━━━━╮\n    👋 Tạm biệt {userNameTag}!\n╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n➤ {userNameTag} đã {type}《 {boxName} 》\n\n╭──「 📉 Thông tin rời nhóm 」\n│ ▸ Trạng thái: {status}\n│ ▸ Giờ: {time}h\n│ ▸ Buổi: {session}\n╰────────────────────"
		},
		en: {
			session1: "morning",
			session2: "noon",
			session3: "afternoon",
			session4: "evening",
			leaveType1: "left the group",
			leaveType2: "was removed from the group",
			statusType1: "left the group",
			statusType2: "was removed from the group by {authorName}",
			defaultLeaveMessage: `╭━━━━━━━━━━━━━━━━━━━━━━╮\n    👋 Bye {userNameTag}!\n╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n➤ {userNameTag} {type}《 {boxName} 》\n\n╭──「 📉 Exit Info 」\n│ ▸ Status: {status}\n│ ▸ Hour: {time}h\n│ ▸ Time: {session}\n╰────────────────────`
		}
	},

	onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
		if (event.logMessageType == "log:unsubscribe")
			return async function () {
				const { threadID } = event;
				const threadData = await threadsData.get(threadID);

				// Check if leave message is enabled for this thread
				// Default is true (enabled) if not explicitly disabled
				if (threadData.settings && threadData.settings.sendLeaveMessage === false)
					return;

				const { leftParticipantFbId } = event.logMessageData;
				if (leftParticipantFbId == api.getCurrentUserID())
					return;

				const hours = Number(getTime("HH"));
				const threadName = threadData.threadName || "";
				const userName = await resolveUserName(usersData, api, leftParticipantFbId);
				const isSelfLeave = leftParticipantFbId == event.author;
				const authorName = isSelfLeave
					? userName
					: await resolveUserName(usersData, api, event.author);

				const leaveType = isSelfLeave ? getLang("leaveType1") : getLang("leaveType2");
				const statusText = (isSelfLeave ? getLang("statusType1") : getLang("statusType2"))
					.replace(/\{authorName\}/g, authorName);

				let leaveMessage = threadData.data?.leaveMessage || getLang("defaultLeaveMessage");

				const mentions = [];
				if (/\{userNameTag\}/.test(leaveMessage)) {
					mentions.push({
						tag: userName,
						id: leftParticipantFbId
					});
				}

				leaveMessage = leaveMessage
					.replace(/\{userName\}|\{userNameTag\}/g, userName)
					.replace(/\{authorName\}/g, authorName)
					.replace(/\{type\}/g, leaveType)
					.replace(/\{status\}/g, statusText)
					.replace(/\{threadName\}|\{boxName\}/g, threadName)
					.replace(/\{time\}/g, getTime("HH"))
					.replace(/\{session\}/g, hours <= 10 ?
						getLang("session1") :
						hours <= 12 ?
							getLang("session2") :
							hours <= 18 ?
								getLang("session3") :
								getLang("session4")
					);

				const form = {
					body: leaveMessage,
					mentions: mentions.length > 0 ? mentions : undefined
				};

				if (threadData.data?.leaveAttachment) {
					const files = threadData.data.leaveAttachment;
					const attachments = files.map((file) => drive.getFile(file, "stream"));
					form.attachment = (await Promise.allSettled(attachments))
						.filter(({ status }) => status == "fulfilled")
						.map(({ value }) => value);
				}

				return message.send(form);
			};
	}
};
	
