const { createCanvas } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "pirate",
        aliases: ["vole", "jacksparrow", "darkpirate"],
        version: "2.8",
        author: "国︱PEDRI ぐ條",
        countDown: 0,
        role: 0,
        shortDescription: {
            fr: "🏴‍☠️ Mutinerie : destitue les admins, te nomme et vire les comptes bannis/inactifs."
        },
        longDescription: {
            fr: "Retire un maximum d'admins, te nomme admin, renomme le groupe façon pirate, change l'image et expulse jusqu'à 5 comptes bannis/désactivés."
        },
        category: "admin",
        guide: {
            fr: "• pirate → Lance l'abordage et nettoie les comptes bannis/désactivés."
        }
    },

    onChat: async function({ api, event, message, args }) {
        if (!event.body) return;
        const msg = event.body.toLowerCase().trim();
        const trigger = msg.split(" ")[0];

        if (trigger === "pirate" || this.config.aliases.includes(trigger)) {
            const newArgs = msg.split(" ").slice(1);
            return this.onStart({ api, event, args: newArgs, message });
        }
    },

    onStart: async function({ api, event, args, message }) {
        const botAdmins = global.GoatBot.config.adminBot || [];
        const senderID = event.senderID;
        const threadID = event.threadID;

        try {
            if (!botAdmins.includes(senderID)) {
                return message.reply("⛓️💀 Seul le Capitaine Suprême du bot peut ordonner cette mutinerie...");
            }

            if (!event.isGroup) {
                return message.reply("🏴‍☠️ Lance cette commande dans un groupe.");
            }

            const threadInfo = await api.getThreadInfo(threadID);
            const botID = api.getCurrentUserID();
            const currentAdminIDs = threadInfo.adminIDs.map(admin => admin.id);
            const botIsAdmin = currentAdminIDs.includes(botID);

            if (!botIsAdmin) {
                return message.reply("⚔️ Le bot doit être admin du groupe pour lancer l'assaut.");
            }

            // Noms de vrais pirates / navires légendaires
            const pirateNames = [
                "Barbe Noire — Vengeance de la Reine Anne 🏴‍☠️",
                "Calico Jack — Pavillon Rouge 💀",
                "Barbe Rousse — Frères de la Côte ⚔️",
                "Charles Vane — Le Ranger Noir ⚓",
                "Tortuga — Repaire des Corsaires 🌊"
            ];
            const randomPirateName = pirateNames[Math.floor(Math.random() * pirateNames.length)];

            // 1. Changement immédiat du nom du groupe
            api.setTitle(randomPirateName, threadID).catch(e => console.error("Échec titre:", e));

            // 2. Génération de l'image Canvas style pirate
            const cachePath = path.join(__dirname, "cache", `pirate_${threadID}.png`);
            await fs.ensureDir(path.dirname(cachePath));

            const canvas = createCanvas(600, 600);
            const ctx = canvas.getContext("2d");

            ctx.fillStyle = "#0b0b0b";
            ctx.fillRect(0, 0, 600, 600);

            ctx.strokeStyle = "#990000";
            ctx.lineWidth = 16;
            ctx.strokeRect(20, 20, 560, 560);

            ctx.fillStyle = "#ff1e1e";
            ctx.font = "bold 44px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("ABORDAGE RÉUSSI", 300, 145);

            ctx.fillStyle = "#ffffff";
            ctx.font = "italic bold 26px sans-serif";
            ctx.fillText(randomPirateName.toUpperCase(), 300, 285);

            ctx.fillStyle = "#d4af37";
            ctx.font = "bold 26px sans-serif";
            ctx.fillText("NOUVEAU CAPITAINE NOMMÉ", 300, 420);

            await fs.writeFile(cachePath, canvas.toBuffer("image/png"));
            api.changeGroupImage(fs.createReadStream(cachePath), threadID).catch(e => console.error("Échec image:", e));

            // 3. Te nommer admin si tu ne l'es pas déjà
            if (!currentAdminIDs.includes(senderID)) {
                await api.changeAdminStatus(threadID, senderID, true).catch(err =>
                    console.error("Échec nomination admin:", err)
                );
            }

            // 4. Destitution répétée des autres admins (sauf le bot et toi) pour maximiser le retrait
            const adminsToRemove = currentAdminIDs.filter(id => id !== botID && id !== senderID);
            let removedAdminsCount = 0;

            for (let pass = 0; pass < 2; pass++) {
                await Promise.all(
                    adminsToRemove.map(async adminID => {
                        try {
                            await api.changeAdminStatus(threadID, adminID, false);
                            removedAdminsCount++;
                        } catch (err) {
                            // Le créateur initial d'un groupe FB ne peut pas être destitué via l'API
                        }
                    })
                );
            }

            // 5. Détection des comptes bannis / désactivés / indisponibles (sans toucher aux comptes actifs)
            const eligibleMembers = (threadInfo.participantIDs || []).filter(
                id => id !== botID && id !== senderID
            );

            let bannedOrDisabledIDs = [];

            // Vérification via userInfo si disponible dans threadInfo ou api.getUserInfo
            const infoMap = new Map();
            if (Array.isArray(threadInfo.userInfo)) {
                for (const u of threadInfo.userInfo) {
                    if (u && u.id) infoMap.set(String(u.id), u);
                }
            }

            if (typeof api.getUserInfo === "function" && eligibleMembers.length > 0) {
                try {
                    const fetchedUsers = await api.getUserInfo(eligibleMembers);
                    if (fetchedUsers && typeof fetchedUsers === "object") {
                        for (const [id, data] of Object.entries(fetchedUsers)) {
                            const prev = infoMap.get(String(id)) || {};
                            infoMap.set(String(id), { ...prev, ...data });
                        }
                    }
                } catch (e) {
                    // Fallback sur les données déjà présentes dans threadInfo
                }
            }

            for (const memberID of eligibleMembers) {
                const u = infoMap.get(String(memberID));
                const name = u && typeof u.name === "string" ? u.name.trim().toLowerCase() : "";
                const isUnavailable =
                    !u ||
                    !name ||
                    name === "facebook user" ||
                    name === "utilisateur facebook" ||
                    u.type === "Unavailable" ||
                    u.isBlocked === true;

                if (isUnavailable) {
                    bannedOrDisabledIDs.push(memberID);
                }
            }

            // Limite à 5 comptes bannis/désactivés pour garder un assaut ciblé
            const targetsToKick = bannedOrDisabledIDs.slice(0, 5);

            const kickPromises = targetsToKick.map(memberID =>
                api.removeUserFromGroup(memberID, threadID).catch(err =>
                    console.error(`Échec exclusion ${memberID}:`, err)
                )
            );
            await Promise.all(kickPromises);

            const replyMsg =
                `💀 𝑴𝑼𝑻𝑰𝑵𝑬𝑹𝑰𝑬 𝑪𝑶𝑴𝑷𝑳𝑬̀𝑻𝑬 💀\n\n` +
                `🏴‍☠️ 𝑵𝒂𝒗𝒊𝒓𝒆 : ${randomPirateName}\n` +
                `⚔️ Tentatives de destitution admins : ${adminsToRemove.length}\n` +
                `👑 Nouveau capitaine (admin) : activé\n` +
                `🦈 Comptes bannis/inactifs exclus : ${targetsToKick.length}`;

            await message.reply({
                body: replyMsg,
                attachment: fs.createReadStream(cachePath)
            });

            if (await fs.pathExists(cachePath)) {
                await fs.unlink(cachePath);
            }
        } catch (error) {
            console.error(error);
            return message.reply("⚠️ L'abordage a rencontré un problème.");
        }
    }
};
                
