const { GoatWrapper } = require("fca-liane-utils");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "spin",
    aliases: ["spinwheel", "roulette"],
    version: "1.1",
    author: "Nisanxnx",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Spin and win coins",
    },
    longDescription: {
      en: "Spin the wheel by betting coins, and win or lose based on luck",
    },
    category: "game",
    guide: {
      en: "{p}spin [amount] (Default: 10,000)",
    },
    envConfig: {
      defaultBet: 10000,
      minBet: 100,
      maxBet: 100000000,
      baseBonus: 5000,
      jackpotBonus: 250000
    }
  },

  onStart: async function ({ message, event, args, usersData, envCommands, commandName }) {
    const cfg = envCommands?.[commandName] || this.config.envConfig;
    const defaultBet = cfg.defaultBet ?? 10000;
    const minBet = cfg.minBet ?? 100;
    const maxBet = cfg.maxBet ?? 100000000;
    const baseBonus = cfg.baseBonus ?? 5000;
    const jackpotBonus = cfg.jackpotBonus ?? 250000;

    let bet = defaultBet;
    if (args[0]) {
      bet = parseInt(args[0].replace(/[,_$]/g, ""), 10);
      if (isNaN(bet)) {
        return message.reply("❌ একটি বৈধ কয়েন পরিমাণ দিন!\n\n📌 ব্যবহার: spin 10000");
      }
    }

    if (bet < minBet) {
      return message.reply(`❌ সর্বনিম্ন বেট হলো ${minBet.toLocaleString("en-US")} কয়েন!`);
    }

    if (bet > maxBet) {
      return message.reply(`❌ সর্বোচ্চ বেট সীমা হলো ${maxBet.toLocaleString("en-US")} কয়েন!`);
    }

    const userData = await usersData.get(event.senderID);
    const balance = userData.money || 0;

    if (balance < bet) {
      return message.reply(
        `❌ আপনার কাছে পর্যাপ্ত কয়েন নেই!\n` +
        `💰 আপনার ব্যালেন্স: ${balance.toLocaleString("en-US")} কয়েন\n` +
        `💸 বেট: ${bet.toLocaleString("en-US")} কয়েন`
      );
    }

    // Multiplicateurs et primes augmentés
    const outcomes = [
      { result: "🎉 ডাবল জিতেছেন!", multiplier: 4, bonus: baseBonus },
      { result: "💸 বেট ফেরত + বোনাস!", multiplier: 1.5, bonus: baseBonus },
      { result: "😢 ২৫% হারিয়েছেন!", multiplier: 0.75, bonus: 0 },
      { result: "🔥 ট্রিপল জিতেছেন!", multiplier: 8, bonus: baseBonus * 2 },
      { result: "💎 মেগা জ্যাকপট!", multiplier: 20, bonus: jackpotBonus },
      { result: "🍀 ২.৫ গুণ পেয়েছেন!", multiplier: 2.5, bonus: baseBonus },
    ];

    const spin = outcomes[Math.floor(Math.random() * outcomes.length)];
    const wonAmount = spin.multiplier > 1
      ? Math.floor(bet * spin.multiplier) + spin.bonus
      : Math.floor(bet * spin.multiplier);
    const netAmount = wonAmount - bet;

    // Update balance
    const newBalance = balance + netAmount;
    await usersData.set(event.senderID, {
      money: newBalance,
      data: userData.data
    });

    message.reply(
      `🎡 স্পিনের ফলাফল: ${spin.result}\n` +
      `🔢 বেট: ${bet.toLocaleString("en-US")} কয়েন\n` +
      `🎁 প্রাইম/বোনাস: +${(spin.multiplier > 1 ? spin.bonus : 0).toLocaleString("en-US")} কয়েন\n` +
      `💰 অর্জন: ${wonAmount.toLocaleString("en-US")} কয়েন\n` +
      `📊 নতুন ব্যালেন্স: ${newBalance.toLocaleString("en-US")} কয়েন`
    );
  }
};
  
