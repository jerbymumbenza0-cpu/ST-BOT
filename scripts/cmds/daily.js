const moment = require("moment-timezone");

module.exports = {
	config: {
		name: "daily",
		version: "1.3",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: {
			vi: "Nhận quà hàng ngày",
			en: "Receive daily gift"
		},
		category: "game",
		guide: {
			vi: "   {pn}: Nhận quà hàng ngày"
				+ "\n   {pn} info: Xem thông tin quà hàng ngày",
			en: "   {pn}"
				+ "\n   {pn} info: View daily gift information"
		},
		envConfig: {
			rewardFirstDay: {
				coin: 1000000,      // Montant du 1er jour (Lundi)
				coinStep: 1000000,  // Augmentation chaque jour (+1 000 000 $)
				exp: 500,           // EXP du 1er jour (Lundi)
				expStep: 500        // Augmentation d'EXP chaque jour (+500 exp)
			}
		}
	},

	langs: {
		vi: {
			monday: "Thứ 2",
			tuesday: "Thứ 3",
			wednesday: "Thứ 4",
			thursday: "Thứ 5",
			friday: "Thứ 6",
			saturday: "Thứ 7",
			sunday: "Chủ nhật",
			alreadyReceived: "Bạn đã nhận quà rồi",
			received: "Bạn đã nhận được %1$ và %2 exp"
		},
		en: {
			monday: "Monday",
			tuesday: "Tuesday",
			wednesday: "Wednesday",
			thursday: "Thursday",
			friday: "Friday",
			saturday: "Saturday",
			sunday: "Sunday",
			alreadyReceived: "You have already received the gift",
			received: "You have received %1$ and %2 exp"
		}
	},

	onStart: async function ({ args, message, event, envCommands, usersData, commandName, getLang }) {
		const reward = envCommands[commandName].rewardFirstDay;
		const coinBase = reward.coin ?? 1000000;
		const coinStep = reward.coinStep ?? 1000000;
		const expBase = reward.exp ?? 500;
		const expStep = reward.expStep ?? 500;

		// dayIndex: 0 = Lundi, 1 = Mardi, ..., 6 = Dimanche
		const calcReward = (dayIndex) => {
			const getCoin = coinBase + (dayIndex * coinStep);
			const getExp = expBase + (dayIndex * expStep);
			return { getCoin, getExp };
		};

		if (args[0] == "info") {
			let msg = "";
			const days = [
				getLang("monday"),
				getLang("tuesday"),
				getLang("wednesday"),
				getLang("thursday"),
				getLang("friday"),
				getLang("saturday"),
				getLang("sunday")
			];

			for (let i = 0; i < 7; i++) {
				const { getCoin, getExp } = calcReward(i);
				msg += `${days[i]}: ${getCoin.toLocaleString("en-US")}$ , ${getExp.toLocaleString("en-US")} exp\n`;
			}
			return message.reply(msg);
		}

		const dateTime = moment.tz("Asia/Dhaka").format("DD/MM/YYYY");
		const date = new Date();
		const currentDay = date.getDay(); // 0: dimanche, 1: lundi, ..., 6: samedi
		const dayIndex = currentDay === 0 ? 6 : currentDay - 1; // 0: lundi ... 6: dimanche
		const { senderID } = event;

		const userData = await usersData.get(senderID);
		if (userData.data.lastTimeGetReward === dateTime)
			return message.reply(getLang("alreadyReceived"));

		const { getCoin, getExp } = calcReward(dayIndex);
		userData.data.lastTimeGetReward = dateTime;
		await usersData.set(senderID, {
			money: userData.money + getCoin,
			exp: userData.exp + getExp,
			data: userData.data
		});
		message.reply(getLang("received", getCoin.toLocaleString("en-US"), getExp.toLocaleString("en-US")));
	}
};
			
