const fonts = require('../../func/font.js');

// État global des duels actifs par thread
const duelState = {};

module.exports = {
	config: {
		name: "academie",
		aliases: ["magie", "wizard", "mage"],
		version: "1.0",
		author: "Christus",
		countDown: 3,
		role: 0,
		description: {
			fr: "🧙 Académie de Magie — Apprends des sorts, monte en grade et deviens Archimage !"
		},
		category: "economy",
		guide: {
			fr: "Tapez 'academie help' pour voir toutes les commandes."
		}
	},

	langs: {
		fr: {
			help: "Liste des commandes de l'Académie",
			success: "Succès",
			error: "Erreur",
			insufficientFunds: "Fonds insuffisants",
			invalidAmount: "Montant invalide"
		}
	},

	grimoire: {
		sorts: {
			"ETINCELLE":   { cout: 200,    mana: 10, niveau: 1, gain: [150, 350],     nom: "Étincelle",          ecole: "Évocation" },
			"PROJECTILE":  { cout: 500,    mana: 18, niveau: 1, gain: [350, 700],     nom: "Projectile Astral",  ecole: "Évocation" },
			"GUERISON":    { cout: 800,    mana: 22, niveau: 2, gain: [500, 1000],    nom: "Guérison Mineure",   ecole: "Soin" },
			"INVISIBILITE":{ cout: 1500,   mana: 30, niveau: 2, gain: [900, 1800],    nom: "Invisibilité",       ecole: "Illusion" },
			"TELEPORT":    { cout: 3000,   mana: 40, niveau: 3, gain: [1800, 3500],   nom: "Téléportation",      ecole: "Conjuration" },
			"FOUDRE":      { cout: 6000,   mana: 55, niveau: 3, gain: [3500, 7000],   nom: "Foudre Céleste",     ecole: "Évocation" },
			"METEORE":     { cout: 15000,  mana: 75, niveau: 4, gain: [8000, 16000],  nom: "Météore Ardent",     ecole: "Destruction" },
			"RESURRECTION":{ cout: 40000,  mana: 95, niveau: 5, gain: [20000, 42000], nom: "Résurrection",       ecole: "Soin" },
			"APOCALYPSE":  { cout: 120000, mana: 100,niveau: 6, gain: [60000,130000], nom: "Apocalypse Arcanique",ecole: "Destruction" }
		},
		familiers: {
			"CHAT":      { cout: 1000,   bonus: 0.05, nom: "Chat Noir",       emoji: "🐈‍⬛" },
			"CORBEAU":   { cout: 3000,   bonus: 0.10, nom: "Corbeau Mystique",emoji: "🐦‍⬛" },
			"RENARD":    { cout: 8000,   bonus: 0.15, nom: "Renard Spectral", emoji: "🦊" },
			"LOUP":      { cout: 20000,  bonus: 0.22, nom: "Loup des Brumes", emoji: "🐺" },
			"PHOENIX":   { cout: 60000,  bonus: 0.35, nom: "Phénix",          emoji: "🔥" },
			"DRAGON":    { cout: 250000, bonus: 0.55, nom: "Dragonnet",       emoji: "🐉" }
		},
		artefacts: {
			"BAGUETTE":   { cout: 2000,   bonus: "mana",   val: 20,  nom: "Baguette en Bois de Saule" },
			"GRIMOIRE":   { cout: 6000,   bonus: "sort",   val: 0.10,nom: "Grimoire Ancien" },
			"AMULETTE":   { cout: 15000,  bonus: "mana",   val: 50,  nom: "Amulette de Protection" },
			"ANNEAU":     { cout: 40000,  bonus: "sort",   val: 0.20,nom: "Anneau des Arcanes" },
			"BATON":      { cout: 100000, bonus: "mana",   val: 120, nom: "Bâton du Conjureur" },
			"COURONNE":   { cout: 300000, bonus: "sort",   val: 0.35,nom: "Couronne de l'Archimage" }
		},
		potions: {
			"MANA_MIN":   { cout: 150,  effet: "mana",  val: 30,  nom: "Potion de Mana Mineure" },
			"MANA_MAJ":   { cout: 600,  effet: "mana",  val: 100, nom: "Potion de Mana Majeure" },
			"CHANCE":     { cout: 1200, effet: "chance",val: 0.15,nom: "Philtre de Chance" },
			"PUISSANCE":  { cout: 3000, effet: "sort",  val: 0.25,nom: "Élixir de Puissance" }
		},
		grades: [
			{ id: "APPRENTI",  nom: "Apprenti",       min: 0,          emoji: "📘" },
			{ id: "INITIE",    nom: "Initié",         min: 5000,       emoji: "📗" },
			{ id: "MAGE",      nom: "Mage",           min: 50000,      emoji: "🔮" },
			{ id: "ENCHANTEUR",nom: "Enchanteur",     min: 300000,     emoji: "✨" },
			{ id: "ARCHIMAGE", nom: "Archimage",      min: 2000000,    emoji: "🧙‍♂️" },
			{ id: "LEGENDE",   nom: "Légende Vivante",min: 15000000,   emoji: "👑" }
		]
	},

	onStart: async function ({ message, args, event, usersData, api }) {
		const { senderID, threadID } = event;
		const command = args[0]?.toLowerCase();

		let user = await usersData.get(senderID);
		if (!user) user = { money: 0, exp: 0, data: {} };
		if (!user.data) user.data = {};
		if (!user.data.academie) {
			user.data.academie = {
				mana: 100, manaMax: 100, grade: "APPRENTI", xp: 0,
				sortsAppris: [], familiers: [], artefacts: [], inventairePotions: {},
				totalGagne: 0, totalDuels: 0, duelsGagnes: 0, reputation: 0,
				streak: 0, lastDaily: null, lastLancer: null, lastMeditation: null,
				lastDuel: null, achievements: [], cristaux: 0, transactions: []
			};
		}
		const academie = user.data.academie;
		const walletBalance = user.money || 0;

		const save = async () => {
			await usersData.set(senderID, user);
		};

		switch (command) {
			case "help":
			case undefined:
				return this.showHelp(message, fonts);

			case "profil":
			case "stat":
			case "stats":
				return this.showProfil(message, academie, walletBalance, fonts);

			case "sorts":
			case "grimoire":
				return this.showSorts(message, args, academie, fonts);

			case "apprendre":
			case "learn":
				return this.apprendreSort(message, args, user, academie, fonts, save);

			case "lancer":
			case "cast":
				return this.lancerSort(message, args, user, academie, fonts, save);

			case "mediter":
			case "meditate":
				return this.mediter(message, academie, fonts, save);

			case "familier":
			case "familiers":
				return this.familiers(message, args, user, academie, fonts, save);

			case "artefact":
			case "artefacts":
				return this.artefacts(message, args, user, academie, fonts, save);

			case "potion":
			case "potions":
				return this.potions(message, args, user, academie, fonts, save);

			case "boire":
			case "drink":
				return this.boirePotion(message, args, academie, fonts, save);

			case "duel":
				return this.duel(message, args, user, academie, usersData, senderID, event, fonts, save);

			case "daily":
				return this.dailyReward(message, academie, fonts, save);

			case "achievements":
				return this.achievements(message, academie, fonts);

			case "leaderboard":
				return this.leaderboard(message, usersData, fonts, api);

			case "histoire":
			case "history":
				return this.showHistory(message, academie, fonts);

			default:
				return message.reply(fonts.bold("❌ Commande inconnue. Tapez 'academie help' pour voir toutes les commandes."));
		}
	},

	onChat: async function ({ event, message, usersData }) {
		const threadID = event.threadID;
		const userID = event.senderID;
		const body = (event.body || "").toLowerCase().trim();

		const state = duelState[threadID];
		if (!state) return;

		// Seuls les 2 joueurs peuvent interagir
		if (userID !== state.p1ID && userID !== state.p2ID) return;

		// Annulation
		if (body === "annuler" || body === "cancel") {
			delete duelState[threadID];
			return message.reply(fonts.bold("🚫 Duel annulé."));
		}

		// Phase : attente acceptation
		if (state.step === "waiting_accept") {
			if (userID !== state.p2ID) return;
			if (body === "accepter" || body === "accept" || body === "oui") {
				state.step = "battle";
				state.turn = "p1";
				const p1Info = await usersData.get(state.p1ID);
				const p2Info = await usersData.get(state.p2ID);

				const sorts1 = state.p1Sorts.slice(0, 3);
				const sorts2 = state.p2Sorts.slice(0, 3);

				const msg =
`⚔️ DUEL ARCANIQUE COMMENCE !
━━━━━━━━━━━━━━━━
${state.p1Grade} ${p1Info.name} VS ${state.p2Grade} ${p2Info.name}
💰 Mise: $${state.mise.toLocaleString()}

📖 Vos sorts équipés (utilisez leur numéro) :
━━━━━━━━━━━━━━━━
[1] Attaque basique — 🔵 0 mana | 💥 8-15 dégâts
[2] ${sorts1[0]?.nom || "—"} — 🔵 ${sorts1[0]?.mana || "?"} mana | 💥 ${sorts1[0]?.gain[0] ? "spécial" : "—"}
[3] ${sorts1[1]?.nom || "—"} — 🔵 ${sorts1[1]?.mana || "?"} mana
[4] ${sorts1[2]?.nom || "—"} — 🔵 ${sorts1[2]?.mana || "?"} mana
[r] Récupérer mana (+25)
[d] Défense (réduit dégâts de 40%)

@${p1Info.name} c'est à TOI de jouer !`;

				return message.reply({
					body: msg,
					mentions: [{ tag: `@${p1Info.name}`, id: state.p1ID }]
				});
			}
			if (body === "refuser" || body === "non") {
				delete duelState[threadID];
				return message.reply(fonts.bold("❌ Duel refusé."));
			}
			return;
		}

		// Phase : combat
		if (state.step === "battle") {
			const isP1Turn = state.turn === "p1";
			const currentID = isP1Turn ? state.p1ID : state.p2ID;
			if (userID !== currentID) return;

			const attacker = isP1Turn ? state.p1 : state.p2;
			const defender = isP1Turn ? state.p2 : state.p1;
			const attackerSorts = isP1Turn ? state.p1Sorts : state.p2Sorts;

			const grimoire = this.grimoire;
			let damage = 0;
			let techNom = "";
			let manaUsed = 0;
			let missed = false;
			let specialMsg = "";

			if (body === "1") {
				// Attaque basique
				damage = Math.floor(Math.random() * 8) + 8; // 8-15
				techNom = "Attaque basique";
			} else if (["2","3","4"].includes(body)) {
				const idx = parseInt(body) - 2;
				const sort = attackerSorts[idx];
				if (!sort) return message.reply(fonts.bold("❌ Vous n'avez pas ce sort équipé."));
				if (attacker.mana < sort.mana) {
					return message.reply(fonts.bold(`❌ Mana insuffisant ! (${attacker.mana}/${state.manaMax} — besoin: ${sort.mana})\nTapez [r] pour récupérer du mana.`));
				}
				// Dégâts basés sur le niveau du sort
				const niveauMulti = [1, 1.3, 1.7, 2.2, 3.0, 4.5][sort.niveau - 1] || 1;
				const base = Math.floor(Math.random() * 12) + 14; // 14-25
				damage = Math.floor(base * niveauMulti);
				// Chance d'échec de 10%
				if (Math.random() < 0.10) {
					missed = true;
					techNom = sort.nom + " (raté !)";
				} else {
					techNom = sort.nom;
				}
				attacker.mana -= sort.mana;
				attacker.mana = Math.max(0, attacker.mana);
				manaUsed = sort.mana;
			} else if (body === "r") {
				attacker.mana = Math.min(state.manaMax, attacker.mana + 25);
				specialMsg = `🔵 Mana récupéré ! (+25) → ${attacker.mana}/${state.manaMax}`;
			} else if (body === "d") {
				attacker.defending = true;
				specialMsg = `🛡️ Position défensive adoptée !`;
			} else {
				return message.reply(fonts.bold("❌ Commande invalide.\n[1] Basique · [2/3/4] Sorts · [r] Récup mana · [d] Défense"));
			}

			// Appliquer dégâts
			if (damage > 0 && !missed) {
				if (defender.defending) {
					damage = Math.floor(damage * 0.6);
					techNom += " (défendu)";
				}
				defender.hp -= damage;
				defender.hp = Math.max(0, defender.hp);
			}

			// Réinitialiser défense attaquant après son tour
			attacker.defending = false;

			// Récup mana passive chaque tour
			if (body !== "r") {
				attacker.mana = Math.min(state.manaMax, attacker.mana + 8);
			}

			// Construire message de combat
			const p1Info = await usersData.get(state.p1ID);
			const p2Info = await usersData.get(state.p2ID);

			const hpBar = (hp) => {
				const full = Math.floor(hp / 10);
				return "█".repeat(full) + "░".repeat(10 - full) + ` ${hp}%`;
			};
			const hpColor = (hp) => hp >= 70 ? "💚" : hp >= 40 ? "💛" : hp > 0 ? "❤️" : "💔";

			let combatMsg = "";
			if (specialMsg) {
				combatMsg += `✦ ${specialMsg}\n\n`;
			} else if (missed) {
				combatMsg += `✦ ${techNom} — Sort dissipé dans le vide !\n\n`;
			} else if (damage > 0) {
				combatMsg += `✦ ${techNom}${manaUsed > 0 ? ` (-${manaUsed} 🔵)` : ""}\n`;
				combatMsg += `  💥 ${damage} dégâts !\n\n`;
			}

			combatMsg +=
`━━━━━━━━━━━━━━━━
${hpColor(state.p1.hp)} ${p1Info.name}
   HP  : ${hpBar(state.p1.hp)}
   Mana: ${state.p1.mana}/${state.manaMax}
━━━━━━━━━━━━━━━━
${hpColor(state.p2.hp)} ${p2Info.name}
   HP  : ${hpBar(state.p2.hp)}
   Mana: ${state.p2.mana}/${state.manaMax}
━━━━━━━━━━━━━━━━`;

			// Vérifier fin de duel
			if (state.p1.hp <= 0 || state.p2.hp <= 0) {
				const winnerIsP1 = state.p2.hp <= 0;
				const winnerID = winnerIsP1 ? state.p1ID : state.p2ID;
				const loserID = winnerIsP1 ? state.p2ID : state.p1ID;
				const winnerInfo = winnerIsP1 ? p1Info : p2Info;

				// MAJ argent & stats
				let winner = await usersData.get(winnerID);
				let loser = await usersData.get(loserID);
				if (!winner.data?.academie) winner.data = winner.data || {}; winner.data.academie = winner.data?.academie || {};
				if (!loser.data?.academie) loser.data = loser.data || {}; loser.data.academie = loser.data?.academie || {};

				winner.money = (winner.money || 0) + state.mise;
				loser.money = Math.max(0, (loser.money || 0) - state.mise);
				winner.data.academie.duelsGagnes = (winner.data.academie.duelsGagnes || 0) + 1;
				winner.data.academie.totalDuels = (winner.data.academie.totalDuels || 0) + 1;
				winner.data.academie.reputation = (winner.data.academie.reputation || 0) + 5;
				loser.data.academie.totalDuels = (loser.data.academie.totalDuels || 0) + 1;
				winner.data.academie.transactions = winner.data.academie.transactions || [];
				winner.data.academie.transactions.push({ type: "duel", montant: state.mise, desc: "Duel gagné", date: Date.now() });
				loser.data.academie.transactions = loser.data.academie.transactions || [];
				loser.data.academie.transactions.push({ type: "duel", montant: -state.mise, desc: "Duel perdu", date: Date.now() });

				await usersData.set(winnerID, winner);
				await usersData.set(loserID, loser);
				delete duelState[threadID];

				return message.reply(fonts.bold(
`${combatMsg}

🏆 VICTOIRE DE @${winnerInfo.name} !
━━━━━━━━━━━━━━━━
💰 Gain: $${state.mise.toLocaleString()}
⭐ Réputation: +5`
				));
			}

			// Changer de tour
			state.turn = isP1Turn ? "p2" : "p1";
			const nextID = state.turn === "p1" ? state.p1ID : state.p2ID;
			const nextInfo = state.turn === "p1" ? p1Info : p2Info;
			const nextSorts = state.turn === "p1" ? state.p1Sorts : state.p2Sorts;

			const sortsDisplay = nextSorts.map((s, i) =>
				s ? `[${i + 2}] ${s.nom} — 🔵 ${s.mana} mana` : ""
			).filter(Boolean).join("\n");

			combatMsg += `\n[1] Basique\n${sortsDisplay}\n[r] Récup mana · [d] Défense`;
			combatMsg += `\n\n@${nextInfo.name} à TOI !`;

			return message.reply({
				body: combatMsg,
				mentions: [{ tag: `@${nextInfo.name}`, id: nextID }]
			});
		}
	},

	showHelp: function (message, fonts) {
		const helpText = `
${fonts.bold("🧙 ACADÉMIE DE MAGIE")}
━━━━━━━━━━━━━━━━
${fonts.bold("✨ Maîtrisez les arcanes et devenez Légende ✨")}

${fonts.bold("📘 BASES")} ${fonts.bold("━━━━━━━━━━━━━")}
🔮 academie profil - Voir votre profil de mage complet
📖 academie sorts [liste] - Voir votre grimoire de sorts
📚 academie apprendre <ID> - Apprendre un nouveau sort
⚡ academie lancer <ID> - Lancer un sort pour gagner de l'or
🧘 academie mediter - Régénérer votre mana (cooldown 1h)
🎁 academie daily - Récompense quotidienne du mage

${fonts.bold("🐾 FAMILIERS")} ${fonts.bold("━━━━━━━━━━━━━")}
🐈‍⬛ academie familier liste - Voir les familiers disponibles
🐾 academie familier acheter <ID> - Adopter un familier

${fonts.bold("🔮 ARTEFACTS")} ${fonts.bold("━━━━━━━━━━━━━")}
💍 academie artefact liste - Voir les artefacts magiques
✨ academie artefact acheter <ID> - Acquérir un artefact

${fonts.bold("🧪 POTIONS")} ${fonts.bold("━━━━━━━━━━━━━")}
⚗️ academie potion liste - Voir les potions disponibles
🧪 academie potion acheter <ID> <nb> - Acheter une potion
🍷 academie boire <ID> - Boire une potion de votre inventaire

${fonts.bold("⚔️ DUELS & SOCIAL")} ${fonts.bold("━━━━━━━━━━━━━")}
⚔️ academie duel <@mage> <mise> - Défier un autre mage
🏆 academie achievements - Vos exploits magiques
🏆 academie leaderboard - Classement des mages
📋 academie histoire - Vos 15 dernières actions magiques
`;
		return message.reply(helpText);
	},

	getGrade: function (academie) {
		const grimoire = this.grimoire;
		let grade = grimoire.grades[0];
		for (const g of grimoire.grades) {
			if (academie.totalGagne >= g.min) grade = g;
			else break;
		}
		return grade;
	},

	getBonusMana: function (academie) {
		let bonus = 0;
		for (const aId of academie.artefacts) {
			const a = this.grimoire.artefacts[aId];
			if (a && a.bonus === "mana") bonus += a.val;
		}
		return bonus;
	},

	getBonusSort: function (academie) {
		let bonus = 0;
		for (const aId of academie.artefacts) {
			const a = this.grimoire.artefacts[aId];
			if (a && a.bonus === "sort") bonus += a.val;
		}
		for (const fId of academie.familiers) {
			const f = this.grimoire.familiers[fId];
			if (f) bonus += f.bonus;
		}
		return bonus;
	},

	showProfil: function (message, academie, walletBalance, fonts) {
		const grade = this.getGrade(academie);
		const grimoire = this.grimoire;
		const idx = grimoire.grades.findIndex(g => g.id === grade.id);
		const next = grimoire.grades[idx + 1] || null;
		const manaMax = academie.manaMax + this.getBonusMana(academie);
		const bonusSort = this.getBonusSort(academie);

		const winRate = academie.totalDuels > 0 ? Math.round((academie.duelsGagnes / academie.totalDuels) * 100) : 0;

		const profilText = `
${fonts.bold("🧙 PROFIL DE MAGE")} ${grade.emoji}
━━━━━━━━━━━━━━━━
${fonts.bold(grade.emoji + " " + grade.nom)} ${academie.streak > 0 ? `• 🔥 ${academie.streak} jours` : ""}

${fonts.bold("💰 RICHESSE")} ${fonts.bold("━━━━━━━━━━━━━")}
💵 Bourse: ${fonts.bold("$" + walletBalance.toLocaleString())}
💎 Cristaux Arcaniques: ${fonts.bold(academie.cristaux.toLocaleString())}
⭐ Or Total Gagné: ${fonts.bold("$" + academie.totalGagne.toLocaleString())}
${next ? `📈 Prochain grade: ${fonts.bold("$" + next.min.toLocaleString())} (${next.emoji} ${next.nom})` : "👑 Grade Maximum Atteint !"}

${fonts.bold("🔵 MANA & POUVOIR")} ${fonts.bold("━━━━━━━━━━━━━")}
🔵 Mana: ${fonts.bold(academie.mana + "/" + manaMax)}
✨ Bonus de Sort: ${fonts.bold("+" + Math.round(bonusSort * 100) + "%")}
📖 Sorts Appris: ${fonts.bold(academie.sortsAppris.length + "/" + Object.keys(grimoire.sorts).length)}

${fonts.bold("🐾 COMPAGNONS & RELIQUES")} ${fonts.bold("━━━━━━━━━━━━━")}
🐾 Familiers: ${fonts.bold(academie.familiers.length)}
💍 Artefacts: ${fonts.bold(academie.artefacts.length)}

${fonts.bold("⚔️ COMBAT")} ${fonts.bold("━━━━━━━━━━━━━")}
⚔️ Duels Livrés: ${fonts.bold(academie.totalDuels)}
🏅 Duels Gagnés: ${fonts.bold(academie.duelsGagnes)} (${winRate}%)
⭐ Réputation: ${fonts.bold(academie.reputation)} ${academie.reputation >= 100 ? "👑" : ""}

${fonts.bold("🏆 PROGRESSION")} ${fonts.bold("━━━━━━━━━━━━━")}
🏆 Exploits: ${fonts.bold((academie.achievements?.length || 0) + "/10")}`;
		return message.reply(profilText);
	},

	showSorts: function (message, args, academie, fonts) {
		const grimoire = this.grimoire;
		let text = `${fonts.bold("📖 GRIMOIRE DE SORTS")}\n━━━━━━━━━━━━━━━━\n\n`;
		for (const [id, s] of Object.entries(grimoire.sorts)) {
			const appris = academie.sortsAppris.includes(id);
			text += `${appris ? "✅" : "🔒"} ${fonts.bold(s.nom)} [${id}]\n`;
			text += `   École: ${s.ecole} · Niveau: ${s.niveau}\n`;
			text += `   💰 Coût: $${s.cout.toLocaleString()} · 🔵 Mana: ${s.mana}\n`;
			text += `   💵 Gain: $${s.gain[0].toLocaleString()}-$${s.gain[1].toLocaleString()}\n\n`;
		}
		text += `Apprendre: academie apprendre <ID>\nLancer: academie lancer <ID>`;
		return message.reply(text);
	},

	apprendreSort: async function (message, args, user, academie, fonts, save) {
		const sId = (args[1] || "").toUpperCase();
		const sort = this.grimoire.sorts[sId];
		if (!sort) {
			return message.reply(fonts.bold("❌ Sort inconnu. Tapez 'academie sorts' pour voir le grimoire."));
		}
		if (academie.sortsAppris.includes(sId)) {
			return message.reply(fonts.bold("❌ Vous connaissez déjà ce sort."));
		}
		const walletBalance = user.money || 0;
		if (walletBalance < sort.cout) {
			return message.reply(fonts.bold(`❌ Fonds insuffisants.\nCoût: $${sort.cout.toLocaleString()}\nBourse: $${walletBalance.toLocaleString()}`));
		}
		user.money -= sort.cout;
		academie.sortsAppris.push(sId);
		academie.transactions.push({ type: "apprentissage", montant: -sort.cout, desc: `Sort appris: ${sort.nom}`, date: Date.now() });
		await save();
		return message.reply(fonts.bold(`
✨ SORT APPRIS !
━━━━━━━━━━━━━━━━

📖 Sort: ${sort.nom}
🏫 École: ${sort.ecole}
💰 Coût: $${sort.cout.toLocaleString()}
🔵 Coût en Mana: ${sort.mana}

💡 Lancez-le avec: academie lancer ${sId}
		`.trim()));
	},
