
const fs = require("fs-extra");

module.exports = {
        config: {
                name: "setlang",
                version: "1.5",
                author: "国︱PEDRI ぐ條",
                countDown: 5,
                role: 0,
                description: {
                        fr: "Définir la langue du bot pour le groupe actuel ou pour tous les groupes",
                        en: "Set default language of bot for current chat or all chats"
                },
                category: "owner",
                guide: {
                        fr: "   {pn} <code de langue ISO 639-1>"
                                + "\n   Exemples :"
                                + "\n    {pn} fr"
                                + "\n    {pn} en",
                        en: "\n   {pn} <language code ISO 639-1>"
                                + "\n   Example:"
                                + "\n    {pn} en"
                                + "\n    {pn} fr"
                }
        },

        langs: {
                fr: {
                        setLangForAll: "✅ La langue par défaut du bot a été définie sur : %1",
                        setLangForCurrent: "✅ La langue par défaut de ce groupe a été définie sur : %1",
                        noPermission: "❌ Seul l'administrateur du bot peut utiliser cette commande.",
                        langNotFound: "❌ Langue introuvable : %1"
                },
                en: {
                        setLangForAll: "Set default language of bot to: %1",
                        setLangForCurrent: "Set default language for current chat: %1",
                        noPermission: "Only bot admin can use this command",
                        langNotFound: "Can't find language: %1"
                }
        },

        onStart: async function ({ message }) {
                return message.reply("🇫🇷 Le système de changement de langue a été désactivé. La langue du bot est désormais fixée au français.");
        }
};
