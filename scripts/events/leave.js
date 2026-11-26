const { getTime, drive } = global.utils;

module.exports = {
	config: {
		name: "leave",
		version: "2.4.80",
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
			leaveType2: "bị {authorName} xóa khỏi nhóm",
			defaultLeaveMessage: "╭━━━━━━━━━━━━━━━━━━━━━━╮\n    👋 Tạm biệt {userName}!\n╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n➤ {userName} đã {type} 《 {boxName} 》\n\n╭──「 📉 Thông tin rời nhóm 」\n│ ▸ Trạng thái: {type}\n│ ▸ Giờ: {time}h\n│ ▸ Buổi: {session}\n╰────────────────────"
		},
		en: {
			session1: "morning",
			session2: "noon",
			session3: "afternoon",
			session4: "evening",
			leaveType1: "left the group",
			leaveType2: "was removed from the group by {authorName}",
			defaultLeaveMessage: `╭━━━━━━━━━━━━━━━━━━━━━━╮\n    👋 Bye {userName}!\n╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n➤ {userName} {type} 《 {boxName} 》\n\n╭──「 📉 Exit Info 」\n│ ▸ Status: {type}\n│ ▸ Hour: {time}h\n│ ▸ Time: {session}\n╰────────────────────`
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
				const hours = getTime("HH");

				const threadName = threadData.threadName;
				const userName = await usersData.getName(leftParticipantFbId);
				const isSelfLeave = leftParticipantFbId == event.author;
				const authorName = isSelfLeave ? userName : await usersData.getName(event.author);

				const leaveType = (isSelfLeave ? getLang("leaveType1") : getLang("leaveType2"))
					.replace(/\{authorName\}/g, authorName);

				// {userName}   : name of the user who left the group
				// {authorName} : name of the user who kicked/removed the member
				// {type}       : type of the message (leave / removed)
				// {boxName}    : name of the box
				// {threadName} : name of the box
				// {time}       : time
				// {session}    : session

				let { leaveMessage = getLang("defaultLeaveMessage") } = threadData.data;
				const form = {
					mentions: leaveMessage.match(/\{userNameTag\}/g) ? [{
						tag: userName,
						id: leftParticipantFbId
					}] : null
				};

				leaveMessage = leaveMessage
					.replace(/\{userName\}|\{userNameTag\}/g, userName)
					.replace(/\{authorName\}/g, authorName)
					.replace(/\{type\}/g, leaveType)
					.replace(/\{threadName\}|\{boxName\}/g, threadName)
					.replace(/\{time\}/g, hours)
					.replace(/\{session\}/g, hours <= 10 ?
						getLang("session1") :
						hours <= 12 ?
							getLang("session2") :
							hours <= 18 ?
								getLang("session3") :
								getLang("session4")
					);

				form.body = leaveMessage;

				if (leaveMessage.includes("{userNameTag}")) {
					form.mentions = [{
						id: leftParticipantFbId,
						tag: userName
					}];
				}

				if (threadData.data.leaveAttachment) {
					const files = threadData.data.leaveAttachment;
					const attachments = files.reduce((acc, file) => {
						acc.push(drive.getFile(file, "stream"));
						return acc;
					}, []);
					form.attachment = (await Promise.allSettled(attachments))
						.filter(({ status }) => status == "fulfilled")
						.map(({ value }) => value);
				}
				message.send(form);
			};
	}
};
							 
