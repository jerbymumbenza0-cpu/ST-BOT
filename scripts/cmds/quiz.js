const axios = require("axios");

const QUESTION_TIMEOUT_MS = 30000;
const QUESTIONS_PER_SESSION = 6;

const CATEGORIES = {
  "1": { name: "🧠 Culture générale", code: "general" },
  "2": { name: "🔬 Science & Tech", code: "science" },
  "3": { name: "📜 Histoire & Littérature", code: "history_lit" }
};

// 15 questions par catégorie en français (45 questions au total, 6 tirées au hasard par partie)
const CATEGORY_QUESTIONS_FR = {
  general: [
    { question: "Quelle est la capitale de la République démocratique du Congo ?", options: { A: "Lubumbashi", B: "Kinshasa", C: "Goma", D: "Matadi" }, correct: "B" },
    { question: "Combien y a-t-il de jours dans une année bissextile ?", options: { A: "364", B: "365", C: "366", D: "367" }, correct: "C" },
    { question: "Quel est l'océan le plus vaste de la Terre ?", options: { A: "Atlantique", B: "Indien", C: "Pacifique", D: "Arctique" }, correct: "C" },
    { question: "Combien de couleurs comporte l'arc-en-ciel classique ?", options: { A: "5", B: "6", C: "7", D: "8" }, correct: "C" },
    { question: "Quel instrument mesure la température ?", options: { A: "Le baromètre", B: "Le thermomètre", C: "L'hygromètre", D: "L'anémomètre" }, correct: "B" },
    { question: "Combien de minutes y a-t-il dans deux heures ?", options: { A: "90", B: "100", C: "120", D: "150" }, correct: "C" },
    { question: "Quel métal est liquide à température ambiante ?", options: { A: "Le fer", B: "Le mercure", C: "Le cuivre", D: "L'aluminium" }, correct: "B" },
    { question: "Combien de côtés a un hexagone ?", options: { A: "5", B: "6", C: "7", D: "8" }, correct: "B" },
    { question: "Quel organe pompe le sang dans tout le corps humain ?", options: { A: "Le foie", B: "Le cœur", C: "Le poumon", D: "Le rein" }, correct: "B" },
    { question: "Quel est le plus long fleuve d'Afrique ?", options: { A: "Le Niger", B: "Le Nil", C: "Le Zambèze", D: "Le Sénégal" }, correct: "B" },
    { question: "Combien de continents sont généralement dénombrés ?", options: { A: "5", B: "6", C: "7", D: "8" }, correct: "C" },
    { question: "Quelle est la capitale de la France ?", options: { A: "Lyon", B: "Marseille", C: "Paris", D: "Nice" }, correct: "C" },
    { question: "Quel est l'astre le plus proche de la Terre ?", options: { A: "Le Soleil", B: "Mars", C: "Jupiter", D: "Saturne" }, correct: "A" },
    { question: "Quelle saison suit l'été dans l'hémisphère nord ?", options: { A: "Le printemps", B: "L'automne", C: "L'hiver", D: "La mousson" }, correct: "B" },
    { question: "Combien font 15 + 27 ?", options: { A: "32", B: "42", C: "52", D: "48" }, correct: "B" }
  ],
  science: [
    { question: "Quelle planète du système solaire est la plus proche du Soleil ?", options: { A: "Vénus", B: "Mars", C: "Mercure", D: "Saturne" }, correct: "C" },
    { question: "Quel est l'élément chimique de symbole 'O' ?", options: { A: "Or", B: "Osmium", C: "Oxygène", D: "Oganesson" }, correct: "C" },
    { question: "Quelle est la formule chimique de l'eau ?", options: { A: "CO2", B: "H2O", C: "NaCl", D: "O3" }, correct: "B" },
    { question: "Quelle particule a une charge électrique négative dans un atome ?", options: { A: "Le proton", B: "L'électron", C: "Le neutron", D: "Le photon" }, correct: "B" },
    { question: "Quel gaz les plantes absorbent-elles principalement pour la photosynthèse ?", options: { A: "Le dioxyde de carbone", B: "L'azote", C: "L'hélium", D: "Le monoxyde de carbone" }, correct: "A" },
    { question: "Quelle est la vitesse approximative de la lumière dans le vide ?", options: { A: "300 000 km/s", B: "150 000 km/s", C: "30 000 km/s", D: "3 000 km/s" }, correct: "A" },
    { question: "Quel protocole réseau sécurise principalement la navigation web ?", options: { A: "FTP", B: "HTTPS", C: "SMTP", D: "Telnet" }, correct: "B" },
    { question: "Quelle planète est surnommée la planète rouge ?", options: { A: "Jupiter", B: "Mars", C: "Vénus", D: "Neptune" }, correct: "B" },
    { question: "Que signifie la cybersécurité '2FA' ou A2F ?", options: { A: "Double authentification", B: "Format audio", C: "Transfert de fichiers", D: "Mise en veille" }, correct: "A" },
    { question: "Quel format léger est très utilisé pour échanger des données structurées sur le web ?", options: { A: "JSON", B: "BMP", C: "WAV", D: "EXE" }, correct: "A" },
    { question: "Quel est l'élément chimique de symbole 'Au' ?", options: { A: "Argent", B: "Or", C: "Aluminium", D: "Argon" }, correct: "B" },
    { question: "Quel organite cellulaire est souvent appelé la centrale énergétique de la cellule ?", options: { A: "La mitochondrie", B: "Le ribosome", C: "Le noyau", D: "La membrane" }, correct: "A" },
    { question: "À quelle température l'eau bout-elle au niveau de la mer (pression normale) ?", options: { A: "90 °C", B: "100 °C", C: "110 °C", D: "80 °C" }, correct: "B" },
    { question: "Quel est l'os le plus long du corps humain ?", options: { A: "Le fémur", B: "L'humérus", C: "Le tibia", D: "Le radius" }, correct: "A" },
    { question: "Quel gaz compose la majeure partie de l'atmosphère terrestre ?", options: { A: "L'oxygène", B: "L'azote", C: "Le dioxyde de carbone", D: "L'argon" }, correct: "B" }
  ],
  history_lit: [
    { question: "En quelle année l'Homme a-t-il marché sur la Lune pour la première fois ?", options: { A: "1965", B: "1969", C: "1972", D: "1959" }, correct: "B" },
    { question: "Qui a écrit 'Les Misérables' ?", options: { A: "Émile Zola", B: "Victor Hugo", C: "Gustave Flaubert", D: "Honoré de Balzac" }, correct: "B" },
    { question: "Quelle civilisation construisit le Machu Picchu ?", options: { A: "Les Mayas", B: "Les Incas", C: "Les Aztèques", D: "Les Olmèques" }, correct: "B" },
    { question: "Qui est l'auteur de 'Roméo et Juliette' ?", options: { A: "Charles Dickens", B: "William Shakespeare", C: "Jane Austen", D: "Oscar Wilde" }, correct: "B" },
    { question: "En quelle année le mur de Berlin est-il tombé ?", options: { A: "1987", B: "1989", C: "1991", D: "1985" }, correct: "B" },
    { question: "Qui a écrit 'Le Petit Prince' ?", options: { A: "Antoine de Saint-Exupéry", B: "Jules Verne", C: "Albert Camus", D: "Marcel Proust" }, correct: "A" },
    { question: "Quel fleuve fut essentiel au développement de l'Égypte antique ?", options: { A: "Le Tigre", B: "Le Nil", C: "L'Euphrate", D: "Le Jourdain" }, correct: "B" },
    { question: "Qui a écrit le roman '1984' ?", options: { A: "Aldous Huxley", B: "George Orwell", C: "Ray Bradbury", D: "H. G. Wells" }, correct: "B" },
    { question: "En quelle année a eu lieu la Révolution française ?", options: { A: "1776", B: "1789", C: "1804", D: "1848" }, correct: "B" },
    { question: "Qui est l'auteur de 'Vingt Mille Lieues sous les mers' ?", options: { A: "Jules Verne", B: "Alexandre Dumas", C: "Guy de Maupassant", D: "Molière" }, correct: "A" },
    { question: "En quelle année a débuté la Première Guerre mondiale ?", options: { A: "1912", B: "1914", C: "1918", D: "1939" }, correct: "B" },
    { question: "Qui était le premier président des États-Unis ?", options: { A: "Thomas Jefferson", B: "George Washington", C: "Abraham Lincoln", D: "John Adams" }, correct: "B" },
    { question: "Qui a inventé l'imprimerie à caractères mobiles en Europe au XVe siècle ?", options: { A: "Johannes Gutenberg", B: "Léonard de Vinci", C: "Marco Polo", D: "Blaise Pascal" }, correct: "A" },
    { question: "En quelle année la Seconde Guerre mondiale a-t-elle pris fin ?", options: { A: "1943", B: "1944", C: "1945", D: "1946" }, correct: "C" },
    { question: "Quel dramaturge français a écrit 'L'Avare' et 'Le Malade imaginaire' ?", options: { A: "Molière", B: "Racine", C: "Corneille", D: "Voltaire" }, correct: "A" }
  ]
};

const activeTimers = new Map();

function clearQuestionTimer(messageID) {
  if (!messageID) return;
  const timer = activeTimers.get(messageID);
  if (timer) {
    clearTimeout(timer);
    activeTimers.delete(messageID);
  }
}

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildCategorySessionQueue(categoryCode) {
  const categoryPool = CATEGORY_QUESTIONS_FR[categoryCode] || CATEGORY_QUESTIONS_FR.general || [];
  return shuffleArray(categoryPool).slice(0, QUESTIONS_PER_SESSION);
}

function resolveCorrectLetter(quizData) {
  const rawCorrect = String(quizData.correct || "").trim();
  const upper = rawCorrect.toUpperCase();

  if (["A", "B", "C", "D"].includes(upper)) {
    return upper;
  }

  if (quizData.options) {
    for (const [key, val] of Object.entries(quizData.options)) {
      if (String(val).trim().toLowerCase() === rawCorrect.toLowerCase()) {
        return String(key).toUpperCase();
      }
    }
  }

  return upper;
}

function calculateReward() {
  const randomValue = Math.random();
  if (randomValue < 0.7) {
    return Math.floor(Math.random() * 900) + 100;
  }
  if (randomValue < 0.95) {
    return Math.floor(Math.random() * 500) + 1000;
  }
  return Math.floor(Math.random() * 501) + 1500;
}

async function tryFetchApiQuestion(selectedCategory) {
  if (!global.utils || typeof global.utils.STBotApis !== "function") {
    return null;
  }

  const stbotApi = new global.utils.STBotApis();
  if (!stbotApi || !stbotApi.baseURL) {
    return null;
  }

  try {
    const response = await axios.post(
      `${stbotApi.baseURL}/api/quiz/generate`,
      {
        language: "french",
        category: selectedCategory.code
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 4000
      }
    );

    if (response.data && response.data.success && response.data.data && response.data.data.question) {
      return response.data.data;
    }
  } catch (_) {}

  return null;
}

async function finishSession({ message, api, quizMessageID, session, stoppedEarly = false }) {
  clearQuestionTimer(quizMessageID);
  if (quizMessageID && global.GoatBot && global.GoatBot.onReply) {
    global.GoatBot.onReply.delete(quizMessageID);
  }

  const total = session.questionQueue.length;
  const header = stoppedEarly
    ? `🛑 Partie arrêtée — ${session.selectedCategory.name}`
    : `🏁 Quiz terminé — ${session.selectedCategory.name}`;

  const summaryText =
    `${header}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📊 Score : ${session.correctCount}/${total} bonnes réponses\n` +
    `💰 Total gagné : ${session.totalEarned} coins\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Relancez la commande pour rejouer !`;

  if (api && typeof api.editMessage === "function") {
    try {
      await api.editMessage(summaryText, quizMessageID);
      return;
    } catch (_) {}
  }

  await message.reply(summaryText);
}

async function sendQuestionAtIndex({
  message,
  event,
  api,
  commandName,
  session,
  index
}) {
  if (session.stopped) return;

  const total = session.questionQueue.length;
  if (index >= total) {
    await finishSession({
      message,
      api,
      quizMessageID: session.currentMessageID,
      session,
      stoppedEarly: false
    });
    return;
  }

  let quizData = session.questionQueue[index];
  if (session.useExternalApi) {
    const apiQuestion = await tryFetchApiQuestion(session.selectedCategory);
    if (apiQuestion && apiQuestion.options) {
      quizData = apiQuestion;
    }
  }

  const questionNumber = index + 1;
  const optionsText = Object.entries(quizData.options || {})
    .map(([key, value]) => `${String(key).toUpperCase()}. ${value}`)
    .join("\n\n");

  const sent = await message.reply(
    `🎮 ${session.selectedCategory.name} — Question ${questionNumber}/${total}\n` +
    `⏱️ Temps restant : 30 secondes\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `❓ ${quizData.question}\n\n` +
    `${optionsText}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💡 Répondez par A, B, C ou D • Écrivez "fin" pour arrêter`
  );

  session.currentIndex = index;
  session.currentMessageID = sent.messageID;
  session.answered = false;

  const replyPayload = {
    commandName,
    messageID: sent.messageID,
    author: event.senderID,
    type: "answerQuiz",
    quizData,
    session,
    quizMessageID: sent.messageID
  };

  global.GoatBot.onReply.set(sent.messageID, replyPayload);

  clearQuestionTimer(sent.messageID);
  const timer = setTimeout(async () => {
    activeTimers.delete(sent.messageID);

    const currentReply = global.GoatBot.onReply.get(sent.messageID);
    if (!currentReply || session.answered || session.stopped) return;

    session.answered = true;
    global.GoatBot.onReply.delete(sent.messageID);

    const correctLetter = resolveCorrectLetter(quizData);
    const correctText = quizData.options && quizData.options[correctLetter]
      ? `${correctLetter}. ${quizData.options[correctLetter]}`
      : correctLetter;

    if (api && typeof api.editMessage === "function") {
      try {
        await api.editMessage(
          `⏰ Temps écoulé (30s) — Question ${questionNumber}/${total}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Bonne réponse : ${correctText}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `⏳ Question suivante...`,
          sent.messageID
        );
      } catch (_) {}
    }

    setTimeout(async () => {
      if (session.stopped) return;
      try {
        await sendQuestionAtIndex({
          message,
          event,
          api,
          commandName,
          session,
          index: index + 1
        });
      } catch (err) {
        console.error("Quiz timeout next question error:", err);
        await message.reply("❌ Impossible de charger la question suivante.");
      }
    }, 1500);
  }, QUESTION_TIMEOUT_MS);

  activeTimers.set(sent.messageID, timer);
  return sent;
}

module.exports = {
  config: {
    name: "quiz",
    aliases: [],
    version: "3.8.0",
    author: "ST | Sheikh Tamim (FR by assistant)",
    countDown: 5,
    role: 0,
    description: "Quiz interactif en français (6 questions au hasard par partie, 30s/question, arrêt avec 'fin')",
    category: "game",
    guide: {
      fr: "{pn} - Démarrer un quiz en français\nChoisissez une catégorie (6 questions aléatoires par partie, 30s par question, écrivez 'fin' pour arrêter)"
    }
  },

  ST: async function({ message, event }) {
    const categoryText = Object.entries(CATEGORIES)
      .map(([num, cat]) => `${num}. ${cat.name}`)
      .join("\n");

    const sent = await message.reply(
      `🎮 Quiz (Français) - Choix de la catégorie\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Format : ${QUESTIONS_PER_SESSION} questions au hasard • 30s/question\n` +
      `🛑 Écrivez "fin" à tout moment pour arrêter\n\n` +
      `${categoryText}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 Répondez avec le numéro de la catégorie (1 à 3)`
    );

    global.GoatBot.onReply.set(sent.messageID, {
      commandName: module.exports.config.name,
      messageID: sent.messageID,
      author: event.senderID,
      type: "selectCategory",
      categoryOptions: CATEGORIES
    });
  },

  onReply: async function({ Reply, message, event, args, usersData, api }) {
    const { author, type, categoryOptions } = Reply;

    if (author !== event.senderID) return;

    const userInput = (args && args.length ? args.join(" ") : event.body || "").trim();

    if (type === "selectCategory") {
      try {
        await message.unsend(Reply.messageID);
      } catch (_) {}

      if (userInput.toLowerCase() === "fin") {
        global.GoatBot.onReply.delete(Reply.messageID);
        return message.reply("🛑 Quiz annulé avant le démarrage.");
      }

      const pool = categoryOptions || CATEGORIES;
      if (!pool[userInput]) {
        return message.reply("❌ Catégorie invalide. Répondez avec un numéro de 1 à 3 (ou 'fin').");
      }

      const category = pool[userInput];
      const questionQueue = buildCategorySessionQueue(category.code);

      const session = {
        author: event.senderID,
        selectedCategory: category,
        questionQueue,
        currentIndex: 0,
        correctCount: 0,
        totalEarned: 0,
        answered: false,
        stopped: false,
        currentMessageID: null,
        useExternalApi: false
      };

      try {
        await sendQuestionAtIndex({
          message,
          event,
          api,
          commandName: module.exports.config.name,
          session,
          index: 0
        });
      } catch (err) {
        console.error("Quiz initial load error:", err);
        return message.reply("❌ Impossible de charger le quiz pour le moment. Réessayez plus tard.");
      }
    } else if (type === "answerQuiz") {
      const { quizData, session, quizMessageID } = Reply;

      if (!session || session.answered || session.stopped) return;

      if (userInput.toLowerCase() === "fin") {
        session.answered = true;
        session.stopped = true;
        await finishSession({
          message,
          api,
          quizMessageID,
          session,
          stoppedEarly: true
        });
        return;
      }

      const answer = userInput.toUpperCase();
      if (!["A", "B", "C", "D"].includes(answer)) {
        return message.reply('❌ Répondez uniquement par A, B, C ou D (ou écrivez "fin" pour arrêter).');
      }

      session.answered = true;
      clearQuestionTimer(quizMessageID);
      global.GoatBot.onReply.delete(quizMessageID);

      const questionNumber = session.currentIndex + 1;
      const total = session.questionQueue.length;
      const correctLetter = resolveCorrectLetter(quizData);
      const isCorrect = answer === correctLetter;

      const scheduleNext = () => {
        setTimeout(async () => {
          if (session.stopped) return;
          try {
            await sendQuestionAtIndex({
              message,
              event,
              api,
              commandName: module.exports.config.name,
              session,
              index: session.currentIndex + 1
            });
          } catch (err) {
            console.error("Quiz next question error:", err);
            await message.reply("❌ Impossible de charger la question suivante.");
          }
        }, 1800);
      };

      if (isCorrect) {
        const reward = calculateReward();

        try {
          const userData = await usersData.addMoney(event.senderID, reward);
          if (!userData) {
            throw new Error("Failed to update user balance");
          }

          session.correctCount += 1;
          session.totalEarned += reward;

          if (api && typeof api.editMessage === "function") {
            try {
              await api.editMessage(
                `✅ Bonne réponse ! (${questionNumber}/${total})\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `💰 Vous avez gagné ${reward} coins !\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `⏳ Question suivante...`,
                quizMessageID
              );
            } catch (_) {}
          }

          scheduleNext();
        } catch (err) {
          console.error("Quiz reward error:", err);
          return message.reply("❌ Erreur lors de l'ajout des coins. Réessayez plus tard.");
        }
      } else {
        const correctText = quizData.options && quizData.options[correctLetter]
          ? `${correctLetter}. ${quizData.options[correctLetter]}`
          : correctLetter;

        if (api && typeof api.editMessage === "function") {
          try {
            await api.editMessage(
              `❌ Mauvaise réponse ! (${questionNumber}/${total})\n\n` +
              `━━━━━━━━━━━━━━━━━━━━━━\n` +
              `Bonne réponse : ${correctText}\n` +
              `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
              `⏳ Question suivante...`,
              quizMessageID
            );
          } catch (_) {}
        }

        scheduleNext();
      }
    }
  }
};
                                                                                   
