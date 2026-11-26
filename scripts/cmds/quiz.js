const axios = require("axios");

const TOTAL_QUESTIONS = 10;
const QUESTIONS_PER_SET = 10;
const SETS_PER_CATEGORY = 4; // 4 x 10 = 40 questions par catégorie
const QUESTION_TIMEOUT_SECONDS = 30;
const QUESTION_TIMEOUT_MS = QUESTION_TIMEOUT_SECONDS * 1000;

const DIFFICULTIES = [
  {
    name: "🟢 Facile",
    code: "easy",
    multiplier: 0.9,
    prime: 250,
    xpPerAnswer: 25,
    description: "Rythme détendu • Prime : +250 coins • +25 XP/bonne réponse"
  },
  {
    name: "🟡 Normal",
    code: "normal",
    multiplier: 1.0,
    prime: 650,
    xpPerAnswer: 40,
    description: "Équilibre standard • Prime : +650 coins • +40 XP/bonne réponse"
  },
  {
    name: "🟠 Difficile",
    code: "hard",
    multiplier: 1.4,
    prime: 1500,
    xpPerAnswer: 65,
    description: "Récompenses boostées • Prime : +1 500 coins • +65 XP/bonne réponse"
  },
  {
    name: "🔴 Extrême",
    code: "extreme",
    multiplier: 1.9,
    prime: 3500,
    xpPerAnswer: 100,
    description: "Prime maximale • Prime : +3 500 coins • +100 XP/bonne réponse"
  }
];

const SHOP_ITEMS = {
  "1": {
    id: "fifty_fifty",
    name: "✂️ Joker 50/50",
    price: 400,
    desc: "Élimine 2 mauvaises réponses sur la question actuelle"
  },
  "2": {
    id: "skip_question",
    name: "⏭️ Joker Passer",
    price: 600,
    desc: "Passe à la question suivante et compte comme réussie"
  }
};

const OBJECTIVES_CATALOG = [
  {
    id: "first_blood",
    title: "Premières étincelles",
    desc: "Réussir 5 bonnes réponses au total",
    target: 5,
    rewardCoins: 500,
    rewardXp: 120
  },
  {
    id: "streak_master",
    title: "Série en feu",
    desc: "Atteindre une série de 4 bonnes réponses d'affilée",
    target: 4,
    rewardCoins: 900,
    rewardXp: 180
  },
  {
    id: "veteran_25",
    title: "Esprit affûté",
    desc: "Réussir 25 bonnes réponses au total",
    target: 25,
    rewardCoins: 2200,
    rewardXp: 400
  },
  {
    id: "extreme_hunter",
    title: "Chasseur de l'Extrême",
    desc: "Terminer 2 parties tirées en difficulté 🔴 Extrême",
    target: 2,
    rewardCoins: 3000,
    rewardXp: 550
  },
  {
    id: "perfectionist",
    title: "Sans-faute 10/10",
    desc: "Obtenir 10/10 sur une partie complète",
    target: 1,
    rewardCoins: 4000,
    rewardXp: 700
  }
];

const CATEGORIES = {
  "1": { name: "🇧🇩 Bangladesh", code: "bd", multiplier: 1.0 },
  "2": { name: "📰 Actualités", code: "current", multiplier: 1.0 },
  "3": { name: "😂 Drôle", code: "funny", multiplier: 1.0 },
  "4": { name: "💕 Couple / Relation", code: "relationship", multiplier: 1.0 },
  "5": { name: "🧠 Général", code: "general", multiplier: 1.0 },
  "6": { name: "🔬 Science", code: "science", multiplier: 1.15 },
  "7": { name: "📜 Histoire", code: "history", multiplier: 1.15 },
  "8": { name: "⚽ Sports", code: "sports", multiplier: 1.0 },
  "9": { name: "🎬 Cinéma", code: "movies", multiplier: 1.0 },
  "10": { name: "🎵 Musique", code: "music", multiplier: 1.0 },
  "11": { name: "📚 Littérature", code: "literature", multiplier: 1.15 },
  "12": { name: "🌍 Géographie", code: "geography", multiplier: 1.1 },
  "13": { name: "🔢 Mathématiques", code: "math", multiplier: 1.2 },
  "14": { name: "🔥 MODE DIFFICILE", code: "hard", multiplier: 1.45 },
  "15": { name: "🎯 Trivia", code: "trivia", multiplier: 1.1 }
};

function makeQ(question, options, correct) {
  return { question, options, correct };
}

/**
 * 15 catégories x 4 questionnaires de 10 questions = 600 questions en français.
 */
const FRENCH_QUESTIONNAIRES_BY_CATEGORY = {
  bd: [
    {
      title: "Pack BD #1 - Géographie & Symboles",
      questions: [
        makeQ("Quelle est la capitale du Bangladesh ?", { A: "Chittagong", B: "Dacca", C: "Sylhet", D: "Khulna" }, "B"),
        makeQ("Quelle est la monnaie officielle du Bangladesh ?", { A: "Roupie", B: "Taka", C: "Kyat", D: "Ngultrum" }, "B"),
        makeQ("Quelle couleur domine le drapeau national du Bangladesh ?", { A: "Bleu foncé", B: "Vert bouteille", C: "Orange vif", D: "Violet" }, "B"),
        makeQ("Quel animal emblématique vit dans les Sundarbans au Bangladesh ?", { A: "Le léopard des neiges", B: "Le tigre royal du Bengale", C: "L'éléphant d'Asie", D: "Le panda roux" }, "B"),
        makeQ("Quelle est la plus grande forêt de mangroves partagée par le Bangladesh et l'Inde ?", { A: "Les Sundarbans", B: "La forêt de Sinharaja", C: "La forêt de Taï", D: "Le parc de Chitwan" }, "A"),
        makeQ("Quel grand fleuve traverse le Bangladesh et forme l'un des plus grands deltas du monde ?", { A: "Le Mékong", B: "Le Gange (Padma)", C: "L'Indus", D: "Le Tigre" }, "B"),
        makeQ("Quel est l'indicatif téléphonique international du Bangladesh ?", { A: "+880", B: "+977", C: "+94", D: "+60" }, "A"),
        makeQ("Quelle est la langue officielle du Bangladesh ?", { A: "Hindi", B: "Bengali (Bangla)", C: "Ourdou", D: "Assamais" }, "B"),
              makeQ("Quel grand pont relie le sud-ouest du Bangladesh au reste du pays au-dessus de la Padma ?", { A: "Le pont de Padma", B: "Le pont de Howrah", C: "Le pont de Mahákáli", D: "Le pont d'Akashi" }, "A"),
        makeQ("Quelle ville portuaire est la deuxième plus grande ville du Bangladesh ?", { A: "Rajshahi", B: "Chittagong", C: "Barisal", D: "Rangpur" }, "B")
      ]
    },
    {
      title: "Pack BD #2 - Culture & Traditions",
      questions: [
        makeQ("Quel événement du 21 février est célébré mondialement comme la Journée internationale de la langue maternelle ?", { A: "Le mouvement pour la langue bengalie", B: "La fondation de Dacca", C: "La récolte du jute", D: "L'indépendance ferroviaire" }, "A"),
        makeQ("Quel sport est extrêmement populaire et suivi au Bangladesh ?", { A: "Le hockey sur glace", B: "Le cricket", C: "Le rugby à XV", D: "Le curling" }, "B"),
        makeQ("Quel plat traditionnel accompagne presque tous les repas au Bangladesh ?", { A: "Le riz (Bhat)", B: "La polenta", C: "Le couscous de blé dur", D: "La tortilla de maïs" }, "A"),
        makeQ("Quelle fibre naturelle a longtemps été surnommée la « fibre d'or » au Bangladesh ?", { A: "Le lin", B: "Le jute", C: "Le chanvre", D: "La soie sauvage" }, "B"),
        makeQ("Quel poète bengali a écrit l'hymne national du Bangladesh « Amar Sonar Bangla » ?", { A: "Rabindranath Tagore", B: "Kazi Nazrul Islam", C: "Jasimuddin", D: "Michael Madhusudan Dutt" }, "A"),
        makeQ("Comment s'appelle le Nouvel An bengali célébré au printemps ?", { A: "Pohela Boishakh", B: "Diwali", C: "Pongal", D: "Nowruz" }, "A"),
        makeQ("Quel vêtement traditionnel les femmes portent-elles lors des grandes occasions au Bangladesh ?", { A: "Le sari", B: "Le kilt", C: "Le poncho", D: "Le hanbok" }, "A"),
        makeQ("Quelle division administrative se trouve au nord-est du Bangladesh, connue pour ses plantations de thé ?", { A: "Sylhet", B: "Khulna", C: "Jashore", D: "Patuakhali" }, "A"),
        makeQ("Quel site archéologique bouddhiste majeur du Bangladesh est classé à l'UNESCO ?", { A: "Somapura Mahavihara", B: "Borobudur", C: "Bagan", D: "Angkor Vat" }, "A"),
        makeQ("Quel moyen de transport coloré est très présent dans les rues de Dacca ?", { A: "Les pousse-pousse (rickshaws)", B: "Les tramways à crémaillère", C: "Les funiculaires", D: "Les gondoles" }, "A")
      ]
    },
    {
      title: "Pack BD #3 - Histoire & Repères",
      questions: [
        makeQ("En quelle année le Bangladesh a-t-il accédé à l'indépendance ?", { A: "1971", B: "1947", C: "1952", D: "1980" }, "A"),
        makeQ("Quel poisson très apprécié dans la gastronomie bengalie est surnommé le « roi des poissons » ?", { A: "L'Hilsa (Ilish)", B: "Le thon rouge", C: "L'espadon", D: "La morue" }, "A"),
        makeQ("Quelle ville universitaire historique se situe dans l'ouest du Bangladesh, près de la Padma ?", { A: "Rajshahi", B: "Cox's Bazar", C: "Teknaf", D: "Mongla" }, "A"),
        makeQ("Quelle plage naturelle célèbre du sud-est du Bangladesh est réputée pour sa grande longueur ?", { A: "Cox's Bazar", B: "Copacabana", C: "Waikiki", D: "Bondi Beach" }, "A"),
        makeQ("Quel domaine artistique traditionnel bengali désigne les peintures sur tissu ou rouleaux narratifs ?", { A: "Le Patachitra / art traditionnel bengali", B: "La fresque byzantine", C: "La porcelaine de Delft", D: "La mosaïque romaine" }, "A"),
        makeQ("Quelle saison apporte généralement les fortes pluies de mousson au Bangladesh ?", { A: "L'été / mousson (juin à septembre)", B: "L'hiver sec de janvier", C: "Le printemps aride", D: "Aucune saison pluvieuse" }, "A"),
        makeQ("Quel type d'écosystème caractérise les zones côtières humides du sud du Bangladesh ?", { A: "Les mangroves et marais estuariens", B: "Les toundras alpines", C: "Les steppes désertiques", D: "Les glaciers polaires" }, "A"),
        makeQ("Quelle fête religieuse majeure est largement célébrée par les musulmans du Bangladesh ?", { A: "L'Aïd el-Fitr et l'Aïd el-Adha", B: "Oktoberfest", C: "Hanami", D: "Thanksgiving" }, "A"),
        makeQ("Quel festival célèbre les couleurs et le printemps dans diverses communautés en Asie du Sud ?", { A: "Holi / festival des couleurs", B: "Carnaval de Rio", C: "La Tomatina", D: "Inti Raymi" }, "A"),
        makeQ("Quel matériau traditionnel sert souvent à la construction légère et à l'artisanat au Bangladesh ?", { A: "Le bambou", B: "Le marbre de Carrare", C: "L'ardoise", D: "Le granit" }, "A")
      ]
    },
    {
      title: "Pack BD #4 - Défis & Curiosités BD",
      questions: [
        makeQ("Quel est le nom de la rivière qui prolonge le Gange lorsqu'il entre au Bangladesh ?", { A: "La Padma", B: "Le Danube", C: "Le Rhin", D: "L'Euphrate" }, "A"),
        makeQ("Quel grand cours d'eau rejoint le système fluvial du Bangladesh depuis le nord/nord-est ?", { A: "La Jamuna / Brahmapoutre", B: "Le Colorado", C: "Le Paraná", D: "La Loire" }, "A"),
        makeQ("Dans quelle région du Bangladesh se trouvent principalement les collines de Chittagong (Hill Tracts) ?", { A: "Le sud-est montagneux", B: "Le nord-ouest plat", C: "L'extrême ouest", D: "Le centre deltaïque" }, "A"),
        makeQ("Quelle douceur lactée très populaire en Asie du Sud est préparée à base de lait réduit et de fromage frais ?", { A: "Le Rasmalai / Roshogolla", B: "Le macaron", C: "Le churro", D: "Le tiramisu" }, "A"),
        makeQ("Quel port maritime majeur est le principal poumon commercial du Bangladesh ?", { A: "Le port de Chittagong", B: "Le port de Rotterdam", C: "Le port de Valparaíso", D: "Le port de Marseille" }, "A"),
        makeQ("Quel alphabet est utilisé pour écrire le bengali ?", { A: "L'alphabet bengali (abugida)", B: "L'alphabet grec", C: "L'alphabet runique", D: "L'alphabet hébreu" }, "A"),
        makeQ("Quel animal sauvage vit aussi dans les zones boisées ou côtières du Bangladesh outre le tigre ?", { A: "Le cerf tacheté (chital)", B: "Le renne", C: "Le manchot empereur", D: "Le bison d'Amérique" }, "A"),
        makeQ("Quelle boisson traditionnelle à base de thé, lait et épices est très appréciée au Bangladesh ?", { A: "Le thé au lait / masala chai", B: "Le maté argentin", C: "Le cidre doux", D: "Le kvas" }, "A"),
        makeQ("Quel type de relief domine la majeure partie du territoire du Bangladesh ?", { A: "Une plaine alluviale et deltaïque basse", B: "Une chaîne de hauts volcans", C: "Un plateau désertique rocheux", D: "Un archipel glaciaire" }, "A"),
        makeQ("Quel est le fuseau horaire standard du Bangladesh (UTC) ?", { A: "UTC+6", B: "UTC+0", C: "UTC-5", D: "UTC+1" }, "A")
      ]
    }
  ],

  current: [
    {
      title: "Pack Actualités #1 - Monde & Tech",
      questions: [
        makeQ("Quel organisme international coordonne principalement la santé publique mondiale ?", { A: "L'OMS", B: "L'OPEP", C: "L'OACI", D: "L'UPU" }, "A"),
        makeQ("Quelle technologie permet de générer du texte, des images ou du code à partir de modèles entraînés ?", { A: "L'intelligence artificielle générative", B: "Le tube cathodique", C: "La disquette magnétique", D: "Le télégraphe optique" }, "A"),
        makeQ("Quel accord international majeur vise à limiter le réchauffement climatique mondial ?", { A: "L'Accord de Paris", B: "Le traité de Maastricht", C: "La charte de l'Atlantique", D: "Le protocole de Genève" }, "A"),
        makeQ("Quelle énergie renouvelable provient du rayonnement solaire capté par des panneaux ?", { A: "L'énergie photovoltaïque", B: "L'énergie fossile", C: "L'énergie de tourbe", D: "Le charbon pulvérisé" }, "A"),
        makeQ("Quel protocole sécurise les échanges web dans HTTPS ?", { A: "TLS / SSL", B: "FTP non chiffré", C: "Telnet", D: "GOPHER" }, "A"),
        makeQ("Quelle organisation regroupe 27 États membres européens ?", { A: "L'Union européenne", B: "Le Mercosur", C: "L'ASEAN", D: "La SADC" }, "A"),
        makeQ("Quel composant est au cœur des puces électroniques modernes ?", { A: "Les semi-conducteurs / transistors", B: "Les lampes à huile", C: "Les ressorts en laiton", D: "Les courroies en cuir" }, "A"),
        makeQ("Quel phénomène désigne la hausse durable des températures moyennes sur Terre ?", { A: "Le réchauffement climatique", B: "L'éclipse lunaire", C: "La marée de vive-eau", D: "L'aurore polaire" }, "A"),
        makeQ("À quoi sert la double authentification (2FA / MFA) ?", { A: "Ajouter une preuve d'identité au-delà du mot de passe", B: "Réduire la taille des images", C: "Accélérer un ventilateur", D: "Désactiver le pare-feu" }, "A"),
        makeQ("Quel domaine concerne les satellites d'observation terrestre et de télécommunications ?", { A: "L'aérospatiale et l'orbite terrestre", B: "La spéléologie", C: "La botanique alpine", D: "L'archéologie sous-marine" }, "A")
      ]
    },
    {
      title: "Pack Actualités #2 - Société, Économie & Médias",
      questions: [
        makeQ("Que mesure principalement l'inflation dans une économie ?", { A: "La hausse générale du niveau des prix", B: "La profondeur des océans", C: "La vitesse d'un processeur", D: "La hauteur des marées" }, "A"),
        makeQ("Pourquoi vérifier une source avant de partager une information ?", { A: "Éviter la désinformation et les rumeurs", B: "Consommer plus de batterie", C: "Bloquer le Wi-Fi", D: "Effacer l'historique" }, "A"),
        makeQ("Quelle institution gère la politique monétaire de la zone euro ?", { A: "La Banque centrale européenne (BCE)", B: "La Banque du Japon", C: "La Banque du Canada", D: "La Reserve Bank d'Australie" }, "A"),
        makeQ("Quel type de motorisation se développe pour réduire les émissions urbaines ?", { A: "Les véhicules électriques et hybrides", B: "Les locomotives au charbon", C: "Les moteurs à vapeur", D: "Les calèches" }, "A"),
        makeQ("Qu'est-ce qu'un « deepfake » ?", { A: "Un contenu audio/visuel manipulé ou généré par IA", B: "Un câble sous-marin", C: "Un disque dur SSD", D: "Un protocole réseau" }, "A"),
        makeQ("Quel principe vise à limiter les déchets en réutilisant et recyclant les matériaux ?", { A: "L'économie circulaire", B: "Le gaspillage systématique", C: "L'incinération sans tri", D: "L'abandon des emballages" }, "A"),
        makeQ("Quelle agence de l'ONU œuvre pour l'éducation, la science et la culture ?", { A: "L'UNESCO", B: "L'OMM", C: "L'UICN", D: "L'OIT" }, "A"),
        makeQ("Que signifie « open source » pour un logiciel ?", { A: "Un code accessible permettant inspection, usage et modification selon licence", B: "Un logiciel uniquement hors ligne", C: "Un mot de passe par défaut", D: "Un fichier corrompu" }, "A"),
        makeQ("Quel défi majeur accompagne les centres de données (data centers) ?", { A: "La consommation électrique et le refroidissement", B: "Le manque de lumière naturelle", C: "La rouille des coques", D: "La migration des oiseaux" }, "A"),
        makeQ("Quel est le rôle du « fact-checking » ?", { A: "Vérifier l'exactitude factuelle d'une affirmation", B: "Traduire un film en dessin animé", C: "Compresser une archive ZIP", D: "Formater une clé USB" }, "A")
      ]
    },
    {
      title: "Pack Actualités #3 - Numérique & Environnement",
      questions: [
        makeQ("Qu'est-ce que le « cloud computing » ?", { A: "L'accès à des serveurs et services informatiques à distance via réseau", B: "Un nuage météorologique", C: "Une batterie solaire", D: "Un câble audio" }, "A"),
                      makeQ("Pourquoi met-on à jour régulièrement ses applications et systèmes ?", { A: "Corriger des failles de sécurité et bugs", B: "Remplir l'espace de stockage", C: "Ralentir l'appareil", D: "Supprimer les sauvegardes" }, "A"),
        makeQ("Quelle ressource naturelle est essentielle pour les batteries rechargeables modernes ?", { A: "Le lithium (et autres métaux de batteries)", B: "La craie scolaire", C: "Le sable de plage", D: "Le plâtre" }, "A"),
        makeQ("Qu'est-ce que la biodiversité ?", { A: "La variété des êtres vivants et des écosystèmes", B: "Un modèle de smartphone", C: "Un indice boursier", D: "Une langue ancienne" }, "A"),
        makeQ("Quel outil permet de chiffrer des données pour les rendre illisibles sans clé ?", { A: "La cryptographie / chiffrement", B: "Le surligneur", C: "La loupe", D: "Le chronomètre" }, "A"),
        makeQ("Pourquoi la sauvegarde régulière (backup) est-elle cruciale ?", { A: "Protéger ses données contre la perte, panne ou rançongiciel", B: "Augmenter la résolution d'un écran", C: "Nettoyer le clavier", D: "Changer de fuseau horaire" }, "A"),
        makeQ("Quel secteur utilise la télédétection par satellite ?", { A: "La météo, l'agriculture et l'observation environnementale", B: "La reliure de livres", C: "La poterie", D: "La couture" }, "A"),
        makeQ("Qu'est-ce qu'une API dans le développement logiciel ?", { A: "Une interface permettant à deux programmes de communiquer", B: "Un écran tactile", C: "Une pile alcaline", D: "Une imprimante laser" }, "A"),
        makeQ("Quel objectif poursuit la transition énergétique ?", { A: "Diversifier vers des sources moins carbonées et plus efficaces", B: "Doubler la fumée industrielle", C: "Arrêter l'électricité", D: "Gaspller l'eau" }, "A"),
        makeQ("Quelle bonne pratique protège un compte en ligne ?", { A: "Utiliser un mot de passe unique et fort", B: "Partager son code secret", C: "Cliquer sur tous les liens suspects", D: "Réutiliser '123456' partout" }, "A")
      ]
    },
    {
      title: "Pack Actualités #4 - Science Quotidienne & Société",
      questions: [
        makeQ("Quel rôle joue la fibre optique dans les réseaux modernes ?", { A: "Transmettre des données sous forme d'impulsions lumineuses", B: "Pomper de l'eau potable", C: "Refroidir un moteur", D: "Isoler un toit" }, "A"),
        makeQ("Pourquoi l'accès à l'eau potable est-il un enjeu mondial majeur ?", { A: "C'est vital pour la santé humaine, l'agriculture et l'hygiène", B: "Pour remplir les piscines olympiques", C: "Pour laver les voitures", D: "Pour alimenter les radios" }, "A"),
        makeQ("Qu'est-ce qu'un vaccin ?", { A: "Une préparation stimulant le système immunitaire contre une maladie", B: "Un antibiotique contre les métaux", C: "Un médicament contre la faim", D: "Un produit nettoyant" }, "A"),
        makeQ("Quel moyen favorise la mobilité durable en ville ?", { A: "Les transports en commun, le vélo et la marche", B: "Les embouteillages moteurs allumés", C: "Les vols courts systématiques", D: "L'absence de trottoirs" }, "A"),
        makeQ("Qu'est-ce qu'un « phishing » (hameçonnage) ?", { A: "Une tentative frauduleuse d'obtenir des infos sensibles en se faisant passer pour un tiers", B: "Une technique de pêche en rivière", C: "Un filtre photo", D: "Une mise à jour audio" }, "A"),
        makeQ("Pourquoi la coopération internationale est-elle utile face aux pandémies ou crises ?", { A: "Partager les alertes, données scientifiques et ressources", B: "Couper toute communication", C: "Bloquer les hôpitaux", D: "Ignorer les données" }, "A"),
        makeQ("Qu'est-ce que le haut débit (fibre / 4G / 5G) ?", { A: "Une connexion offrant des débits élevés pour les données numériques", B: "Une route à péage", C: "Un barrage hydraulique", D: "Une lampe torche" }, "A"),
        makeQ("Quel impact a l'automatisation industrielle ?", { A: "Modifier les tâches de production et exiger de nouvelles compétences", B: "Supprimer les mathématiques", C: "Changer la gravité", D: "Empêcher le commerce" }, "A"),
        makeQ("Pourquoi l'éducation numérique est-elle importante aujourd'hui ?", { A: "Comprendre les outils, la vie privée et l'esprit critique en ligne", B: "Apprendre à casser des écrans", C: "Ignorer les sources", D: "Lire uniquement des codes barres" }, "A"),
        makeQ("Quel est l'intérêt d'une énergie renouvelable intermittente couplée au stockage ?", { A: "Lissert la disponibilité de l'électricité quand le soleil ou le vent baisse", B: "Produire plus de bruit", C: "Créer des pannes", D: "Remplacer l'oxygène" }, "A")
      ]
    }
  ],

  funny: [
    {
      title: "Pack Drôle #1 - Logique Absurde",
      questions: [
        makeQ("Si un coq pond un œuf juste au sommet d'un toit en pente, de quel côté tombe-t-il ?", { A: "À gauche", B: "À droite", C: "Nulle part, un coq ne pond pas d'œuf", D: "En arrière" }, "C"),
        makeQ("Quel est le comble pour un électricien ?", { A: "Ne pas être au courant", B: "Aimer le jardinage", C: "Porter des lunettes", D: "Boire du thé chaud" }, "A"),
        makeQ("Pourquoi les plongeurs basculent-ils en arrière en tombant du bateau ?", { A: "Sinon ils tomberaient dans le bateau", B: "Pour sécher plus vite", C: "Parce que l'eau est froide", D: "Pour compter les nuages" }, "A"),
        makeQ("Quel mois de l'année comporte 28 jours ?", { A: "Février uniquement", B: "Tous les mois", C: "Juillet et août", D: "Décembre uniquement" }, "B"),
        makeQ("Qu'est-ce qui a des aiguilles mais ne peut pas coudre ?", { A: "Une horloge ou un sapin", B: "Un parapluie", C: "Une cuillère", D: "Un tambour" }, "A"),
        makeQ("Quel est le comble pour un professeur de musique ?", { A: "Perdre le nord", B: "Perdre le la", C: "Perdre ses clés", D: "Perdre son parapluie" }, "B"),
        makeQ("Si vous dépassez le deuxième dans une course, quelle place prenez-vous ?", { A: "Premier", B: "Deuxième", C: "Troisième", D: "Dernier" }, "B"),
        makeQ("Quel objet devient plus mouillé à mesure qu'il sèche ?", { A: "Une serviette", B: "Une éponge sèche", C: "Une pierre", D: "Un verre" }, "A"),
        makeQ("Pourquoi les livres ont-ils toujours chaud en hiver ?", { A: "Parce qu'ils ont des couvertures", B: "Parce qu'ils lisent beaucoup", C: "Parce qu'ils sont glacés", D: "Parce qu'ils dorment" }, "A"),
        makeQ("Combien font 10 doigts sur deux mains ?", { A: "10 doigts", B: "20 doigts", C: "5 doigts", D: "8 doigts" }, "A")
      ]
    },
    {
      title: "Pack Drôle #2 - Devinettes Légères",
      questions: [
        makeQ("Qu'est-ce qui monte et ne descend jamais ?", { A: "Votre âge", B: "L'ascenseur en panne", C: "Un verre vide", D: "Un caillou" }, "A"),
        makeQ("Quel fruit est toujours de mauvaise humeur ?", { A: "La prune (qui fait la tronche)", B: "La fraise", C: "La mangue", D: "La cerise" }, "A"),
        makeQ("Combien de pommes pouvez-vous manger l'estomac vide ?", { A: "Une seule, après l'estomac n'est plus vide", B: "Dix d'affilée", C: "Zéro", D: "Cent" }, "A"),
        makeQ("Qu'est-ce qui a un lit mais ne dort jamais ?", { A: "Une rivière", B: "Un canapé", C: "Un oreiller", D: "Une couverture" }, "A"),
        makeQ("Quel est le comble pour un boulanger ?", { A: "Raconter des salades", B: "Se faire rouler dans la farine", C: "Avoir la pêche", D: "Garder la banane" }, "B"),
        makeQ("Qu'est-ce qui est à vous mais que les autres utilisent plus souvent ?", { A: "Votre prénom", B: "Votre brosse à dents", C: "Vos chaussettes", D: "Votre téléphone" }, "A"),
        makeQ("Quel animal est drôle quand il fait du ski ?", { A: "Un pingouin en combinaison", B: "Un escargot", C: "Une huître", D: "Un ver de terre" }, "A"),
        makeQ("Qu'est-ce qui est plein de trous mais retient quand même l'eau ?", { A: "Une éponge", B: "Une passoire percée", C: "Un filet de pêche", D: "Un panier" }, "A"),
        makeQ("Pourquoi le parapluie est-il optimiste ?", { A: "Parce qu'il s'ouvre dès qu'il pleut", B: "Parce qu'il rit", C: "Parce qu'il brille", D: "Parce qu'il chante" }, "A"),
        makeQ("Quel est le comble pour un jardinier ?", { A: "Se faire planter / manquer de pot", B: "Aimer la pluie", C: "Porter des bottes", D: "Avoir des graines" }, "A")
      ]
    },
    {
      title: "Pack Drôle #3 - Humour de Bureau & École",
      questions: [
        makeQ("Quel est le comble pour un mathématicien ?", { A: "Ne pas compter sur les autres / perdre le fil", B: "Aimer les chiffres", C: "Tracer un cercle", D: "Additionner" }, "A"),
        makeQ("Qu'est-ce qui a des dents mais ne mord jamais ?", { A: "Un peigne ou une scie", B: "Un chien", C: "Un lion", D: "Un requin" }, "A"),
        makeQ("Quel est le comble pour un plombier ?", { A: "Avoir une fuite d'idées / perdre la boule", B: "Aimer l'eau", C: "Porter un bleu", D: "Avoir une clé" }, "A"),
        makeQ("Quel jour de la semaine n'aime pas les lundis ?", { A: "Presque tout le monde après un bon week-end", B: "Le calendrier", C: "L'horloge", D: "La gomme" }, "A"),
        makeQ("Qu'est-ce qui court mais n'a pas de jambes ?", { A: "L'eau d'un ruisseau ou le temps", B: "Une chaise", C: "Une table", D: "Un mur" }, "A"),
        makeQ("Quel est le comble pour un peintre ?", { A: "En voir de toutes les couleurs / broyer du noir", B: "Avoir des pinceaux", C: "Aimer la toile", D: "Utiliser du bleu" }, "A"),
        makeQ("Qu'est-ce qui a des branches mais pas de feuilles ?", { A: "Une banque, une rivière ou des lunettes", B: "Un chêne en juin", C: "Un sapin", D: "Une rose" }, "A"),
        makeQ("Pourquoi la tomate rougit-elle ?", { A: "Parce qu'elle voit la salade arriver", B: "Parce qu'elle fait du sport", C: "Parce qu'elle chante", D: "Parce qu'elle dort" }, "A"),
        makeQ("Quel est le comble pour un astronaute ?", { A: "Être dans la lune", B: "Regarder le ciel", C: "Porter un casque", D: "Aimer les étoiles" }, "A"),
        makeQ("Qu'est-ce qui grandit quand on lui enlève des lettres ?", { A: "Un trou", B: "Un arbre", C: "Un ballon", D: "Un livre" }, "A")
      ]
    },
    {
      title: "Pack Drôle #4 - Énigmes rigolotes",
      questions: [
        makeQ("Quel animal a le plus de chance d'être drôle en pyjama ?", { A: "Un panda ou un chaton", B: "Une pierre", C: "Un caillou", D: "Un nuage" }, "A"),
        makeQ("Qu'est-ce qui a un cou mais pas de tête ?", { A: "Une bouteille ou un pull à col roulé", B: "Un humain", C: "Un cheval", D: "Un oiseau" }, "A"),
        makeQ("Quel est le comble pour un facteur ?", { A: "Perdre la lettre / ne pas avoir de timbre", B: "Marcher", C: "Livrer du courrier", D: "Avoir un sac" }, "A"),
        makeQ("Qu'est-ce qui tombe sans se faire mal ?", { A: "La nuit ou la pluie sur l'eau", B: "Un verre sur le carrelage", C: "Un téléphone sur l'écran", D: "Une assiette" }, "A"),
        makeQ("Quel est le comble pour un magicien ?", { A: "Disparaître sans laisser d'adresse", B: "Faire un tour de cartes", C: "Porter un chapeau", D: "Saluer le public" }, "A"),
        makeQ("Qu'est-ce qui est noir quand c'est propre et blanc quand c'est sale ?", { A: "Un tableau noir à la craie", B: "Une feuille blanche", C: "Un nuage", D: "De la neige" }, "A"),
        makeQ("Quel fruit porte le nom d'une couleur et d'un agrume ?", { A: "L'orange", B: "La banane", C: "La poire", D: "La figue" }, "A"),
        makeQ("Pourquoi les oiseaux volent-ils vers le sud en hiver ?", { A: "Parce que c'est trop loin à pied", B: "Pour acheter des glaces", C: "Parce qu'ils ont oublié le nord", D: "Pour faire du ski" }, "A"),
        makeQ("Quel est le comble pour un horloger ?", { A: "Ne jamais avoir le temps", B: "Regarder l'heure", C: "Réparer une montre", D: "Entendre tic-tac" }, "A"),
        makeQ("Qu'est-ce qui commence par un 'E', finit par un 'E' et ne contient qu'une lettre ?", { A: "Une enveloppe", B: "Une étoile", C: "Une école", D: "Une échelle" }, "A")
      ]
    }
  ],
                                           
  relationship: [
    {
      title: "Pack Couple / Relation #1 - Communication & Respect",
      questions: [
        makeQ("Quel est l'un des piliers d'une relation saine ?", { A: "La communication honnête et l'écoute", B: "Ignorer les messages", C: "Garder tous les malentendus", D: "Imposer ses choix sans parler" }, "A"),
        makeQ("Que signifie l'écoute active ?", { A: "Être attentif et comprendre sans couper la parole", B: "Préparer sa réplique avant la fin", C: "Regarder son écran en silence", D: "Minimiser les ressentis" }, "A"),
        makeQ("Comment réagir sainement après un désaccord ?", { A: "Apaiser la tension et dialoguer avec respect", B: "Bouder pendant trois semaines", C: "Publier des piques en public", D: "Refuser toute discussion" }, "A"),
        makeQ("Quel rôle joue la confiance dans une relation ?", { A: "Créer un climat de sécurité mutuelle", B: "Remplacer le respect", C: "Empêcher de parler", D: "Rendre l'attention inutile" }, "A"),
        makeQ("Qu'est-ce qu'une limite saine (« boundary ») ?", { A: "Exprimer clairement ce qui est acceptable pour soi", B: "Contrôler tous les gestes de l'autre", C: "Couper tout lien extérieur", D: "Exiger une réponse instantanée" }, "A"),
        makeQ("Pourquoi les petites attentions comptent-elles ?", { A: "Elles nourrissent la complicité au quotidien", B: "Elles remplacent l'honnêteté", C: "Elles n'existent qu'aux fêtes", D: "Elles n'ont aucun impact" }, "A"),
        makeQ("Quelle attitude favorise l'empathie ?", { A: "Chercher à comprendre le ressenti de l'autre", B: "Toujours vouloir avoir raison", C: "Juger sans écouter", D: "Ignorer la fatigue de l'autre" }, "A"),
        makeQ("Pourquoi garder chacun son espace personnel ?", { A: "S'épanouir individuellement et enrichir la relation", B: "S'éloigner pour toujours", C: "Par manque d'intérêt", D: "Éviter tout projet commun" }, "A"),
        makeQ("Qu'est-ce qu'un compromis équilibré ?", { A: "Chacun fait un pas sans s'effacer totalement", B: "Un seul décide toujours", C: "Personne n'écoute l'autre", D: "Fuir le sujet" }, "A"),
        makeQ("Quelle qualité aide face aux épreuves ?", { A: "Le soutien mutuel et la solidarité", B: "Le reproche constant", C: "L'indifférence", D: "La fuite systématique" }, "A")
      ]
    },
    {
      title: "Pack Couple / Relation #2 - Complicité & Maturité",
      questions: [
        makeQ("Qu'est-ce que la gratitude dans une relation ?", { A: "Reconnaître et remercier pour les gestes de l'autre", B: "Compter les points en permanence", C: "Ne jamais dire merci", D: "Exiger la perfection" }, "A"),
        makeQ("Quel signe montre de la maturité lors d'une dispute ?", { A: "Traiter le problème sans attaquer la personne", B: "Crier plus fort", C: "Ramener d'anciennes erreurs", D: "Claquer la porte sans mot" }, "A"),
        makeQ("Pourquoi être clair sur ses attentes ?", { A: "Éviter les malentendus et déceptions évitables", B: "Créer des disputes", C: "Supprimer la spontanéité", D: "Empêcher toute surprise" }, "A"),
        makeQ("Quel rôle joue l'humour partagé ?", { A: "Détendre l'atmosphère et renforcer la complicité", B: "Blesser sous couvert de blague", C: "Remplacer des excuses sincères", D: "Empêcher tout échange sérieux" }, "A"),
        makeQ("Que faire quand on a tort ?", { A: "Reconnaître sa part et s'excuser sincèrement", B: "Nier l'évidence", C: "Accuser l'autre", D: "Changer brusquement de sujet" }, "A"),
        makeQ("Pourquoi respecter les besoins de l'autre même différents ?", { A: "Préserver le respect et la confiance", B: "Gagner un débat", C: "Paraître détaché", D: "Se désengager" }, "A"),
        makeQ("Qu'est-ce qui renforce l'esprit d'équipe ?", { A: "Avancer ensemble face aux défis", B: "Tout transformer en compétition", C: "Agir sans prévenir", D: "Ignorer l'autre" }, "A"),
        makeQ("Pourquoi la patience est-elle précieuse ?", { A: "Chacun a son rythme et ses émotions", B: "Elle dispense d'agir", C: "Elle supprime le respect", D: "Elle rend tout automatique" }, "A"),
        makeQ("Quel geste simple montre de l'attention ?", { A: "Prendre des nouvelles avec sincérité", B: "Lire sans répondre jamais", C: "Critiquer en permanence", D: "Oublier les moments importants" }, "A"),
        makeQ("Quelle base soutient une relation durable ?", { A: "Respect mutuel, honnêteté et affection", B: "Jalousie permanente", C: "Secrets constants", D: "Manque d'écoute" }, "A")
      ]
    },
    {
      title: "Pack Couple / Relation #3 - Écoute & Bienveillance",
      questions: [
        makeQ("Que signifie reformuler ce que l'autre a dit ?", { A: "Vérifier qu'on a bien compris son message", B: "Se moquer de ses mots", C: "Couper la parole", D: "Changer de conversation" }, "A"),
        makeQ("Pourquoi éviter les généralisations comme « tu fais toujours » ?", { A: "Elles braquent l'autre au lieu d'aider à résoudre le point précis", B: "Elles sont toujours exactes", C: "Elles apaisent tout", D: "Elles raccourcissent le dialogue" }, "A"),
        makeQ("Quel est l'intérêt de poser des questions ouvertes ?", { A: "Inviter l'autre à partager son ressenti et son point de vue", B: "Forcer un oui ou non", C: "Clore l'échange", D: "Piéger l'autre" }, "A"),
        makeQ("Comment soutenir un proche stressé ?", { A: "L'écouter et lui demander ce dont il a besoin", B: "Minimiser son stress", C: "Ajouter de la pression", D: "L'ignorer" }, "A"),
        makeQ("Pourquoi le pardon sincère est-il important ?", { A: "Il permet d'avancer sans garder de rancune destructrice", B: "Il efface le respect", C: "Il autorise à recommencer exprès", D: "Il remplace le dialogue" }, "A"),
        makeQ("Qu'est-ce qu'une relation équilibrée ?", { A: "Une relation où chacun compte et s'exprime librement", B: "Une relation à sens unique", C: "Une relation basée sur la peur", D: "Une relation sans échanges" }, "A"),
        makeQ("Pourquoi célébrer les réussites de l'autre ?", { A: "Montrer sa joie et son soutien sincère", B: "Ressentir de l'amertume", C: "Minimiser ses efforts", D: "Ignorer l'événement" }, "A"),
        makeQ("Quel moment est propice à une discussion sérieuse ?", { A: "Quand chacun est calme et disponible", B: "En pleine colère au milieu d'une urgence", C: "En coupant la parole", D: "En criant" }, "A"),
        makeQ("Pourquoi l'honnêteté bienveillante est-elle efficace ?", { A: "Elle dit la vérité avec tact et respect", B: "Elle cherche à blesser", C: "Elle ment par facilité", D: "Elle évite tout sujet" }, "A"),
        makeQ("Quel est un signe d'amitié ou d'amour solide ?", { A: "La constance et le respect dans le temps", B: "La présence uniquement quand ça arrange", C: "Le manque d'égards", D: "La méfiance constante" }, "A")
      ]
    },
    {
      title: "Pack Couple / Relation #4 - Harmonie & Projets",
      questions: [
        makeQ("Pourquoi discuter des projets d'avenir ensemble ?", { A: "Aligner ses envies et construire une vision partagée", B: "Empêcher toute évolution", C: "Créer du secret", D: "Éviter de se parler" }, "A"),
        makeQ("Que faire si deux personnes ont des avis différents sur un film ou une sortie ?", { A: "Alterner ou trouver un choix qui convienne à chacun", B: "Se fâcher définitivement", C: "Forcer l'autre", D: "Annuler toute sortie" }, "A"),
        makeQ("Quel est l'impact du temps de qualité partagé ?", { A: "Renforcer le lien loin des distractions", B: "Réduire l'attention", C: "Créer de la distance", D: "Empêcher de rire" }, "A"),
        makeQ("Pourquoi respecter le rythme de chacun ?", { A: "Chacun gère la fatigue, les émotions et les changements différemment", B: "Tout le monde doit réagir pareil", C: "La fatigue n'existe pas", D: "Le rythme est inutile" }, "A"),
        makeQ("Quelle attitude aide quand on ne comprend pas immédiatement l'autre ?", { A: "Demander des précisions avec bienveillance", B: "Supposer le pire", C: "S'énerver tout de suite", D: "Fermer la porte" }, "A"),
        makeQ("Pourquoi l'autonomie personnelle renforce-t-elle le lien ?", { A: "Chacun apporte sa vitalité et ses expériences à la relation", B: "Elle coupe tout contact", C: "Elle supprime l'affection", D: "Elle rend l'autre étranger" }, "A"),
        makeQ("Quel est le rôle des excuses claires ?", { A: "Assumer sa responsabilité et réparer la confiance", B: "Chercher des excuses fausses", C: "Rejeter la faute sur l'autre", D: "Ignorer l'incident" }, "A"),
        makeQ("Pourquoi parler de ce qu'on apprécie ?", { A: "Entretenir la reconnaissance et l'optimisme relationnel", B: "Cacher ses sentiments", C: "Ne voir que les défauts", D: "Refuser les compliments" }, "A"),
        makeQ("Comment gérer un malentendu dû à un message mal interprété ?", { A: "Clarifier calmement l'intention réelle", B: "Interpréter au pire sans demander", C: "Bloquer immédiatement", D: "Faire durer le quiproquo" }, "A"),
        makeQ("Quel est l'objectif principal d'une relation saine ?", { A: "Le respect, la compréhension et le bien-être mutuel", B: "Le contrôle de l'autre", C: "La compétition permanente", D: "L'indifférence" }, "A")
      ]
    }
  ],

  general: [
    {
      title: "Pack Général #1 - Culture Essentielle",
      questions: [
        makeQ("Combien de continents compte-t-on classiquement sur Terre ?", { A: "5", B: "6 ou 7 selon les modèles géographiques", C: "9", D: "4" }, "B"),
        makeQ("Quel est l'océan le plus vaste de la planète ?", { A: "L'océan Atlantique", B: "L'océan Indien", C: "L'océan Pacifique", D: "L'océan Arctique" }, "C"),
        makeQ("Combien y a-t-il de minutes dans une heure ?", { A: "50", B: "60", C: "75", D: "100" }, "B"),
        makeQ("Quelle couleur obtient-on en mélangeant du bleu et du jaune ?", { A: "Violet", B: "Vert", C: "Orange", D: "Rose" }, "B"),
        makeQ("Quel instrument mesure la température ?", { A: "Le baromètre", B: "Le thermomètre", C: "Le sismographe", D: "L'anémomètre" }, "B"),
        makeQ("Quel est l'astre le plus proche de la Terre après la Lune ?", { A: "Le Soleil", B: "Jupiter", C: "Neptune", D: "Uranus" }, "A"),
        makeQ("Combien de côtés possède un hexagone ?", { A: "5", B: "6", C: "7", D: "8" }, "B"),
        makeQ("Quel gaz les plantes absorbent-elles pour la photosynthèse ?", { A: "Le dioxyde de carbone (CO2)", B: "L'argon", C: "Le néon", D: "Le radon" }, "A"),
        makeQ("Quelle langue compte le plus de locuteurs natifs au monde ?", { A: "Le chinois mandarin", B: "Le suédois", C: "Le grec", D: "Le finnois" }, "A"),
        makeQ("Quel astre est au centre du système solaire ?", { A: "Le Soleil", B: "La Lune", C: "Mars", D: "Saturne" }, "A")
      ]
    },
    {
      title: "Pack Général #2 - Vie Quotidienne & Découvertes",
      questions: [
        makeQ("À quelle température l'eau bout-elle au niveau de la mer à pression normale ?", { A: "0 °C", B: "50 °C", C: "100 °C", D: "150 °C" }, "C"),
        makeQ("Quel organe pompe le sang dans le corps humain ?", { A: "Les poumons", B: "Le cœur", C: "Les reins", D: "L'estomac" }, "B"),
        makeQ("Combien de jours compte une année bissextile ?", { A: "364", B: "365", C: "366", D: "367" }, "C"),
        makeQ("Quel est le plus grand mammifère marin connu ?", { A: "Le dauphin commun", B: "La baleine bleue", C: "Le morse", D: "La loutre de mer" }, "B"),
        makeQ("Quelle figure a 4 côtés égaux et 4 angles droits ?", { A: "Le triangle équilatéral", B: "Le carré", C: "Le trapèze", D: "Le pentagone" }, "B"),
        makeQ("Quel sens est associé à l'odorat ?", { A: "Le nez", B: "L'oreille", C: "La langue", D: "La peau" }, "A"),
        makeQ("Quel point cardinal est opposé au nord ?", { A: "L'est", B: "L'ouest", C: "Le sud", D: "Le nord-est" }, "C"),
        makeQ("Combien d'années composent un siècle ?", { A: "10 ans", B: "50 ans", C: "100 ans", D: "1000 ans" }, "C"),
        makeQ("Quelle boisson chaude est infusée à partir de Camellia sinensis ?", { A: "Le thé", B: "L'espresso", C: "Le chocolat chaud", D: "Le jus de pomme" }, "A"),
        makeQ("Quel est le satellite naturel de la Terre ?", { A: "Phobos", B: "La Lune", C: "Europe", D: "Titan" }, "B")
      ]
    },
                  {
      title: "Pack Général #3 - Savoirs Transversaux",
      questions: [
        makeQ("Combien de secondes y a-t-il dans une minute ?", { A: "30", B: "60", C: "90", D: "120" }, "B"),
        makeQ("Quel est l'état de l'eau lorsqu'elle est solide ?", { A: "La glace", B: "La vapeur", C: "Le brouillard", D: "La fumée" }, "A"),
        makeQ("Combien de mois compte une année ?", { A: "10", B: "12", C: "14", D: "24" }, "B"),
        makeQ("Quel animal produit le miel dans une ruche ?", { A: "L'abeille", B: "La fourmi", C: "La libellule", D: "Le papillon" }, "A"),
        makeQ("Quel instrument sert à regarder des objets très éloignés dans le ciel ?", { A: "Le télescope", B: "Le microscope", C: "La balance", D: "Le compas" }, "A"),
        makeQ("Quelle saison suit l'été dans l'hémisphère nord ?", { A: "L'automne", B: "Le printemps", C: "L'hiver", D: "La mousson" }, "A"),
        makeQ("Combien de roues possède généralement une bicyclette ?", { A: "1", B: "2", C: "3", D: "4" }, "B"),
        makeQ("Quel organe permet principalement de respirer chez l'humain ?", { A: "Les poumons", B: "L'estomac", C: "Le foie", D: "La rate" }, "A"),
        makeQ("Quelle couleur est traditionnellement associée à la végétation ?", { A: "Le vert", B: "Le violet", C: "Le noir", D: "Le gris" }, "A"),
        makeQ("Combien de côtés possède un triangle ?", { A: "2", B: "3", C: "4", D: "5" }, "B")
      ]
    },
    {
      title: "Pack Général #4 - Culture & Repères",
      questions: [
        makeQ("Quel outil permet de tracer un cercle précis ?", { A: "Le compas", B: "La règle", C: "L'équerre", D: "Le rapporteur" }, "A"),
        makeQ("Quel astre éclaire principalement la Terre pendant le jour ?", { A: "Le Soleil", B: "La Lune", C: "Vénus", D: "Jupiter" }, "A"),
        makeQ("Combien d'heures compte une journée standard ?", { A: "12", B: "24", C: "36", D: "48" }, "B"),
        makeQ("Quel est le contraire de « léger » ?", { A: "Lourd", B: "Rapide", C: "Clair", D: "Doux" }, "A"),
        makeQ("Quel liquide recouvre environ 70 % de la surface de la Terre ?", { A: "L'eau", B: "L'huile", C: "Le lait", D: "Le vinaigre" }, "A"),
        makeQ("Quel sens permet de percevoir les sons ?", { A: "L'ouïe", B: "Le goût", C: "La vue", D: "L'odorat" }, "A"),
        makeQ("Combien de doigts a-t-on normalement sur une main ?", { A: "4", B: "5", C: "6", D: "10" }, "B"),
        makeQ("Quel objet sert à se protéger de la pluie ?", { A: "Le parapluie", B: "L'éventail", C: "Les lunettes de soleil", D: "La bougie" }, "A"),
        makeQ("Quelle direction est à l'opposé de l'est ?", { A: "L'ouest", B: "Le nord", C: "Le sud", D: "Le zénith" }, "A"),
        makeQ("Quel est le principal aliment de base de nombreuses cultures en Asie ?", { A: "Le riz", B: "Le maïs soufflé", C: "La betterave", D: "L'avoine brute" }, "A")
      ]
    }
  ],

  science: [
    {
      title: "Pack Science #1 - Physique, Chimie & Biologie",
      questions: [
        makeQ("Quel est le symbole chimique de l'or ?", { A: "Ag", B: "Au", C: "Fe", D: "Pb" }, "B"),
        makeQ("Quelle particule subatomique a une charge négative ?", { A: "Le proton", B: "Le neutron", C: "L'électron", D: "Le photon" }, "C"),
        makeQ("Quelle molécule porte l'information génétique ?", { A: "L'ADN", B: "Le glucose", C: "La kératine", D: "La cellulose" }, "A"),
        makeQ("Quelle force maintient les planètes autour du Soleil ?", { A: "La gravitation", B: "La friction", C: "La capillarité", D: "La poussée d'Archimède" }, "A"),
        makeQ("Quel organite produit une grande partie de l'ATP cellulaire ?", { A: "La mitochondrie", B: "Le ribosome", C: "Le lysosome", D: "L'appareil de Golgi" }, "A"),
        makeQ("Quel élément est le plus abondant dans l'Univers observable ?", { A: "L'hydrogène", B: "L'uranium", C: "Le fer", D: "Le mercure" }, "A"),
        makeQ("Quelle est la vitesse approximative de la lumière dans le vide ?", { A: "300 000 km/s", B: "340 m/s", C: "15 000 km/h", D: "1 200 km/s" }, "A"),
        makeQ("Quel gaz domine l'atmosphère terrestre (~78 %) ?", { A: "L'azote (N2)", B: "L'hélium", C: "Le méthane", D: "L'ozone" }, "A"),
        makeQ("Quelle grandeur mesure l'acidité d'une solution aqueuse ?", { A: "Le pH", B: "La magnitude Richter", C: "Les décibels", D: "Les lumens" }, "A"),
        makeQ("Quel physicien a formulé la gravitation universelle ?", { A: "Isaac Newton", B: "Gregor Mendel", C: "Louis Pasteur", D: "Alexander Fleming" }, "A")
      ]
    },
    {
      title: "Pack Science #2 - Anatomie & Géologie",
      questions: [
        makeQ("Quel type de cellule transporte principalement le dioxygène ?", { A: "Le globule rouge (érythrocyte)", B: "La plaquette", C: "Le neurone", D: "L'ostéoblaste" }, "A"),
        makeQ("Quelle couche terrestre se trouve sous la croûte ?", { A: "Le manteau", B: "Le noyau interne", C: "La troposphère", D: "La mésosphère" }, "A"),
        makeQ("Quelle vitamine est produite par la peau sous l'effet des UVB ?", { A: "La vitamine D", B: "La vitamine C", C: "La vitamine K", D: "La vitamine B12" }, "A"),
        makeQ("Quel est l'os le plus long du corps humain ?", { A: "Le fémur", B: "L'étrier", C: "La clavicule", D: "La rotule" }, "A"),
        makeQ("Quel passage de l'état liquide à l'état gazeux s'appelle l'évaporation ?", { A: "Liquide vers gaz", B: "Gaz vers solide", C: "Solide vers liquide", D: "Liquide vers solide" }, "A"),
        makeQ("Quel système défend l'organisme contre les pathogènes ?", { A: "Le système immunitaire", B: "Le système digestif", C: "Le système squelettique", D: "Le système tégumentaire" }, "A"),
        makeQ("Quel est le symbole chimique du sodium ?", { A: "So", B: "Na", C: "K", D: "Sn" }, "B"),
        makeQ("Quel phénomène dévie la lumière en changeant de milieu ?", { A: "La réfraction", B: "L'aimantation", C: "La conduction", D: "La sublimation" }, "A"),
        makeQ("Quel organe respiratoire utilisent la majorité des poissons ?", { A: "Les branchies", B: "Les poumons", C: "Les trachées", D: "Le diaphragme" }, "A"),
        makeQ("Quelle planète est surnommée la planète rouge ?", { A: "Mars", B: "Vénus", C: "Mercure", D: "Saturne" }, "A")
      ]
    },
    {
      title: "Pack Science #3 - Chimie & Énergie",
      questions: [
        makeQ("Quelle est la formule chimique de l'eau ?", { A: "H2O", B: "CO2", C: "NaCl", D: "O3" }, "A"),
        makeQ("Quel gaz est indispensable à la respiration cellulaire aérobie ?", { A: "Le dioxygène (O2)", B: "L'argon", C: "Le néon", D: "Le xénon" }, "A"),
        makeQ("Quel type d'énergie possède un objet en mouvement ?", { A: "L'énergie cinétique", B: "L'énergie nucléaire", C: "L'énergie chimique", D: "L'énergie géothermique" }, "A"),
        makeQ("Quel métal est un excellent conducteur électrique courant ?", { A: "Le cuivre", B: "Le soufre", C: "Le phosphore", D: "L'iode" }, "A"),
        makeQ("Quel est le symbole chimique du carbone ?", { A: "C", B: "Ca", C: "Co", D: "Cu" }, "A"),
        makeQ("Que mesure un ampèremètre ?", { A: "L'intensité du courant électrique", B: "La température", C: "La pression", D: "La masse" }, "A"),
        makeQ("Quelle planète est la plus grande du système solaire ?", { A: "Jupiter", B: "Mercure", C: "Mars", D: "Vénus" }, "A"),
        makeQ("Quel phénomène biologique permet aux plantes de synthétiser des sucres grâce à la lumière ?", { A: "La photosynthèse", B: "La fermentation alcoolique", C: "La mitose", D: "La digestion" }, "A"),
        makeQ("Quel est l'unité SI de la force ?", { A: "Le newton (N)", B: "Le joule (J)", C: "Le watt (W)", D: "Le pascal (Pa)" }, "A"),
        makeQ("Quel état de la matière n'a ni forme propre ni volume propre ?", { A: "Le gaz", B: "Le solide cristallin", C: "Le métal rigide", D: "La glace" }, "A")
      ]
    },
    {
      title: "Pack Science #4 - Vivant & Astronomie",
      questions: [
        makeQ("Quel animal est un mammifère marin ?", { A: "Le dauphin", B: "Le requin-tigre", C: "La raie manta", D: "L'hippocampe" }, "A"),
        makeQ("Quel organe humain filtre le sang pour produire l'urine ?", { A: "Les reins", B: "L'estomac", C: "La rate", D: "La trachée" }, "A"),
        makeQ("Quelle galaxie abrite notre système solaire ?", { A: "La Voie lactée", B: "Andromède", C: "Le Grand Nuage de Magellan", D: "Triangulum" }, "A"),
        makeQ("Quelle planète est la plus proche du Soleil ?", { A: "Mercure", B: "Vénus", C: "Terre", D: "Saturne" }, "A"),
        makeQ("Quel est le symbole chimique de l'azote ?", { A: "N", B: "Az", C: "Ne", D: "Ni" }, "A"),
        makeQ("Quelle partie de la plante absorbe l'eau et les sels minéraux du sol ?", { A: "Les racines", B: "Les pétales", C: "Le pollen", D: "Les fruits" }, "A"),
                 makeQ("Quelle est l'unité SI de la puissance ?", { A: "Le watt (W)", B: "Le volt (V)", C: "L'ohm (Ω)", D: "Le tesla (T)" }, "A"),
        makeQ("Quel phénomène provoque les marées océaniques principales ?", { A: "L'attraction gravitationnelle de la Lune et du Soleil", B: "Le vent local", C: "La rotation des nuages", D: "Le magnétisme terrestre seul" }, "A"),
        makeQ("Quel groupe d'animaux possède une colonne vertébrale ?", { A: "Les vertébrés", B: "Les insectes seuls", C: "Les méduses", D: "Les vers de terre" }, "A"),
        makeQ("Quel est le symbole chimique du calcium ?", { A: "Ca", B: "Cl", C: "Cr", D: "Cs" }, "A")
      ]
    }
  ],

  history: [
    {
      title: "Pack Histoire #1 - Antiquité & Temps Modernes",
      questions: [
        makeQ("Quelle civilisation a bâti les grandes pyramides de Gizeh ?", { A: "L'Égypte antique", B: "Les Vikings", C: "L'Empire ottoman", D: "Les Celtes" }, "A"),
        makeQ("Qui a perfectionné l'imprimerie à caractères mobiles en Europe ?", { A: "Johannes Gutenberg", B: "Galilée", C: "Copernic", D: "Blaise Pascal" }, "A"),
        makeQ("En quelle année le mur de Berlin est-il tombé ?", { A: "1989", B: "1961", C: "1945", D: "1999" }, "A"),
        makeQ("Quelle expédition a accompli le premier tour du monde complet ?", { A: "L'expédition de Magellan / Elcano", B: "Christophe Colomb", C: "Vasco de Gama", D: "Jacques Cartier" }, "A"),
        makeQ("Quel événement marque le début de la Révolution française ?", { A: "La prise de la Bastille (1789)", B: "Waterloo", C: "Le sacre de Charlemagne", D: "Le traité de Rome" }, "A"),
        makeQ("Quel empire antique avait Rome pour capitale ?", { A: "L'Empire romain", B: "L'Empire inca", C: "L'Empire khmer", D: "L'Empire mongol" }, "A"),
        makeQ("En quelle année l'humain a-t-il marché sur la Lune ?", { A: "1969", B: "1957", C: "1975", D: "1981" }, "A"),
        makeQ("Quelle invention a marqué la révolution industrielle au XVIIIe siècle ?", { A: "La machine à vapeur", B: "Le smartphone", C: "Le laser", D: "Le GPS" }, "A"),
        makeQ("Quelle écriture a été déchiffrée grâce à la pierre de Rosette ?", { A: "Les hiéroglyphes égyptiens", B: "Les runes", C: "Le linéaire B", D: "Le sanskrit" }, "A"),
        makeQ("Quelle organisation mondiale a été fondée en 1945 ?", { A: "L'ONU", B: "La Société des Nations", C: "L'OTAN", D: "L'OMC" }, "A")
      ]
    },
    {
      title: "Pack Histoire #2 - Grandes Figures & Civilisations",
      questions: [
        makeQ("Dans quelle civilisation antique est née la démocratie athénienne ?", { A: "La Grèce antique", B: "L'Empire perse", C: "La civilisation maya", D: "L'Égypte ptolémaïque" }, "A"),
        makeQ("Quel traité a mis fin à la Première Guerre mondiale en 1919 ?", { A: "Le traité de Versailles", B: "Le traité de Westphalie", C: "La paix d'Augsbourg", D: "Le traité d'Utrecht" }, "A"),
        makeQ("Quelle reine d'Égypte antique appartenait aux Ptolémées ?", { A: "Cléopâtre VII", B: "Néfertiti", C: "Hatchepsout", D: "Ankhsenamon" }, "A"),
        makeQ("Quel axe commercial reliait l'Asie de l'Est à la Méditerranée ?", { A: "La route de la soie", B: "La route du rhum", C: "La voie royale inca", D: "Le passage du Nord-Ouest" }, "A"),
        makeQ("En quelle année le Titanic a-t-il coulé ?", { A: "1912", B: "1898", C: "1923", D: "1905" }, "A"),
        makeQ("Qui est devenu président de l'Afrique du Sud en 1994 ?", { A: "Nelson Mandela", B: "Kwame Nkrumah", C: "Jomo Kenyatta", D: "Léopold Sédar Senghor" }, "A"),
        makeQ("Quel support a précédé le papier en Chine antique ?", { A: "Soie, bambou, parchemin ou papyrus selon régions", B: "Fibre de carbone", C: "Aluminium", D: "Silicone" }, "A"),
        makeQ("Quelle période suit l'Antiquité en Europe ?", { A: "Le Moyen Âge", B: "L'âge de pierre", C: "L'époque contemporaine", D: "La Belle Époque" }, "A"),
        makeQ("Qui a découvert la pénicilline en 1928 ?", { A: "Alexander Fleming", B: "Marie Curie", C: "Antoine Lavoisier", D: "Nikola Tesla" }, "A"),
        makeQ("Quel canal relie la Méditerranée à la mer Rouge ?", { A: "Le canal de Suez", B: "Le canal de Panama", C: "Le canal de Kiel", D: "Le canal de Corinthe" }, "A")
      ]
    },
    {
      title: "Pack Histoire #3 - Inventions & Époques",
      questions: [
        makeQ("Quel canal relie l'océan Atlantique et l'océan Pacifique ?", { A: "Le canal de Panama", B: "Le canal de Suez", C: "Le canal du Midi", D: "Le canal de Corinthe" }, "A"),
        makeQ("Quel mouvement culturel européen des XVe-XVIe siècles a remis l'Antiquité et l'humanisme à l'honneur ?", { A: "La Renaissance", B: "La Préhistoire", C: "L'âge du bronze", D: "La guerre froide" }, "A"),
        makeQ("Quel moyen de communication a précédé le téléphone mobile au XIXe siècle ?", { A: "Le télégraphe électrique", B: "La 5G", C: "Le satellite géostationnaire", D: "La fibre optique" }, "A"),
        makeQ("En quelle année a débuté la Première Guerre mondiale ?", { A: "1914", B: "1918", C: "1939", D: "1945" }, "A"),
        makeQ("En quelle année a débuté la Seconde Guerre mondiale en Europe ?", { A: "1939", B: "1914", C: "1929", D: "1950" }, "A"),
        makeQ("Quelle civilisation mésoaméricaine a construit Machu Picchu ?", { A: "L'Empire inca", B: "L'Égypte antique", C: "La Grèce antique", D: "La Rome antique" }, "A"),
        makeQ("Quel outil ancien aidait les navigateurs à lire la hauteur des astres ?", { A: "L'astrolabe / sextant", B: "Le thermomètre médical", C: "Le stéthoscope", D: "La calculatrice" }, "A"),
        makeQ("Quel siècle correspond aux années 1801 à 1900 ?", { A: "Le XIXe siècle", B: "Le XVIIIe siècle", C: "Le XXe siècle", D: "Le XVIIe siècle" }, "A"),
        makeQ("Quel événement de 1776 est lié aux treize colonies d'Amérique du Nord ?", { A: "La Déclaration d'indépendance des États-Unis", B: "La chute de Constantinople", C: "L'invention du cinéma", D: "La création de l'euro" }, "A"),
        makeQ("Quel type de source historique provient directement de l'époque étudiée ?", { A: "Une source primaire (archive, lettre, objet d'époque)", B: "Un résumé récent seul", C: "Une fiction moderne", D: "Une rumeur" }, "A")
      ]
    },
    {
      title: "Pack Histoire #4 - Repères Mondiaux",
      questions: [
        makeQ("Quel siècle correspond aux années 1901 à 2000 ?", { A: "Le XXe siècle", B: "Le XIXe siècle", C: "Le XXIe siècle", D: "Le XVIIIe siècle" }, "A"),
        makeQ("Quelle cité antique a été ensevelie par l'éruption du Vésuve en 79 apr. J.-C. ?", { A: "Pompéi", B: "Athènes", C: "Carthage", D: "Babylone" }, "A"),
        makeQ("Quel traité fondateur de 1957 a créé la Communauté économique européenne ?", { A: "Le traité de Rome", B: "Le traité de Versailles", C: "Le traité de Westphalie", D: "L'armistice de 1918" }, "A"),
        makeQ("Quel premier satellite artificiel a été mis en orbite en 1957 ?", { A: "Spoutnik 1", B: "Apollo 11", C: "Voyager 1", D: "Hubble" }, "A"),
        makeQ("Quelle période de tensions géopolitiques et idéologiques a suivi la Seconde Guerre mondiale entre les blocs Est et Ouest ?", { A: "La guerre froide", B: "La guerre de Cent Ans", C: "Les croisades", D: "La Renaissance" }, "A"),
        makeQ("Quelle ville grecque antique est célèbre pour l'Acropole et le Parthénon ?", { A: "Athènes", B: "Sparte", C: "Delphes", D: "Olympie" }, "A"),
        makeQ("Quel système de numération positionnelle avec le zéro a joué un rôle clé en mathématiques ?", { A: "La numération décimale indienne / arabe", B: "Les chiffres romains seuls", C: "Les encoches sur os", D: "L'abaque seul" }, "A"),
        makeQ("Quel événement de 1991 a marqué la dissolution formelle de l'URSS ?", { A: "La dislocation de l'Union soviétique", B: "La chute de la Bastille", C: "La bataille d'Hastings", D: "L'invention de l'imprimerie" }, "A"),
        makeQ("Quelle discipline étudie les sociétés humaines passées à travers leurs vestiges matériels ?", { A: "L'archéologie", B: "L'astronomie", C: "La botanique", D: "La météorologie" }, "A"),
        makeQ("Quel document fondamental de 1215 en Angleterre a limité le pouvoir royal ?", { A: "La Magna Carta", B: "La Déclaration de 1789", C: "La charte de l'ONU", D: "Le code civil de 1804" }, "A")
      ]
    }
  ],

  sports: [
    {
      title: "Pack Sports #1 - Football & Jeux Olympiques",
      questions: [
        makeQ("Combien de joueurs composent une équipe de football au coup d'envoi ?", { A: "9", B: "10", C: "11", D: "12" }, "C"),
        makeQ("Tous les combien d'années se déroule généralement la Coupe du monde de football ?", { A: "2 ans", B: "4 ans", C: "5 ans", D: "6 ans" }, "B"),
        makeQ("Quelle est la distance officielle d'un marathon ?", { A: "21,097 km", B: "42,195 km", C: "10 km", D: "50 km" }, "B"),
        makeQ("Dans quel sport utilise-t-on un volant et une raquette ?", { A: "Le badminton", B: "Le squash", C: "Le polo", D: "La pétanque" }, "A"),
                      makeQ("Combien vaut un lancer franc réussi au basket-ball ?", { A: "1 point", B: "2 points", C: "3 points", D: "4 points" }, "A"),
        makeQ("Combien d'anneaux figurent sur le drapeau olympique ?", { A: "4", B: "5", C: "6", D: "7" }, "B"),
        makeQ("Quel sport se pratique sur un ring avec des gants ?", { A: "La boxe", B: "L'escrime", C: "Le tir à l'arc", D: "L'aviron" }, "A"),
        makeQ("Quel terme désigne le score de zéro au tennis ?", { A: "Love", B: "Deuce", C: "Ace", D: "Let" }, "A"),
        makeQ("Quel championnat auto dispute des Grands Prix sur circuits ?", { A: "La Formule 1", B: "Le curling", C: "Le biathlon", D: "Le dressage" }, "A"),
        makeQ("Combien de sets gagnants faut-il au volley-ball standard ?", { A: "2", B: "3", C: "4", D: "5" }, "B")
      ]
    },
    {
      title: "Pack Sports #2 - Règles & Disciplines",
      questions: [
        makeQ("Combien de joueurs aligne-t-on sur le terrain au handball (gardien inclus) ?", { A: "7 (6 joueurs + 1 gardien)", B: "11", C: "5", D: "9" }, "A"),
        makeQ("Quel sport combine ski de fond et tir ?", { A: "Le biathlon", B: "Le pentathlon", C: "Le triathlon", D: "Le décathlon" }, "A"),
        makeQ("Quelle surface est célèbre à Roland-Garros ?", { A: "La terre battue", B: "Le gazon", C: "La glace", D: "Le parquet" }, "A"),
        makeQ("Combien d'épreuves compose un décathlon ?", { A: "7", B: "8", C: "10", D: "12" }, "C"),
        makeQ("Quel carton expulse un joueur au football ?", { A: "Le carton rouge", B: "Le carton jaune", C: "Le carton vert", D: "Le carton blanc" }, "B"),
        makeQ("Dans quelle nage est-on sur le dos en alternant les bras ?", { A: "Le dos crawlé", B: "La brasse", C: "Le papillon", D: "La planche" }, "A"),
        makeQ("Quel sport se joue avec des clubs et des trous sur gazon ?", { A: "Le golf", B: "Le curling", C: "Le bowling", D: "Le billard" }, "A"),
        makeQ("Quelle épreuve enchaîne natation, vélo et course à pied ?", { A: "Le triathlon", B: "Le curling", C: "Le saut à la perche", D: "Le lancer du marteau" }, "A"),
        makeQ("Quel est le surnom de l'équipe masculine de football du Brésil ?", { A: "La Seleção", B: "La Squadra Azzurra", C: "La Albiceleste", D: "Les Lions de l'Atlas" }, "A"),
        makeQ("Quelle course d'athlétisme mesure 100 mètres ?", { A: "Le 100 mètres", B: "Le marathon", C: "Le 1500 mètres", D: "Le 3000 mètres steeple" }, "A")
      ]
    },
    {
      title: "Pack Sports #3 - Sports Collectifs & Raquettes",
      questions: [
        makeQ("Combien de joueurs composent une équipe de basket-ball sur le terrain ?", { A: "5", B: "6", C: "7", D: "11" }, "A"),
        makeQ("Combien de joueurs composent une équipe de volley-ball sur le terrain ?", { A: "6", B: "5", C: "8", D: "11" }, "A"),
        makeQ("Quel sport se pratique sur glace avec un palet et des crosses ?", { A: "Le hockey sur glace", B: "Le badminton", C: "Le golf", D: "Le water-polo" }, "A"),
        makeQ("Quelle discipline se joue dans l'eau avec un ballon et des buts ?", { A: "Le water-polo", B: "Le curling", C: "Le tir à l'arc", D: "L'équitation" }, "A"),
        makeQ("Quel est le nom du tournoi du Grand Chelem disputé sur gazon à Londres ?", { A: "Wimbledon", B: "Roland-Garros", C: "US Open", D: "Open d'Australie" }, "A"),
        makeQ("Combien de temps dure un match de football réglementaire (hors arrêts de jeu) ?", { A: "90 minutes (2 x 45 min)", B: "60 minutes", C: "80 minutes", D: "100 minutes" }, "A"),
        makeQ("Quel sport utilise un filet haut et des frappes sans blocage du ballon ?", { A: "Le volley-ball", B: "Le rugby", C: "Le curling", D: "La pétanque" }, "A"),
        makeQ("Quelle arme n'existe PAS en escrime olympique ?", { A: "Le fleuret, l'épée et le sabre existent — la hache non", B: "Le fleuret", C: "L'épée", D: "Le sabre" }, "A"),
        makeQ("Quel sport oppose deux équipes autour d'un ballon ovale avec essais ?", { A: "Le rugby", B: "Le tennis de table", C: "Le badminton", D: "Le curling" }, "A"),
        makeQ("Quel sport se joue sur une petite table avec une balle légère et des raquettes ?", { A: "Le tennis de table (ping-pong)", B: "Le polo", C: "Le golf", D: "L'aviron" }, "A")
      ]
    },
    {
      title: "Pack Sports #4 - Athlétisme & Culture Sportive",
      questions: [
        makeQ("Quel échauffement ou préparation aide à réduire le risque de blessure ?", { A: "Échauffement progressif et mobilité", B: "Sprint à froid sans échauffement", C: "Ignorer la récupération", D: "Porter des chaussures inadaptées" }, "A"),
        makeQ("Quelle discipline d'athlétisme consiste à franchir des barrières en courant ?", { A: "La course de haies", B: "Le lancer de poids", C: "Le lancer de disque", D: "Le saut en longueur" }, "A"),
        makeQ("Quel engin est projeté le plus loin possible au lancer de javelot ?", { A: "Un javelot", B: "Un ballon", C: "Une flèche", D: "Un palet" }, "A"),
        makeQ("Quel art martial originaire du Japon met l'accent sur les projections et contrôles au sol ?", { A: "Le judo", B: "Le curling", C: "Le squash", D: "L'aviron" }, "A"),
        makeQ("Quel sport consiste à glisser une pierre de granit sur la glace vers une cible ?", { A: "Le curling", B: "Le triathlon", C: "Le badminton", D: "Le handball" }, "A"),
        makeQ("Quelle discipline combine cyclisme sur route, contre-la-montre et étapes ?", { A: "Le cyclisme sur route", B: "Le plongeon", C: "Le tir sportif", D: "L'haltérophilie" }, "A"),
        makeQ("Quel sport consiste à soulever des barres chargées de disques ?", { A: "L'haltérophilie", B: "Le curling", C: "La voile", D: "Le ping-pong" }, "A"),
        makeQ("Quel sport se pratique sur l'eau avec des rames ?", { A: "L'aviron", B: "Le curling", C: "Le handball", D: "Le badminton" }, "A"),
        makeQ("Quel terme désigne une égalité parfaite à la fin d'un match ?", { A: "Un match nul", B: "Un ace", C: "Un strike", D: "Un birdie" }, "A"),
        makeQ("Quelle valeur sportive est essentielle quel que soit le résultat ?", { A: "Le fair-play et le respect des règles", B: "La triche", C: "L'insulte à l'arbitre", D: "L'abandon de l'esprit sportif" }, "A")
      ]
    }
  ],

  movies: [
    {
      title: "Pack Cinéma #1 - Technique & Classiques",
      questions: [
        makeQ("Qui dirige la mise en scène artistique d'un film ?", { A: "Le réalisateur / la réalisatrice", B: "Le monteur son", C: "Le machiniste", D: "Le projectionniste" }, "A"),
        makeQ("Qu'est-ce que le montage d'un film ?", { A: "Sélectionner et assembler les plans pour créer rythme et sens", B: "Construire la caméra", C: "Imprimer les affiches", D: "Vendre les billets" }, "A"),
        makeQ("Quel type d'animation repose sur des images calculées par ordinateur ?", { A: "L'animation 3D / CGI", B: "Le cinéma muet sur nitrate", C: "La lanterne magique", D: "Le théâtre d'ombres" }, "A"),
        makeQ("Qu'est-ce qu'un plan-séquence ?", { A: "Une prise de vue continue sans coupure", B: "Un générique de fin", C: "Un carton muet", D: "Une bande-annonce" }, "A"),
        makeQ("À quoi sert un storyboard ?", { A: "Visualiser l'enchaînement des plans en croquis", B: "Enregistrer l'orchestre", C: "Régler le son en salle", D: "Imprimer le scénario" }, "A"),
        makeQ("Quelle cérémonie récompense des films aux États-Unis ?", { A: "Les Oscars", B: "Le prix Goncourt", C: "Les Victoires de la musique", D: "Le Ballon d'or" }, "A"),
        makeQ("Qu'est-ce qu'un doublage ?", { A: "Remplacer les voix d'origine par des voix dans une autre langue", B: "Projeter deux fois le film", C: "Tourner une cascade", D: "Nettoyer l'objectif" }, "A"),
        makeQ("Quel genre mise sur l'enquête, le mystère ou la tension ?", { A: "Le thriller / policier", B: "Le documentaire animalier", C: "La comédie musicale", D: "Le film d'archive" }, "A"),
        makeQ("Qu'est-ce qu'un panoramique ?", { A: "Pivoter la caméra sur son axe horizontal ou vertical", B: "Un fondu au noir", C: "Un ralenti extrême", D: "Une surimpression" }, "A"),
        makeQ("Qu'est-ce qu'une bande originale (BO) ?", { A: "Les musiques et sons d'un film", B: "La première bobine brute", C: "La liste des figurants", D: "Le contrat de distribution" }, "A")
      ]
    },
    {
      title: "Pack Cinéma #2 - Vocabulaire & Genres",
      questions: [
        makeQ("Qu'est-ce que le stop-motion ?", { A: "Animer image par image des objets réels", B: "Filmer sur fond vert", C: "Un travelling compensé", D: "Un time-lapse" }, "A"),
        makeQ("Qu'est-ce que le générique de fin ?", { A: "La liste des équipes et créateurs à la fin du film", B: "Le résumé au début", C: "L'entracte de dix minutes", D: "La bande-annonce suivante" }, "A"),
        makeQ("Quel genre explore futurs, technologies ou espace ?", { A: "La science-fiction", B: "Le western classique", C: "La biographie historique", D: "Le film noir et blanc" }, "A"),
        makeQ("Qu'est-ce qu'un gros plan ?", { A: "Un cadrage serré sur un visage ou détail", B: "Un plan d'ensemble d'une ville", C: "Un plan de drone à 500 m", D: "Un écran noir" }, "A"),
        makeQ("Quel rôle a le directeur de la photographie ?", { A: "Superviser lumière et cadrage visuel", B: "Écrire les dialogues", C: "Gérer la billetterie", D: "Composer les chansons" }, "A"),
        makeQ("Qu'est-ce qu'un documentaire ?", { A: "Une œuvre audiovisuelle fondée sur le réel", B: "Un dessin animé fantastique", C: "Un jeu vidéo", D: "Une pièce de théâtre" }, "A"),
        makeQ("Qu'est-ce qu'un fond vert (chroma key) ?", { A: "Remplacer un fond uni par un autre décor", B: "Ralentir l'image", C: "Ajouter du flou", D: "Couper le son" }, "A"),
        makeQ("Qu'est-ce qu'une suite (« sequel ») ?", { A: "Un film qui prolonge l'histoire d'un film précédent", B: "Un film sans dialogue", C: "Un clip de 2 minutes", D: "Une émission radio" }, "A"),
        makeQ("À quoi sert une perche micro ?", { A: "Approcher un micro hors du cadre de la caméra", B: "Tenir les projecteurs", C: "Mesurer la focale", D: "Tenir le clap" }, "A"),
        makeQ("Quel festival célèbre le cinéma à Cannes ?", { A: "Le Festival de Cannes", B: "Le Festival de Venise", C: "La Berlinale", D: "Sundance" }, "A")
      ]
    },
                                                                      {
      title: "Pack Cinéma #3 - Narration & Mise en Scène",
      questions: [
        makeQ("Qu'est-ce qu'un scénario ?", { A: "Le texte détaillant l'histoire, les scènes et les dialogues", B: "La carte mémoire de la caméra", C: "L'affiche du film", D: "Le ticket d'entrée" }, "A"),
        makeQ("Qu'est-ce qu'un travelling ?", { A: "Un déplacement de la caméra elle-même (sur rail, chariot, drone...)", B: "Un changement de couleur", C: "Une coupe au montage", D: "Un générique" }, "A"),
        makeQ("Qu'est-ce qu'un flashback ?", { A: "Un retour en arrière dans le passé du récit", B: "Un flash lumineux d'appareil photo", C: "Un générique de début", D: "Une pause pub" }, "A"),
        makeQ("Qu'est-ce qu'un film d'animation traditionnel ?", { A: "Dessins ou images animés successivement", B: "Un film documentaire brut", C: "Un match en direct", D: "Un podcast audio" }, "A"),
        makeQ("Quel est le rôle d'un acteur ou d'une actrice ?", { A: "Interpréter un personnage devant la caméra", B: "Développer la pellicule", C: "Poser les rails", D: "Imprimer les affiches" }, "A"),
        makeQ("Qu'est-ce qu'une bande-annonce (« trailer ») ?", { A: "Une courte vidéo promotionnelle présentant des extraits du film", B: "Le film entier", C: "Le générique de fin", D: "Un manuel technique" }, "A"),
        makeQ("Qu'est-ce qu'un fondu enchaîné ?", { A: "La disparition progressive d'un plan pendant qu'un autre apparaît", B: "Une coupure brusque", C: "Un arrêt sur image", D: "Un zoom avant" }, "A"),
        makeQ("Qu'est-ce qu'un film d'aventure ?", { A: "Un récit centré sur des voyages, défis ou découvertes", B: "Un bulletin météo", C: "Un tableau Excel", D: "Une recette" }, "A"),
        makeQ("Pourquoi le son est-il crucial au cinéma ?", { A: "Dialogues, bruitages et musique façonnent l'immersion et l'émotion", B: "Il ne sert à rien", C: "Il remplace l'image", D: "Il réduit la durée" }, "A"),
        makeQ("Qu'est-ce qu'un court-métrage ?", { A: "Un film de durée brève (souvent moins de 30 à 60 min selon cadres)", B: "Un film de 4 heures", C: "Une série de 10 saisons", D: "Un livre" }, "A")
      ]
    },
    {
      title: "Pack Cinéma #4 - Métiers & Salle de Cinéma",
      questions: [
        makeQ("Qu'est-ce que l'étalonnage (« color grading ») ?", { A: "Harmoniser et styliser les couleurs et luminosités de l'image", B: "Mesurer la salle", C: "Écrire le générique", D: "Couper les scènes" }, "A"),
        makeQ("Quel est le rôle du bruiteur ?", { A: "Créer ou enregistrer des effets sonores synchronisés", B: "Filmer en extérieur", C: "Vendre le pop-corn", D: "Peindre les décors" }, "A"),
        makeQ("Qu'est-ce qu'un film d'époque ou historique ?", { A: "Un film situant son intrigue dans un contexte historique donné", B: "Un film sans décor", C: "Un écran de veille", D: "Un jeu de société" }, "A"),
        makeQ("Qu'est-ce qu'une comédie ?", { A: "Un genre visant principalement à faire sourire ou rire", B: "Un rapport financier", C: "Un manuel de chimie", D: "Une carte routière" }, "A"),
        makeQ("À quoi sert le clap de cinéma ?", { A: "Identifier la prise et faciliter la synchronisation image/son", B: "Éclairer les acteurs", C: "Refroidir la caméra", D: "Enregistrer la musique" }, "A"),
        makeQ("Qu'est-ce qu'une trilogie ?", { A: "Un ensemble de trois œuvres liées narrativement ou thématiquement", B: "Un film de trois minutes", C: "Trois caméras", D: "Un seul plan" }, "A"),
        makeQ("Qu'est-ce que la profondeur de champ ?", { A: "La zone de netteté autour du point de mise au point", B: "La profondeur de la salle", C: "La longueur du câble", D: "Le volume sonore" }, "A"),
        makeQ("Qu'est-ce qu'un caméo ?", { A: "Une apparition brève et remarquée d'une personnalité ou d'un réalisateur", B: "Une caméra miniature", C: "Un type de micro", D: "Une bobine" }, "A"),
        makeQ("Quel est le rôle d'un producteur de cinéma ?", { A: "Coordonner le financement, l'organisation et la production du projet", B: "Jouer tous les rôles", C: "Monter le son seul", D: "Dessiner l'affiche seul" }, "A"),
        makeQ("Qu'est-ce qu'un film muet ?", { A: "Un film sans dialogues enregistrés synchronisés", B: "Un film sans image", C: "Un film en 4D", D: "Un documentaire sonore" }, "A")
      ]
    }
  ],

  music: [
    {
      title: "Pack Musique #1 - Théorie & Instruments",
      questions: [
        makeQ("Combien de notes principales a la gamme do-ré-mi-fa-sol-la-si ?", { A: "5", B: "7", C: "8", D: "12" }, "B"),
        makeQ("Combien de cordes a généralement une guitare classique ?", { A: "4", B: "6", C: "8", D: "10" }, "B"),
        makeQ("Quel instrument a des touches blanches et noires ?", { A: "Le piano", B: "La flûte traversière", C: "Le triangle", D: "Les maracas" }, "A"),
        makeQ("Qu'est-ce que le tempo ?", { A: "La vitesse d'exécution d'un morceau", B: "La hauteur d'une note", C: "La longueur de la partition", D: "Le volume de l'ampli" }, "A"),
        makeQ("À quelle famille appartient le violon ?", { A: "Cordes frottées", B: "Cuivres", C: "Percussions à clavier", D: "Instruments électroniques" }, "A"),
        makeQ("Qu'est-ce qu'un solo / chorus ?", { A: "Un passage mis en avant par un instrument ou une voix", B: "La fin de la batterie", C: "Le réglage du câble", D: "La pochette" }, "A"),
        makeQ("Quel instrument à vent utilise une anche ?", { A: "Le saxophone / la clarinette", B: "La harpe", C: "Le xylophone", D: "La timbale" }, "A"),
        makeQ("Qu'est-ce que l'harmonie ?", { A: "La superposition de sons ou d'accords", B: "Le seul rythme de batterie", C: "Une marque de casque", D: "Un câble audio" }, "A"),
        makeQ("Qu'indique la clé de sol ?", { A: "La position de la note sol sur la portée", B: "La vitesse du métronome", C: "Le volume", D: "La tonalité de batterie" }, "A"),
        makeQ("Quel genre est né aux États-Unis autour du swing et de l'improvisation ?", { A: "Le jazz", B: "Le fado", C: "Le tango", D: "La polka" }, "A")
      ]
    },
    {
      title: "Pack Musique #2 - Rythmes, Voix & Styles",
      questions: [
        makeQ("Quel registre vocal est généralement aigu ?", { A: "Soprano", B: "Basse", C: "Baryton", D: "Contre-basse" }, "A"),
        makeQ("Quel ensemble rythmique comprend grosse caisse et caisse claire ?", { A: "La batterie", B: "Le triangle", C: "L'ocarina", D: "Le clavecin" }, "A"),
        makeQ("Qu'est-ce qu'un refrain ?", { A: "La partie mélodique et textuelle répétée", B: "L'accordage des cordes", C: "La liste des pistes", D: "Le silence final" }, "A"),
        makeQ("Quel instrument à cordes pincées est célèbre en classique et musique celtique ?", { A: "La harpe", B: "Le trombone", C: "Le gong", D: "Le tuba" }, "A"),
        makeQ("Qu'est-ce qu'une octave ?", { A: "L'intervalle entre une note et sa répétition à fréquence double ou moitié", B: "Huit guitares", C: "Une mesure à huit temps", D: "Un accord mineur" }, "A"),
        makeQ("Quel style musical est lié à la Jamaïque ?", { A: "Le reggae / ska", B: "Le flamenco", C: "Le blue-grass", D: "La samba" }, "A"),
        makeQ("À quoi sert un accordeur ?", { A: "Vérifier la justesse de hauteur des notes", B: "Amplifier la salle", C: "Imprimer les paroles", D: "Nettoyer les cordes" }, "A"),
        makeQ("Qu'est-ce qu'un orchestre d'harmonie ?", { A: "Un ensemble regroupant vents et percussions", B: "Un seul violon", C: "Un chœur sans voix", D: "Un micro" }, "A"),
        makeQ("Que signifie « a cappella » ?", { A: "Chanter sans accompagnement instrumental", B: "Avec orchestre symphonique", C: "Uniquement à la guitare", D: "En studio" }, "A"),
        makeQ("Quel instrument joue un pianiste ?", { A: "Le piano", B: "La batterie", C: "La trompette", D: "Le violoncelle" }, "A")
      ]
    },
              {
      title: "Pack Musique #3 - Composition & Écoute",
      questions: [
        makeQ("Qu'est-ce qu'une partition ?", { A: "La transcription écrite d'une œuvre musicale", B: "Un câble de micro", C: "Une enceinte", D: "Un stand" }, "A"),
        makeQ("Qu'est-ce qu'un métronome ?", { A: "Un appareil donnant une pulsation régulière pour garder le tempo", B: "Un microphone", C: "Un accord de guitare", D: "Un pupitre" }, "A"),
        makeQ("Qu'est-ce qu'un couplet dans une chanson ?", { A: "Une section dont les paroles évoluent d'une occurrence à l'autre", B: "Le silence du début", C: "Le réglage du volume", D: "La marque de l'instrument" }, "A"),
        makeQ("Quel instrument à cordes frottées est plus grand que le violon ?", { A: "L'alto ou le violoncelle", B: "La flûte", C: "Le triangle", D: "Les maracas" }, "A"),
        makeQ("Qu'est-ce que la mélodie ?", { A: "Une suite de notes perçues comme un ensemble expressif", B: "La couleur du bois", C: "Le prix du billet", D: "La longueur du câble" }, "A"),
        makeQ("Qu'est-ce qu'un duo musical ?", { A: "Deux musiciens ou chanteurs jouant/chantant ensemble", B: "Dix choristes", C: "Un orchestre de cent personnes", D: "Un seul instrument" }, "A"),
        makeQ("Quel instrument à vent est généralement en laiton en forme de tube recourbé ?", { A: "La trompette / le trombone / le cor", B: "Le violon", C: "La harpe", D: "Le xylophone" }, "A"),
        makeQ("Qu'est-ce que l'improvisation musicale ?", { A: "Composer et jouer spontanément dans l'instant", B: "Lire un livre d'histoire", C: "Éteindre l'ampli", D: "Compter les sièges" }, "A"),
        makeQ("Que désigne « piano » (p) en nuance musicale ?", { A: "Jouer doucement", B: "Jouer très fort", C: "Accélérer", D: "S'arrêter" }, "A"),
        makeQ("Que désigne « forte » (f) en nuance musicale ?", { A: "Jouer fort", B: "Jouer en chuchotant", C: "Ralentir", D: "Accorder" }, "A")
      ]
    },
    {
      title: "Pack Musique #4 - Styles & Culture Musicale",
      questions: [
        makeQ("Quel style musical et danse est emblématique de l'Argentine et de l'Uruguay ?", { A: "Le tango", B: "Le fado", C: "La polka", D: "Le blue-grass" }, "A"),
        makeQ("Quel genre musical est profondément lié au Brésil et au carnaval ?", { A: "La samba / bossa nova", B: "Le fado", C: "La polka", D: "Le yodel" }, "A"),
        makeQ("Quel instrument à percussions se joue avec deux mailloches sur des lames ?", { A: "Le xylophone / marimba", B: "La trompette", C: "La flûte", D: "La guitare" }, "A"),
        makeQ("Qu'est-ce qu'un album ?", { A: "Un ensemble de morceaux regroupés sous un même projet", B: "Une seule note", C: "Un câble jack", D: "Un siège de concert" }, "A"),
        makeQ("Quel instrument à vent se joue en soufflant dans une embouchure transversale ?", { A: "La flûte traversière", B: "Le violoncelle", C: "La batterie", D: "La harpe" }, "A"),
        makeQ("Qu'est-ce qu'un chœur ?", { A: "Un ensemble de chanteurs réunissant plusieurs voix", B: "Un seul tambour", C: "Un studio photo", D: "Une partition vide" }, "A"),
        makeQ("Quel rôle joue un batteur ?", { A: "Assurer la pulsation rythmique et les dynamiques de percussion", B: "Écrire les textes seuls", C: "Vendre les places", D: "Accorder le piano" }, "A"),
        makeQ("Qu'est-ce qu'une répétition (« répet ») ?", { A: "Travailler et ajuster un morceau avant un concert ou enregistrement", B: "Monter sur scène sans préparer", C: "Casser les cordes", D: "Couper le son" }, "A"),
        makeQ("Quel style vocal ou musical repose souvent sur le rythme, la rime et le flow ?", { A: "Le hip-hop / rap", B: "La sonate baroque", C: "Le chant grégorien", D: "La valse viennoise" }, "A"),
        makeQ("Quel accessoire tient souvent un guitariste pour pincer les cordes ?", { A: "Un médiator (pique)", B: "Un archet de violoncelle", C: "Une mailloche de timbale", D: "Une embouchure de trompette" }, "A")
      ]
    }
  ],

  literature: [
    {
      title: "Pack Littérature #1 - Genres & Classiques",
      questions: [
        makeQ("Qu'est-ce qu'une nouvelle littéraire ?", { A: "Un récit fictif bref souvent centré sur un événement ou une chute", B: "Une encyclopédie", C: "Un dictionnaire", D: "Un atlas" }, "A"),
        makeQ("Qui a écrit « Les Misérables » ?", { A: "Victor Hugo", B: "Émile Zola", C: "Jules Verne", D: "Albert Camus" }, "A"),
        makeQ("Qu'est-ce qu'une autobiographie ?", { A: "Le récit de sa propre vie écrit par l'auteur", B: "Un recueil de poèmes", C: "Une pièce en cinq actes", D: "Un manuel de grammaire" }, "A"),
        makeQ("Quel genre explore futurs, espace ou technologies ?", { A: "La science-fiction", B: "La tragédie antique", C: "La fable", D: "L'essai" }, "A"),
        makeQ("Qu'est-ce qu'une strophe ?", { A: "Un groupe de vers séparé des autres en poésie", B: "Le titre d'un chapitre", C: "La préface", D: "L'index" }, "A"),
        makeQ("Qui a écrit « Le Petit Prince » ?", { A: "Antoine de Saint-Exupéry", B: "Guy de Maupassant", C: "Gustave Flaubert", D: "Marcel Proust" }, "A"),
        makeQ("Comment appelle-t-on le personnage principal ?", { A: "Le protagoniste", B: "L'éditeur", C: "Le typographe", D: "Le relieur" }, "A"),
        makeQ("Quelle figure utilise « comme » ou « tel » pour rapprocher deux éléments ?", { A: "La comparaison", B: "L'anagramme", C: "La ponctuation", D: "La pagination" }, "A"),
        makeQ("Qu'est-ce qu'une fable ?", { A: "Un court récit souvent animalier porteur d'une morale", B: "Un roman de 800 pages", C: "Un journal intime", D: "Une loi" }, "A"),
        makeQ("Quel texte est écrit pour être joué sur scène ?", { A: "Une pièce de théâtre", B: "Un catalogue", C: "Un bulletin météo", D: "Un ticket" }, "A")
      ]
    },
    {
      title: "Pack Littérature #2 - Narration & Écritures",
      questions: [
        makeQ("Qu'est-ce qu'un narrateur omniscient ?", { A: "Un narrateur qui sait tout des personnages et de l'histoire", B: "Un personnage muet", C: "Le lecteur", D: "L'imprimeur" }, "A"),
        makeQ("Qu'est-ce qu'une rime ?", { A: "La ressemblance sonore en fin de vers ou de mots", B: "Une note de bas de page", C: "Un sommaire", D: "Une couverture" }, "A"),
        makeQ("Qu'est-ce qu'une métaphore ?", { A: "Associer deux réalités sans outil de comparaison explicite", B: "Compter les pages", C: "Corriger l'orthographe", D: "Relier le livre" }, "A"),
        makeQ("Qu'est-ce qu'un roman épistolaire ?", { A: "Un récit composé de lettres ou journaux", B: "Un livre de recettes", C: "Une pièce sans parole", D: "Un dictionnaire" }, "A"),
        makeQ("Qui a écrit « Roméo et Juliette » ?", { A: "William Shakespeare", B: "Molière", C: "Jean Racine", D: "Charles Baudelaire" }, "A"),
        makeQ("Qu'est-ce que le dénouement ?", { A: "La résolution de l'intrigue vers la fin", B: "Le premier mot du titre", C: "La table des matières", D: "Le prix du livre" }, "A"),
        makeQ("Quel poème bref japonais compte traditionnellement trois vers ?", { A: "Le haïku", B: "Le sonnet", C: "L'épopée", D: "La ballade" }, "A"),
        makeQ("Qu'est-ce qu'un pseudonyme ?", { A: "Un nom d'emprunt choisi par un auteur", B: "Un chapitre bonus", C: "Une faute de frappe", D: "Un marque-page" }, "A"),
        makeQ("Quel genre repose sur l'énigme et l'enquête ?", { A: "Le roman policier / mystère", B: "Le manuel technique", C: "La recette", D: "L'annuaire" }, "A"),
        makeQ("À quoi sert la quatrième de couverture ?", { A: "Présenter un résumé ou un aperçu du livre", B: "Coller un timbre", C: "Remplacer le texte", D: "Effacer l'ISBN" }, "A")
      ]
    },
                                                  {
      title: "Pack Littérature #3 - Style & Structure",
      questions: [
        makeQ("Qu'est-ce qu'un chapitre ?", { A: "Une subdivision organisée d'un livre ou roman", B: "Un stylo", C: "Une reliure", D: "Une encre" }, "A"),
        makeQ("Qu'est-ce qu'un dialogue ?", { A: "Un échange de paroles entre personnages", B: "Une carte géographique", C: "Un tableau de chiffres", D: "Une image" }, "A"),
        makeQ("Qu'est-ce qu'une biographie ?", { A: "Le récit de la vie d'une personne écrit par un autre auteur", B: "Un poème de deux mots", C: "Un dictionnaire", D: "Une facture" }, "A"),
        makeQ("Qu'est-ce qu'un vers en poésie ?", { A: "Une ligne soumise à des règles de rythme ou de sonorité", B: "Une page blanche", C: "Un numéro de page", D: "Un code-barres" }, "A"),
        makeQ("Qu'est-ce que la prose ?", { A: "La forme d'écriture continue non soumise aux contraintes du vers", B: "Une chanson sans parole", C: "Un dessin", D: "Une partition" }, "A"),
        makeQ("Qu'est-ce qu'une préface ?", { A: "Un texte introductif placé au début d'un ouvrage", B: "La fin de l'histoire", C: "Un marque-page", D: "Une enveloppe" }, "A"),
        makeQ("Qu'est-ce qu'un antagoniste ?", { A: "Un personnage s'opposant au protagoniste ou à ses objectifs", B: "Le relieur", C: "Le libraire", D: "Le lecteur" }, "A"),
        makeQ("Qu'est-ce qu'un recueil ?", { A: "Un ouvrage réunissant plusieurs textes courts (poèmes, nouvelles...)", B: "Un seul mot", C: "Une lampe", D: "Un écran" }, "A"),
        makeQ("À quoi sert un sommaire ou une table des matières ?", { A: "Repérer les parties et chapitres d'un livre", B: "Coller les pages", C: "Effacer l'encre", D: "Mesurer le poids" }, "A"),
        makeQ("Qu'est-ce qu'un conte ?", { A: "Un récit souvent bref incluant parfois des éléments merveilleux ou moraux", B: "Un rapport comptable", C: "Un mode d'emploi", D: "Un annuaire" }, "A")
      ]
    },
    {
      title: "Pack Littérature #4 - Lecture & Vocabulaire",
      questions: [
        makeQ("Qu'est-ce qu'un synonyme ?", { A: "Un mot de sens proche ou équivalent à un autre", B: "Un mot de sens opposé", C: "Un chiffre", D: "Un signe de ponctuation" }, "A"),
        makeQ("Qu'est-ce qu'un antonyme ?", { A: "Un mot de sens opposé à un autre", B: "Un mot de même sens", C: "Un chapitre", D: "Un auteur" }, "A"),
        makeQ("Qu'est-ce qu'un monologue au théâtre ?", { A: "Un passage où un personnage parle seul à voix haute", B: "Une bagarre générale", C: "Le rideau baissé", D: "L'entracte" }, "A"),
        makeQ("Qu'est-ce qu'une réplique ?", { A: "Les paroles d'un personnage dans un dialogue ou une pièce", B: "La couverture", C: "La colle", D: "La pagination" }, "A"),
        makeQ("Qu'est-ce qu'un roman fantastique ?", { A: "Un récit où l'irrationnel surgit au cœur d'un cadre réaliste", B: "Un livre de cuisine", C: "Un atlas routier", D: "Un dictionnaire" }, "A"),
        makeQ("À quoi sert un dictionnaire ?", { A: "Consulter le sens, l'orthographe ou l'usage des mots", B: "Calculer des racines carrées", C: "Mesurer la pluie", D: "Accorder une guitare" }, "A"),
        makeQ("Qu'est-ce qu'une morale à la fin d'une fable ?", { A: "L'enseignement ou la réflexion tirée de l'histoire", B: "Le numéro de page", C: "Le nom de l'imprimeur", D: "La date d'impression" }, "A"),
        makeQ("Qu'est-ce qu'un essai littéraire ?", { A: "Un texte exposant une réflexion ou une thèse sur un thème", B: "Une bande dessinée muette", C: "Un ticket de caisse", D: "Un calendrier" }, "A"),
        makeQ("Qu'est-ce qu'une allitération ?", { A: "La répétition d'une même consonne ou son consonantique", B: "Une faute d'orthographe", C: "Un saut de page", D: "Un titre" }, "A"),
        makeQ("Pourquoi lire régulièrement enrichit-il l'expression ?", { A: "Cela élargit le vocabulaire, les idées et la compréhension", B: "Cela supprime la langue", C: "Cela efface les mots", D: "Cela réduit l'attention" }, "A")
      ]
    }
  ],

  geography: [
    {
      title: "Pack Géographie #1 - Reliefs, Mers & Pays",
      questions: [
        makeQ("Quel est le plus haut sommet au-dessus du niveau de la mer ?", { A: "L'Everest", B: "Le Kilimandjaro", C: "Le mont Blanc", D: "Le mont Fuji" }, "A"),
        makeQ("Quel détroit sépare l'Europe (Espagne) et l'Afrique (Maroc) ?", { A: "Le détroit de Gibraltar", B: "Le détroit de Béring", C: "Le détroit d'Ormuz", D: "Le détroit de Malacca" }, "A"),
        makeQ("Quel est le plus grand pays du monde par superficie ?", { A: "La Russie", B: "Le Canada", C: "Le Brésil", D: "L'Australie" }, "A"),
        makeQ("Quelle ligne divise la Terre en hémisphères nord et sud ?", { A: "L'Équateur", B: "Le méridien de Greenwich", C: "Le cercle polaire", D: "Le tropique du Cancer" }, "A"),
        makeQ("Quel désert chaud est le plus étendu d'Afrique ?", { A: "Le Sahara", B: "Le désert de Gobi", C: "Le désert d'Atacama", D: "Le Mojave" }, "A"),
        makeQ("Quelle mer est bordée par l'Europe, l'Asie de l'Ouest et l'Afrique du Nord ?", { A: "La mer Méditerranée", B: "La mer Baltique", C: "La mer de Chine méridionale", D: "La mer Noire" }, "A"),
        makeQ("Quelle chaîne longe l'ouest de l'Amérique du Sud ?", { A: "La cordillère des Andes", B: "Les Carpates", C: "L'Oural", D: "Les Pyrénées" }, "A"),
        makeQ("Quel est le plus long fleuve d'Amérique du Sud ?", { A: "L'Amazone", B: "Le Danube", C: "Le Rhin", D: "La Seine" }, "A"),
        makeQ("Quel pays est aussi un continent ?", { A: "L'Australie", B: "L'Islande", C: "Madagascar", D: "Cuba" }, "A"),
        makeQ("Qu'est-ce qu'une île ?", { A: "Une terre entourée d'eau", B: "Une péninsule", C: "Un isthme", D: "Un plateau" }, "A")
      ]
    },
    {
      title: "Pack Géographie #2 - Climats, Frontières & Cartes",
      questions: [
        makeQ("Quel instrument aide à s'orienter avec le nord magnétique ?", { A: "Une boussole", B: "Un pluviomètre", C: "Un hygromètre", D: "Un altimètre" }, "A"),
        makeQ("Qu'est-ce qu'un archipel ?", { A: "Un ensemble d'îles proches", B: "Un canyon sous-marin", C: "Un glacier", D: "Un volcan éteint" }, "A"),
        makeQ("Quel océan borde l'est de l'Afrique et le sud de l'Asie ?", { A: "L'océan Indien", B: "L'océan Arctique", C: "L'Atlantique Nord", D: "La mer Caspienne" }, "A"),
        makeQ("Quelle grande île est au sud-est de l'Afrique dans l'océan Indien ?", { A: "Madagascar", B: "Groenland", C: "Taïwan", D: "Terre-Neuve" }, "A"),
        makeQ("Qu'est-ce qu'un delta ?", { A: "Une embouchure triangulaire formée de sédiments et bras fluviaux", B: "Un sommet enneigé", C: "Une faille volcanique", D: "Un lac salé" }, "A"),
        makeQ("Quelle latitude correspond au pôle Nord ?", { A: "90° Nord", B: "0°", C: "45° Nord", D: "23,5° Sud" }, "A"),
        makeQ("Quel isthme relie Amérique du Nord et Amérique du Sud ?", { A: "L'isthme de Panama", B: "L'isthme de Corinthe", C: "L'isthme de Kra", D: "L'isthme de Carélie" }, "A"),
        makeQ("Quel climat règne près de l'Équateur ?", { A: "Climat équatorial chaud et humide", B: "Climat polaire", C: "Climat subarctique", D: "Climat alpin" }, "A"),
        makeQ("Quel est le plus grand lac d'eau douce en superficie ?", { A: "Le lac Supérieur", B: "La mer Morte", C: "Le Grand Lac salé", D: "La mer d'Aral" }, "A"),
        makeQ("Quelle direction correspond à 90° horaire depuis le nord ?", { A: "L'Est", B: "L'Ouest", C: "Le Sud", D: "Le Sud-Ouest" }, "A")
      ]
    },
                  {
      title: "Pack Géographie #3 - Capitales & Continents",
      questions: [
        makeQ("Quelle est la capitale du Japon ?", { A: "Tokyo", B: "Séoul", C: "Bangkok", D: "Manille" }, "A"),
        makeQ("Quelle est la capitale de l'Égypte ?", { A: "Le Caire", B: "Alger", C: "Tunis", D: "Rabat" }, "A"),
        makeQ("Quelle est la capitale du Brésil ?", { A: "Brasília", B: "Buenos Aires", C: "Lima", D: "Bogotá" }, "A"),
        makeQ("Quelle est la capitale du Canada ?", { A: "Ottawa", B: "Toronto", C: "Vancouver", D: "Montréal" }, "A"),
        makeQ("Quel continent se situe au sud de la Méditerranée ?", { A: "L'Afrique", B: "L'Europe", C: "L'Océanie", D: "L'Antarctique" }, "A"),
        makeQ("Quel fleuve traverse Paris ?", { A: "La Seine", B: "Le Rhône", C: "La Garonne", D: "Le Rhin" }, "A"),
        makeQ("Quel détroit sépare l'Asie (Russie) de l'Amérique du Nord (Alaska) ?", { A: "Le détroit de Béring", B: "Le détroit de Gibraltar", C: "Le détroit d'Ormuz", D: "Le détroit de Cook" }, "A"),
        makeQ("Quel pays européen est une péninsule au sud-ouest de l'Europe ?", { A: "L'Espagne ou le Portugal", B: "La Norvège", C: "La Finlande", D: "La Pologne" }, "A"),
        makeQ("Qu'est-ce qu'une péninsule ?", { A: "Une terre entourée d'eau sur la majeure partie de son pourtour mais reliée au continent", B: "Un lac souterrain", C: "Un cratère", D: "Un nuage" }, "A"),
        makeQ("Quel océan entoure le pôle Nord ?", { A: "L'océan Arctique", B: "L'océan Indien", C: "L'océan Pacifique Sud", D: "La mer Rouge" }, "A")
      ]
    },
    {
      title: "Pack Géographie #4 - Cartographie & Relief",
      questions: [
        makeQ("À quoi sert la légende sur une carte géographique ?", { A: "Expliquer les symboles, couleurs et figurés utilisés", B: "Calculer l'heure", C: "Mesurer la pluie", D: "Allumer la carte" }, "A"),
        makeQ("Qu'est-ce qu'une vallée ?", { A: "Une dépression allongée souvent creusée par un cours d'eau ou un glacier", B: "Un sommet pointu", C: "Un océan", D: "Un satellite" }, "A"),
        makeQ("Qu'est-ce qu'un plateau géographique ?", { A: "Une étendue relativement plane située en altitude", B: "Une fosse marine", C: "Une rivière", D: "Un nuage" }, "A"),
        makeQ("Quel méridien de référence passe près de Londres ?", { A: "Le méridien de Greenwich (0°)", B: "L'Équateur", C: "Le tropique du Capricorne", D: "Le cercle polaire" }, "A"),
        makeQ("Quel continent glacé entoure le pôle Sud ?", { A: "L'Antarctique", B: "L'Arctique", C: "L'Europe", D: "L'Asie" }, "A"),
        makeQ("Quel grand fleuve traverse l'Égypte ?", { A: "Le Nil", B: "Le Niger", C: "Le Congo", D: "Le Zambèze" }, "A"),
        makeQ("Quel est le plus grand océan du monde ?", { A: "L'océan Pacifique", B: "L'océan Atlantique", C: "L'océan Indien", D: "L'océan Arctique" }, "A"),
        makeQ("Quelle mer borde l'Italie à l'est ?", { A: "La mer Adriatique", B: "La mer du Nord", C: "La mer Baltique", D: "La mer de Béring" }, "A"),
        makeQ("Quel massif montagneux sépare la France et l'Espagne ?", { A: "Les Pyrénées", B: "Les Alpes", C: "Le Jura", D: "Les Vosges" }, "A"),
        makeQ("Quel pays d'Asie est composé d'un vaste archipel ?", { A: "Le Japon ou l'Indonésie ou les Philippines", B: "La Mongolie", C: "Le Népal", D: "Le Laos" }, "A")
      ]
    }
  ],

  math: [
    {
      title: "Pack Maths #1 - Calcul & Algèbre",
      questions: [
        makeQ("Combien font 15 × 6 ?", { A: "80", B: "90", C: "96", D: "105" }, "B"),
        makeQ("Quelle est la racine carrée de 144 ?", { A: "11", B: "12", C: "13", D: "14" }, "B"),
        makeQ("Combien vaut 2^5 ?", { A: "10", B: "16", C: "25", D: "32" }, "D"),
        makeQ("Si 3x + 6 = 21, combien vaut x ?", { A: "3", B: "5", C: "7", D: "9" }, "B"),
        makeQ("Quel est le périmètre d'un carré de côté 7 cm ?", { A: "14 cm", B: "21 cm", C: "28 cm", D: "49 cm" }, "C"),
        makeQ("Combien font 25 % de 200 ?", { A: "25", B: "40", C: "50", D: "75" }, "C"),
        makeQ("Quel nombre est premier ?", { A: "15", B: "21", C: "29", D: "33" }, "C"),
        makeQ("Quelle est l'aire d'un rectangle de 9 cm sur 4 cm ?", { A: "13 cm²", B: "26 cm²", C: "36 cm²", D: "45 cm²" }, "C"),
        makeQ("Combien font (-8) + 13 ?", { A: "-21", B: "-5", C: "5", D: "21" }, "C"),
        makeQ("Combien font 100 - (18 + 22) ?", { A: "40", B: "50", C: "60", D: "78" }, "C")
      ]
    },
    {
      title: "Pack Maths #2 - Géométrie & Suites",
      questions: [
        makeQ("Quelle est la somme des angles d'un triangle ?", { A: "90°", B: "180°", C: "270°", D: "360°" }, "B"),
        makeQ("Quel nombre suit : 2, 6, 18, 54, ... ?", { A: "108", B: "162", C: "216", D: "72" }, "B"),
        makeQ("Combien font 3/4 + 1/4 ?", { A: "1/2", B: "1", C: "4/8", D: "2" }, "B"),
        makeQ("Quel est le volume d'un cube d'arête 3 cm ?", { A: "9 cm³", B: "18 cm³", C: "27 cm³", D: "36 cm³" }, "C"),
        makeQ("Combien font 14 × 11 ?", { A: "144", B: "154", C: "164", D: "174" }, "B"),
        makeQ("Quel est le PGCD de 24 et 36 ?", { A: "6", B: "12", C: "18", D: "24" }, "B"),
        makeQ("Prix initial 80 €, remise de 10 % : nouveau prix ?", { A: "70 €", B: "72 €", C: "78 €", D: "64 €" }, "B"),
        makeQ("Combien font 7² + 3² ?", { A: "20", B: "58", C: "100", D: "40" }, "B"),
        makeQ("Combien font 144 / 12 ?", { A: "10", B: "11", C: "12", D: "14" }, "C"),
        makeQ("Combien mesure un angle droit ?", { A: "45°", B: "90°", C: "180°", D: "360°" }, "B")
      ]
    },
        {
      title: "Pack Maths #3 - Fractions, Puissances & Équations",
      questions: [
        makeQ("Combien font 1/2 + 1/3 ?", { A: "5/6", B: "2/5", C: "1/6", D: "2/3" }, "A"),
        makeQ("Si 2x - 4 = 10, combien vaut x ?", { A: "7", B: "3", C: "5", D: "8" }, "A"),
        makeQ("Combien vaut 5^3 ?", { A: "125", B: "15", C: "25", D: "75" }, "A"),
        makeQ("Quelle est la racine carrée de 81 ?", { A: "9", B: "8", C: "7", D: "18" }, "A"),
        makeQ("Combien font 0,5 × 0,4 ?", { A: "0,2", B: "2", C: "0,02", D: "0,9" }, "A"),
        makeQ("Quel est le PPCM de 4 et 6 ?", { A: "12", B: "24", C: "2", D: "10" }, "A"),
        makeQ("Combien font 50 % de 90 ?", { A: "45", B: "40", C: "50", D: "35" }, "A"),
        makeQ("Si un rectangle a un périmètre de 20 cm et une longueur de 6 cm, quelle est sa largeur ?", { A: "4 cm", B: "14 cm", C: "3 cm", D: "8 cm" }, "A"),
        makeQ("Combien font (-3) × (-4) ?", { A: "12", B: "-12", C: "-7", D: "7" }, "A"),
        makeQ("Quel est le nombre suivant : 5, 10, 20, 40, ... ?", { A: "80", B: "60", C: "100", D: "50" }, "A")
      ]
    },
    {
      title: "Pack Maths #4 - Calcul Mental & Proportionnalité",
      questions: [
        makeQ("Combien font 25 × 4 ?", { A: "100", B: "29", C: "75", D: "125" }, "A"),
        makeQ("Combien font 10 % de 350 ?", { A: "35", B: "3,5", C: "350", D: "30" }, "A"),
        makeQ("Combien font 18 + 27 ?", { A: "45", B: "35", C: "55", D: "43" }, "A"),
        makeQ("Combien font 63 / 7 ?", { A: "9", B: "8", C: "7", D: "6" }, "A"),
        makeQ("Quel est le double de 37 ?", { A: "74", B: "64", C: "84", D: "54" }, "A"),
        makeQ("Quel est le triple de 19 ?", { A: "57", B: "47", C: "67", D: "37" }, "A"),
        makeQ("Si 3 cahiers coûtent 6 €, combien coûtent 5 cahiers au même prix ?", { A: "10 €", B: "8 €", C: "12 €", D: "15 €" }, "A"),
        makeQ("Combien font 11² ?", { A: "121", B: "22", C: "111", D: "101" }, "A"),
        makeQ("Combien font 1000 - 375 ?", { A: "625", B: "725", C: "525", D: "675" }, "A"),
        makeQ("Combien font 8 × 9 ?", { A: "72", B: "64", C: "81", D: "56" }, "A")
      ]
    }
  ],

  hard: [
    {
      title: "Pack Difficile #1 - Précision & Savoir Pointu",
      questions: [
        makeQ("Quel élément a pour numéro atomique 79 ?", { A: "L'or (Au)", B: "Le platine (Pt)", C: "Le mercure (Hg)", D: "Le plomb (Pb)" }, "A"),
        makeQ("Quel théorème relie les côtés d'un triangle rectangle ?", { A: "Le théorème de Pythagore", B: "Le théorème d'Euclide", C: "Le théorème d'Archimède", D: "Le théorème de Thalès" }, "A"),
        makeQ("Comment s'appelle la poussée subie par un corps immergé ?", { A: "La poussée d'Archimède", B: "La force de Coriolis", C: "L'effet Doppler", D: "L'inertie" }, "A"),
        makeQ("Quelle planète a une rotation rétrograde très lente ?", { A: "Vénus", B: "Mars", C: "Jupiter", D: "Neptune" }, "A"),
        makeQ("Combien de bits composent un octet ?", { A: "8 bits", B: "4 bits", C: "16 bits", D: "32 bits" }, "A"),
        makeQ("Qui a écrit « Cent ans de solitude » ?", { A: "Gabriel García Márquez", B: "Jorge Luis Borges", C: "Mario Vargas Llosa", D: "Pablo Neruda" }, "A"),
        makeQ("Quel gaz à effet de serre a un fort pouvoir de réchauffement sur 20 ans ?", { A: "Le méthane (CH4)", B: "L'azote (N2)", C: "L'argon (Ar)", D: "L'hélium (He)" }, "A"),
        makeQ("Combien font 17 × 19 ?", { A: "323", B: "313", C: "333", D: "343" }, "A"),
        makeQ("Quel est le plus petit État indépendant par superficie ?", { A: "Le Vatican", B: "Monaco", C: "Saint-Marin", D: "Nauru" }, "A"),
        makeQ("Quel organe produit la bile stockée dans la vésicule biliaire ?", { A: "Le foie", B: "La rate", C: "Le pancréas", D: "La thyroïde" }, "A")
      ]
    },
    {
      title: "Pack Difficile #2 - Analyse & Érudition",
      questions: [
        makeQ("Quelle est la dérivée de f(x) = x³ par rapport à x ?", { A: "3x²", B: "x²", C: "3x", D: "x⁴ / 4" }, "A"),
        makeQ("Quelle est la plus grande lune de Saturne ?", { A: "Titan", B: "Europe", C: "Io", D: "Ganymède" }, "A"),
        makeQ("En quelle année l'ONU a-t-elle adopté la Déclaration universelle des droits de l'homme ?", { A: "1948", B: "1945", C: "1951", D: "1966" }, "A"),
        makeQ("Quel acide est présent dans les agrumes ?", { A: "L'acide citrique", B: "L'acide chlorhydrique", C: "L'acide sulfurique", D: "L'acide nitrique" }, "A"),
        makeQ("Combien y a-t-il de nombres premiers inférieurs à 20 ?", { A: "8 (2, 3, 5, 7, 11, 13, 17, 19)", B: "6", C: "7", D: "9" }, "A"),
        makeQ("Quelle ville est la capitale de l'Australie ?", { A: "Canberra", B: "Sydney", C: "Melbourne", D: "Brisbane" }, "A"),
        makeQ("Quel rayonnement se situe juste au-delà du violet ?", { A: "Les ultraviolets (UV)", B: "Les infrarouges", C: "Les ondes FM", D: "Les micro-ondes" }, "A"),
        makeQ("Qui a composé « Les Quatre Saisons » ?", { A: "Antonio Vivaldi", B: "Frédéric Chopin", C: "Igor Stravinsky", D: "Claude Debussy" }, "A"),
        makeQ("Quelle est la somme des entiers de 1 à 10 ?", { A: "55", B: "45", C: "50", D: "65" }, "A"),
        makeQ("Quelle écriture sert notamment pour le sanskrit classique ?", { A: "La devanagari", B: "Le cunéiforme", C: "Le cyrillique", D: "Le hangul" }, "A")
      ]
    },
                  {
      title: "Pack Difficile #3 - Sciences & Logique Poussée",
      questions: [
        makeQ("Quelle est la constante mathématique approchée par 3,14159 ?", { A: "Pi (π)", B: "Phi (φ)", C: "Euler (e)", D: "Racine de 2" }, "A"),
        makeQ("Quel métal a pour symbole chimique 'Fe' ?", { A: "Le fer", B: "Le fluor", C: "Le francium", D: "La fermium" }, "A"),
        makeQ("Quel est le symbole chimique du potassium ?", { A: "K", B: "P", C: "Po", D: "Pt" }, "A"),
        makeQ("Combien vaut 2^8 ?", { A: "256", B: "128", C: "512", D: "64" }, "A"),
        makeQ("Quel est le plus grand océan après le Pacifique ?", { A: "L'océan Atlantique", B: "L'océan Indien", C: "L'océan Arctique", D: "L'océan Austral" }, "A"),
        makeQ("Quel pays a pour capitale Wellington ?", { A: "La Nouvelle-Zélande", B: "L'Australie", C: "L'Irlande", D: "L'Islande" }, "A"),
        makeQ("Quel gaz est responsable de l'effet de serre principal lié aux combustibles fossiles ?", { A: "Le dioxyde de carbone (CO2)", B: "L'azote (N2)", C: "L'argon (Ar)", D: "L'hélium (He)" }, "A"),
        makeQ("Combien font 13 × 13 ?", { A: "169", B: "156", C: "144", D: "196" }, "A"),
        makeQ("Quel est le nom scientifique de l'eau à l'état solide naturel ?", { A: "La glace", B: "Le plasma", C: "Le gaz", D: "L'argon" }, "A"),
        makeQ("Quelle est la capitale de la Suisse ?", { A: "Berne", B: "Zurich", C: "Genève", D: "Bâle" }, "A")
      ]
    },
    {
      title: "Pack Difficile #4 - Haute Voltige",
      questions: [
        makeQ("Combien font 23 × 11 ?", { A: "253", B: "243", C: "263", D: "233" }, "A"),
        makeQ("Quel est le numéro atomique du carbone ?", { A: "6", B: "8", C: "12", D: "14" }, "A"),
        makeQ("Quelle planète est connue pour ses anneaux glacés majeurs ?", { A: "Saturne", B: "Mercure", C: "Mars", D: "Vénus" }, "A"),
        makeQ("Quel est le plus long fleuve d'Europe ?", { A: "La Volga", B: "La Seine", C: "La Tamise", D: "Le Tage" }, "A"),
        makeQ("Combien font 15² ?", { A: "225", B: "150", C: "250", D: "30" }, "A"),
        makeQ("Quel est le symbole chimique de l'argent ?", { A: "Ag", B: "Ar", C: "Au", D: "Al" }, "A"),
        makeQ("Quel continent ne compte aucun pays souverain permanent ?", { A: "L'Antarctique", B: "L'Asie", C: "L'Amérique du Sud", D: "L'Europe" }, "A"),
        makeQ("Combien font 19 × 20 ?", { A: "380", B: "360", C: "390", D: "400" }, "A"),
        makeQ("Quel est le système de base 2 utilisé en informatique ?", { A: "Le binaire", B: "Le romain", C: "Le quinaire", D: "Le duodécimal" }, "A"),
        makeQ("Quelle est la capitale de la Norvège ?", { A: "Oslo", B: "Stockholm", C: "Copenhague", D: "Helsinki" }, "A")
      ]
    }
  ],

  trivia: [
    {
      title: "Pack Trivia #1 - Anecdotes & Curiosités",
      questions: [
        makeQ("Quel fruit flotte facilement grâce à l'air emprisonné dans sa chair ?", { A: "La pomme", B: "La noix de coco entière", C: "La banane épluchée", D: "Le raisin" }, "A"),
        makeQ("Combien de cœurs possède une pieuvre commune ?", { A: "1", B: "2", C: "3", D: "4" }, "C"),
        makeQ("Quel est l'instrument de musique le plus vendu au monde ?", { A: "L'harmonica", B: "La flûte à bec / piano", C: "Le clavecin", D: "La cornemuse" }, "B"),
        makeQ("Quelle couleur est absente de l'arc-en-ciel optique continu ?", { A: "Le rose / magenta pur", B: "Le jaune", C: "Le bleu", D: "Le rouge" }, "A"),
        makeQ("Quel animal flotte parfois sur le dos en se tenant la patte ?", { A: "La loutre de mer", B: "Le kangourou", C: "Le hérisson", D: "Le flamant rose" }, "A"),
        makeQ("Quel mot désigne la peur des espaces clos ?", { A: "La claustrophobie", B: "L'arachnophobie", C: "L'acrophobie", D: "L'hydrophobie" }, "A"),
        makeQ("Sur un clavier AZERTY, quelle touche est juste à droite du 'E' ?", { A: "R", B: "Z", C: "T", D: "W" }, "A"),
        makeQ("Quel continent est un désert froid polaire ?", { A: "L'Antarctique", B: "La Lune", C: "Le Pacifique", D: "La Stratosphère" }, "A"),
        makeQ("Quelle forme géométrique a une boîte de conserve cylindrique ?", { A: "Un cylindre", B: "Un tétraèdre", C: "Un dodécaèdre", D: "Un cône" }, "A"),
        makeQ("Quelle épice provient des stigmates du crocus ?", { A: "Le safran", B: "Le poivre noir", C: "La cannelle", D: "Le gingembre" }, "A")
      ]
    },
    {
      title: "Pack Trivia #2 - Culture Pop & Insolite",
      questions: [
        makeQ("Combien de cases a un échiquier standard ?", { A: "64 cases", B: "50 cases", C: "72 cases", D: "81 cases" }, "A"),
        makeQ("Quel oiseau peut voler en arrière ?", { A: "Le colibri", B: "L'autruche", C: "Le manchot", D: "Le pélican" }, "A"),
        makeQ("Quel est le symbole chimique du fer ?", { A: "Fe", B: "Ir", C: "Fr", D: "F" }, "A"),
        makeQ("Quel jeu utilise des grilles ou cartes et le cri « Bingo » ?", { A: "Le bingo / loto", B: "Les échecs", C: "Le sudoku", D: "Le scrabble" }, "A"),
        makeQ("Quelle planète a un système d'anneaux glacés célèbre ?", { A: "Saturne", B: "Mercure", C: "Mars", D: "Vénus" }, "A"),
        makeQ("Quel animal terrestre est le plus rapide en sprint court ?", { A: "Le guépard", B: "Le paresseux", C: "La tortue géante", D: "Le koala" }, "A"),
        makeQ("Combien de secondes dure une journée terrestre ?", { A: "86 400 secondes", B: "36 000 secondes", C: "100 000 secondes", D: "14 400 secondes" }, "A"),
        makeQ("Quel métal est liquide à température ambiante ?", { A: "Le mercure", B: "Le zinc", C: "Le titane", D: "Le cobalt" }, "A"),
        makeQ("Quelle langue utilise l'alphabet cyrillique ?", { A: "Le russe / bulgare", B: "Le portugais", C: "Le coréen", D: "Le vietnamien" }, "A"),
        makeQ("Quel est le point océanique le plus profond connu ?", { A: "La fosse des Mariannes", B: "Le mont Everest", C: "Le Grand Canyon", D: "Le plateau tibétain" }, "A")
      ]
    },
            makeQ("Quel astre est visible à l'œil nu la nuit en plus des étoiles ?", { A: "La Lune et certaines planètes", B: "Un trou noir isolé", C: "Une bactérie", D: "Un atome" }, "A")
      ]
    },
    {
      title: "Pack Trivia #4 - Défis Insolites",
      questions: [
        makeQ("Combien de faces a un cube ?", { A: "6", B: "4", C: "8", D: "12" }, "A"),
        makeQ("Combien d'arêtes a un cube ?", { A: "12", B: "6", C: "8", D: "10" }, "A"),
        makeQ("Combien de sommets a un cube ?", { A: "8", B: "6", C: "12", D: "4" }, "A"),
        makeQ("Quel est le résultat de 9 × 9 ?", { A: "81", B: "72", C: "90", D: "63" }, "A"),
        makeQ("Quel est le symbole chimique de l'hélium ?", { A: "He", B: "H", C: "Hg", D: "Ho" }, "A"),
        makeQ("Quelle planète est la plus éloignée du Soleil parmi les planètes principales ?", { A: "Neptune", B: "Mars", C: "Vénus", D: "Terre" }, "A"),
        makeQ("Quel instrument mesure la pression atmosphérique ?", { A: "Le baromètre", B: "Le thermomètre", C: "Le podomètre", D: "Le chronomètre" }, "A"),
        makeQ("Quel est le nom du triangle ayant trois côtés de même longueur ?", { A: "Un triangle équilatéral", B: "Un triangle rectangle", C: "Un triangle obtus", D: "Un carré" }, "A"),
        makeQ("Combien font 1000 divisé par 10 ?", { A: "100", B: "10", C: "1000", D: "50" }, "A"),
        makeQ("Quel est le premier mois de l'année civile ?", { A: "Janvier", B: "Mars", C: "Décembre", D: "Avril" }, "A")
      ]
    }
  ]
};

function getPlayerStatsStore() {
  if (!global.GoatBot) return {};
  if (!global.GoatBot.quizPlayerStats) {
    global.GoatBot.quizPlayerStats = {};
  }
  return global.GoatBot.quizPlayerStats;
}

function getOrCreatePlayerStats(senderID) {
  const store = getPlayerStatsStore();
  if (!store[senderID]) {
    store[senderID] = {
      senderID: String(senderID),
      xp: 0,
      level: 1,
      totalCorrect: 0,
      bestStreak: 0,
      extremeCompleted: 0,
      perfectGames: 0,
      claimedObjectives: []
    };
  }
  return store[senderID];
}

function computeLevelFromXp(xp) {
  return Math.max(1, Math.floor(xp / 250) + 1);
}

async function grantXpAndEvaluateObjectives({ senderID, gainedXp, currentStreak, completedExtreme, perfectGame, usersData }) {
  const stats = getOrCreatePlayerStats(senderID);
  stats.xp += gainedXp;
  if (currentStreak > stats.bestStreak) {
    stats.bestStreak = currentStreak;
  }
  if (completedExtreme) {
    stats.extremeCompleted += 1;
  }
  if (perfectGame) {
    stats.perfectGames += 1;
  }

  const unlocked = [];

  for (const obj of OBJECTIVES_CATALOG) {
    if (stats.claimedObjectives.includes(obj.id)) continue;

    let currentProgress = 0;
    if (obj.id === "first_blood" || obj.id === "veteran_25") {
      currentProgress = stats.totalCorrect;
    } else if (obj.id === "streak_master") {
      currentProgress = stats.bestStreak;
    } else if (obj.id === "extreme_hunter") {
      currentProgress = stats.extremeCompleted;
    } else if (obj.id === "perfectionist") {
      currentProgress = stats.perfectGames;
    }

    if (currentProgress >= obj.target) {
      stats.claimedObjectives.push(obj.id);
      stats.xp += obj.rewardXp;
      try {
        await usersData.addMoney(senderID, obj.rewardCoins);
      } catch (_) {}
      unlocked.push(obj);
    }
  }

  const previousLevel = stats.level;
  stats.level = computeLevelFromXp(stats.xp);

  return {
    stats,
    unlocked,
    leveledUp: stats.level > previousLevel
  };
}

function buildLeaderboardText(api) {
  const store = getPlayerStatsStore();
  const entries = Object.values(store)
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .slice(0, 10);

  if (!entries.length) {
    return "🏆 CLASSEMENT DES NIVEAUX\n━━━━━━━━━━━━━━━━━━━━━━\nAucun joueur enregistré pour le moment.\nJouez une partie pour apparaître au classement !";
  }

  const lines = entries.map((p, idx) => {
    const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
          const name = api && api.getCurrentUserID && String(api.getCurrentUserID()) === String(p.senderID)
      ? "Bot"
      : `Joueur (${String(p.senderID).slice(-5)})`;
    return `${medal} ${name} — Niv. ${p.level} (${p.xp} XP) • ✅ ${p.totalCorrect}`;
  });

  return `🏆 CLASSEMENT DES NIVEAUX (TOP 10)\n━━━━━━━━━━━━━━━━━━━━━━\n${lines.join("\n")}\n━━━━━━━━━━━━━━━━━━━━━━\n💡 1 Niveau = 250 XP • Objectifs = Coins + XP`;
}

function shuffleArray(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandomDifficulty() {
  const idx = Math.floor(Math.random() * DIFFICULTIES.length);
  return DIFFICULTIES[idx];
}

function buildLocalSessionQuestions(languageCode, categoryCode) {
  if (languageCode === "french") {
    const sets = FRENCH_QUESTIONNAIRES_BY_CATEGORY[categoryCode] || FRENCH_QUESTIONNAIRES_BY_CATEGORY.general;
    const chosenSet = sets[Math.floor(Math.random() * sets.length)];
    const shuffled = shuffleArray(chosenSet.questions).slice(0, TOTAL_QUESTIONS);
    return {
      questionnaireTitle: chosenSet.title,
      questions: shuffled
    };
  }

  const englishPool = [
    makeQ("What is the capital of France?", { A: "Berlin", B: "Madrid", C: "Paris", D: "Rome" }, "C"),
    makeQ("Which planet is closest to the Sun?", { A: "Venus", B: "Mars", C: "Mercury", D: "Saturn" }, "C"),
    makeQ("What is 12 x 8?", { A: "84", B: "92", C: "96", D: "108" }, "C"),
    makeQ("Which chemical element has symbol O?", { A: "Gold", B: "Osmium", C: "Oxygen", D: "Oganesson" }, "C"),
    makeQ("How many continents are commonly taught?", { A: "5", B: "6 or 7", C: "9", D: "4" }, "B"),
    makeQ("What is the largest ocean on Earth?", { A: "Atlantic", B: "Indian", C: "Pacific", D: "Arctic" }, "C"),
    makeQ("In what year did humans first land on the Moon?", { A: "1965", B: "1969", C: "1972", D: "1959" }, "B"),
    makeQ("How many sides does a hexagon have?", { A: "5", B: "6", C: "7", D: "8" }, "B"),
    makeQ("What is the square root of 144?", { A: "11", B: "12", C: "13", D: "14" }, "B"),
    makeQ("Which gas makes up most of Earth's atmosphere?", { A: "Nitrogen", B: "Helium", C: "Neon", D: "Argon" }, "A")
  ];

  return {
    questionnaireTitle: `Standard Pack (${categoryCode})`,
    questions: shuffleArray(englishPool).slice(0, TOTAL_QUESTIONS)
  };
}

async function tryFetchExternalQuestions(selectedLanguage, selectedCategory) {
  if (!global.utils || typeof global.utils.STBotApis !== "function") {
    return null;
  }

  const stbotApi = new global.utils.STBotApis();
  if (!stbotApi || !stbotApi.baseURL) {
    return null;
  }

  const collected = [];
  const seen = new Set();

  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    try {
      const response = await axios.post(
        `${stbotApi.baseURL}/api/quiz/generate`,
        {
          language: selectedLanguage.code,
          category: selectedCategory.code
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 6000
        }
      );

      const item = response.data && response.data.success && response.data.data;
      if (item && item.question && item.options && item.correct) {
        const key = item.question.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          collected.push(item);
        }
      }
    } catch (_) {
      break;
    }
  }

  if (collected.length === TOTAL_QUESTIONS) {
    return {
      questionnaireTitle: `API Quiz (${selectedCategory.name})`,
      questions: collected
    };
  }

  return null;
}

async function prepareSessionQuestions(selectedLanguage, selectedCategory) {
  if (selectedLanguage.code === "french") {
    return buildLocalSessionQuestions(selectedLanguage.code, selectedCategory.code);
  }

  const external = await tryFetchExternalQuestions(selectedLanguage, selectedCategory);
                                                               if (external) {
    return external;
  }

  return buildLocalSessionQuestions(selectedLanguage.code, selectedCategory.code);
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

function calculateAnswerReward(combinedMultiplier = 1) {
  const randomValue = Math.random();
  let baseReward;

  if (randomValue < 0.7) {
    baseReward = Math.floor(Math.random() * 900) + 100;
  } else if (randomValue < 0.95) {
    baseReward = Math.floor(Math.random() * 500) + 1000;
  } else {
    baseReward = Math.floor(Math.random() * 501) + 1500;
  }

  return Math.max(50, Math.round(baseReward * combinedMultiplier));
}

function getCompletionReward(correctCount, totalQuestions, selectedDifficulty, categoryMultiplier = 1) {
  const diffPrime = selectedDifficulty && typeof selectedDifficulty.prime === "number" ? selectedDifficulty.prime : 650;
  const diffMult = selectedDifficulty && typeof selectedDifficulty.multiplier === "number" ? selectedDifficulty.multiplier : 1;
  const ratio = correctCount / totalQuestions;

  let tierBonus = 300;
  let rank = "🥉 APPRENTI EN ENTRAÎNEMENT";

  if (correctCount === totalQuestions) {
    rank = "🏆 MAÎTRE ABSOLU (10/10 PARFAIT)";
    tierBonus = 5000;
  } else if (ratio >= 0.8) {
    rank = "🥇 EXPERT DU QUIZ";
    tierBonus = 2500;
  } else if (ratio >= 0.5) {
    rank = "🥈 JOUEUR CONFIRMÉ";
    tierBonus = 1000;
  }

  const totalBonus = Math.round((diffPrime + tierBonus) * categoryMultiplier * (0.5 + 0.5 * diffMult));
  return {
    rank,
    diffPrime,
    bonus: totalBonus
  };
}

function formatOptionsForDisplay(options, hiddenLetters = []) {
  const hiddenSet = new Set((hiddenLetters || []).map(x => String(x).toUpperCase()));
  return Object.entries(options || {})
    .map(([key, value]) => {
      const upperKey = String(key).toUpperCase();
      if (hiddenSet.has(upperKey)) {
        return `~~${upperKey}. [Éliminée par 50/50]~~`;
      }
      return `${upperKey}. ${value}`;
    })
    .join("\n\n");
}

function clearReplyTimer(replyEntry) {
  if (replyEntry && replyEntry.timerId) {
    clearTimeout(replyEntry.timerId);
    replyEntry.timerId = null;
  }
}

async function advanceAfterQuestion({ message, event, session, updatedScore, updatedStreak, updatedCoins, commandName, usersData }) {
  const activeDifficulty = session.selectedDifficulty || DIFFICULTIES[1];
  const catMultiplier = session.selectedCategory && session.selectedCategory.multiplier ? session.selectedCategory.multiplier : 1;
  const nextIndex = session.currentIndex + 1;

  if (nextIndex >= TOTAL_QUESTIONS) {
    const completion = getCompletionReward(updatedScore, TOTAL_QUESTIONS, activeDifficulty, catMultiplier);

    try {
      await usersData.addMoney(event.senderID, completion.bonus);
    } catch (err) {
      console.error("Quiz completion bonus error:", err);
    }

    const sessionXpGain = (updatedScore * activeDifficulty.xpPerAnswer) + 100;
    const xpEval = await grantXpAndEvaluateObjectives({
      senderID: event.senderID,
      gainedXp: sessionXpGain,
      currentStreak: updatedStreak,
      completedExtreme: activeDifficulty.code === "extreme",
      perfectGame: updatedScore === TOTAL_QUESTIONS,
      usersData
    });

    const totalWithBonus = updatedCoins + completion.bonus;
    const levelUpLine = xpEval.leveledUp ? `\n🎉 **MONTÉE DE NIVEAU !** Vous êtes maintenant **Niveau ${xpEval.stats.level}** !` : "";
      const unlockedText = xpEval.unlocked.length
      ? `\n🎯 Objectif(s) débloqué(s) : ${xpEval.unlocked.map(o => `${o.title} (+${o.rewardCoins} coins, +${o.rewardXp} XP)`).join(", ")}`
      : "";

    setTimeout(async () => {
      await message.reply(
        `🏁 FIN DU QUIZ — ${TOTAL_QUESTIONS}/${TOTAL_QUESTIONS} QUESTIONS TERMINÉES\n━━━━━━━━━━━━━━━━━━━━━━\n📌 Catégorie : ${session.selectedCategory.name}\n⚡ Difficulté tirée : ${activeDifficulty.name}\n📘 Pack : ${session.questionnaireTitle}\n\n⭐ Score final : ${updatedScore}/${TOTAL_QUESTIONS}\n🏅 Rang : ${completion.rank}\n🎖️ Niveau : Niv.${xpEval.stats.level} (${xpEval.stats.xp} XP)${levelUpLine}\n🎁 Prime & bonus : +${completion.bonus} coins (Prime de base : +${completion.diffPrime})\n💰 Total gagné sur la partie : ${totalWithBonus} coins${unlockedText}\n━━━━━━━━━━━━━━━━━━━━━━\n💡 Tapez "top" pour le classement ou relancez la commande pour rejouer !`
      );
    }, 1500);
    return;
  }

  const nextSession = {
    ...session,
    selectedDifficulty: activeDifficulty,
    currentIndex: nextIndex,
    score: updatedScore,
    streak: updatedStreak,
    totalCoinsEarned: updatedCoins
  };

  setTimeout(async () => {
    try {
      await sendQuestionAtIndex({
        message,
        event,
        session: nextSession,
        commandName,
        hiddenLetters: [],
        usersData
      });
    } catch (err) {
      console.error("Quiz next question error:", err);
      await message.reply("❌ Impossible de charger la question suivante.");
    }
  }, 1500);
}

async function sendQuestionAtIndex({ message, event, session, commandName, hiddenLetters = [], usersData }) {
  const {
    questions,
    currentIndex,
    score,
    streak,
    totalCoinsEarned,
    selectedLanguage,
    selectedCategory,
    selectedDifficulty,
    questionnaireTitle
  } = session;

  const quizData = questions[currentIndex];
  const questionNumber = currentIndex + 1;
  const playerStats = getOrCreatePlayerStats(event.senderID);

  const optionsText = formatOptionsForDisplay(quizData.options, hiddenLetters);

  const sent = await message.reply(
    `⚡ Difficulté tirée : ${selectedDifficulty.name} (Prime: +${selectedDifficulty.prime} | x${selectedDifficulty.multiplier})\n🎯 ${selectedCategory.name} • ${questionnaireTitle}\n⏱️ Temps imparti : ${QUESTION_TIMEOUT_SECONDS}s\n📊 Q${questionNumber}/${TOTAL_QUESTIONS} | ⭐ Score: ${score}/${questionNumber - 1} | 🔥 Série: ${streak} | 🏅 Niv.${playerStats.level} | 💰 ${totalCoinsEarned}\n━━━━━━━━━━━━━━━━━━━━━━\n\n❓ ${quizData.question}\n\n${optionsText}\n\n━━━━━━━━━━━━━━━━━━━━━━\n💡 Répondez A/B/C/D (${QUESTION_TIMEOUT_SECONDS}s) • "shop" = Aides • "top" = Classement • "fin" = Quitter`
  );

  const replyRecord = {
    commandName,
    messageID: sent.messageID,
    author: event.senderID,
    type: "answerQuiz",
    session: {
      ...session,
      currentIndex
    },
    quizData,
    hiddenLetters,
    selectedLanguage,
    selectedCategory,
    selectedDifficulty,
    quizMessageID: sent.messageID,
    answered: false,
    timerId: null
  };

  replyRecord.timerId = setTimeout(async () => {
    const currentEntry = global.GoatBot && global.GoatBot.onReply && global.GoatBot.onReply.get(sent.messageID);
    if (!currentEntry || currentEntry.answered) return;
    currentEntry.answered = true;
    global.GoatBot.onReply.delete(sent.messageID);

    const correctLetter = resolveCorrectLetter(quizData);
    const correctText = quizData.options && quizData.options[correctLetter]
      ? `${correctLetter}. ${quizData.options[correctLetter]}`
      : correctLetter;

    try {
      await message.reply(
        `⏰ TEMPS ÉCOULÉ (${QUESTION_TIMEOUT_SECONDS}s) ! (${questionNumber}/${TOTAL_QUESTIONS})\n━━━━━━━━━━━━━━━━━━━━━━\nBonne réponse : ${correctText}\n🔥 Série réinitialisée à 0 • ⭐ Score : ${score}/${questionNumber}\n⏳ Passage automatique à la suite...`
      );
    } catch (_) {}

    await advanceAfterQuestion({
      message,
      event,
      session: {
        ...session,
        currentIndex
      },
      updatedScore: score,
      updatedStreak: 0,
      updatedCoins: totalCoinsEarned,
      commandName,
      usersData
    });
  }, QUESTION_TIMEOUT_MS);

  global.GoatBot.onReply.set(sent.messageID, replyRecord);

  return sent;
}

module.exports = {
  config: {
    name: "quiz",
    aliases: [],
      version: "4.1.0",
    author: "ST | Sheikh Tamim (Ultimate FR Edition by assistant)",
    countDown: 5,
    role: 0,
    description: "Quiz extrême 10 questions (40 questions/catégorie), chrono 30s, difficulté aléatoire, objectifs, niveaux, classement et boutique d'aides",
    category: "game",
    guide: {
      fr: "{pn} - Démarrer une partie de 10 questions (30s par question)\nAprès la catégorie, la difficulté est tirée au sort avec sa prime. Écrivez 'shop' pour les aides, 'top' pour le classement de niveau, 'fin' pour quitter.",
      en: "{pn} - Start a 10-question quiz game (30s per question)\nRandom difficulty after category selection, objectives, levels, leaderboard, shop, and 'fin' to quit."
    }
  },

  ST: async function({ message, event }) {
    const languageOptions = {
      "1": { name: "🇫🇷 Français", code: "french" },
      "2": { name: "🇬🇧 English", code: "english" },
      "3": { name: "🇧🇩 Bangla", code: "bangla" },
      "4": { name: "🔀 Banglish", code: "banglish" }
    };

    const optionText = Object.entries(languageOptions)
      .map(([num, lang]) => `${num}. ${lang.name}`)
      .join("\n");

    const stats = getOrCreatePlayerStats(event.senderID);

    const sent = await message.reply(
      `🎮 QUIZ ULTIME (10 Questions • 40/Catégorie • 30s/Q)\n🏅 Votre niveau : Niv.${stats.level} (${stats.xp} XP)\n━━━━━━━━━━━━━━━━━━━━━━\n\n${optionText}\n\n━━━━━━━━━━━━━━━━━━━━━━\n💡 Numéro pour choisir • "top" = Classement • "fin" = Quitter`
    );

    global.GoatBot.onReply.set(sent.messageID, {
      commandName: module.exports.config.name,
      messageID: sent.messageID,
      author: event.senderID,
      type: "selectLanguage",
      languageOptions
    });
  },

  onReply: async function({ Reply, message, event, args, usersData, api }) {
    const { author, type, languageOptions, selectedLanguage, selectedCategory, categoryOptions, session, quizData, quizMessageID, hiddenLetters } = Reply;

    if (author !== event.senderID) return;

    const userInput = (args && args.length ? args.join(" ") : event.body || "").trim();
    const lower = userInput.toLowerCase();

    if (lower === "top") {
      return message.reply(buildLeaderboardText(api));
    }

    if (lower === "fin") {
      clearReplyTimer(Reply);
      if (Reply.parentReply) {
        clearReplyTimer(Reply.parentReply);
      }
      if (global.GoatBot && global.GoatBot.onReply) {
        global.GoatBot.onReply.delete(Reply.messageID);
        if (quizMessageID) {
          global.GoatBot.onReply.delete(quizMessageID);
        }
      }

      try {
        await message.unsend(Reply.messageID);
      } catch (_) {}

      const currentScore = session ? session.score : 0;
      const answeredCount = session ? session.currentIndex : 0;
      const earnedCoins = session ? session.totalCoinsEarned : 0;
      const catLabel = selectedCategory ? selectedCategory.name : "Non choisie";
      const diffLabel = session && session.selectedDifficulty ? session.selectedDifficulty.name : "Non tirée";

      return message.reply(
        `🛑 PARTIE INTERROMPUE ("fin")\n━━━━━━━━━━━━━━━━━━━━━━\n📌 Catégorie : ${catLabel}\n⚡ Difficulté : ${diffLabel}\n📊 Progression : ${answeredCount}/${TOTAL_QUESTIONS} questions\n⭐ Score : ${currentScore}/${answeredCount}\n💰 Coins déjà conservés : ${earnedCoins}\n━━━━━━━━━━━━━━━━━━━━━━\n💡 Relancez la commande quand vous voulez rejouer !`
      );
    }

    if (type === "selectLanguage") {
      try {
        await message.unsend(Reply.messageID);
      } catch (_) {}

      if (!languageOptions || !languageOptions[userInput]) {
        return message.reply("❌ Choix invalide. Entrez un numéro valide, \"top\" ou \"fin\".");
      }

      const language = languageOptions[userInput];
      const categoryText = Object.entries(CATEGORIES)
        .map(([num, cat]) => `${num}. ${cat.name} (${QUESTIONS_PER_SET * SETS_PER_CATEGORY} Q • x${cat.multiplier})`)
        .join("\n");

      const sent = await message.reply(
        `🎮 Quiz (${TOTAL_QUESTIONS} questions • ${QUESTION_TIMEOUT_SECONDS}s/Q) - Choix de la catégorie\n━━━━━━━━━━━━━━━━━━━━━━\n🌐 Langue : ${language.name}\n⚡ Difficulté : Tirée au hasard après votre choix !\n\n${categoryText}\n\n━━━━━━━━━━━━━━━━━━━━━━\n💡 Numéro de catégorie • "top" = Classement • "fin" = Quitter`
      );

      global.GoatBot.onReply.set(sent.messageID, {
        commandName: module.exports.config.name,
        messageID: sent.messageID,
        author: event.senderID,
        type: "selectCategory",
        selectedLanguage: language,
        categoryOptions: CATEGORIES
      });
    }
    else if (type === "selectCategory") {
      try {
        await message.unsend(Reply.messageID);
      } catch (_) {}

      const pool = categoryOptions || CATEGORIES;
      if (!pool[userInput]) {
        return message.reply("❌ Catégorie invalide. Entrez un numéro de 1 à 15, \"top\" ou \"fin\".");
      }

      const category = pool[userInput];
      const rolledDifficulty = pickRandomDifficulty();

      try {
        const prepared = await prepareSessionQuestions(selectedLanguage, category);
        const newSession = {
          selectedLanguage,
          selectedCategory: category,
          selectedDifficulty: rolledDifficulty,
          questionnaireTitle: prepared.questionnaireTitle,
          questions: prepared.questions,
          currentIndex: 0,
          score: 0,
          streak: 0,
          totalCoinsEarned: 0
        };
              
        await sendQuestionAtIndex({
          message,
          event,
          session: newSession,
          commandName: module.exports.config.name,
          hiddenLetters: [],
          usersData
        });
      } catch (err) {
        console.error("Quiz session start error:", err);
        return message.reply("❌ Impossible de charger le quiz pour le moment. Réessayez plus tard.");
      }
    }
    else if (type === "selectShopItem") {
      const parentSession = Reply.parentSession;
      const parentQuizData = Reply.parentQuizData;
      const parentHiddenLetters = Reply.parentHiddenLetters || [];

      if (!parentSession || !parentQuizData) {
        return message.reply("❌ Session de boutique expirée. Écrivez \"fin\" pour quitter.");
      }

      const item = SHOP_ITEMS[userInput];
      if (!item) {
        return message.reply("❌ Choix invalide dans la boutique. Répondez par 1 ou 2, ou écrivez \"fin\".");
      }

      let balance = 0;
      try {
        const uData = await usersData.get(event.senderID);
        balance = uData && typeof uData.money === "number" ? uData.money : 0;
      } catch (_) {}

      if (balance < item.price) {
        return message.reply(`❌ Solde insuffisant (${balance} coins). Il vous faut ${item.price} coins pour ${item.name}.`);
      }

      try {
        await usersData.addMoney(event.senderID, -item.price);
      } catch (err) {
        console.error("Shop purchase error:", err);
        return message.reply("❌ Impossible d'effectuer l'achat pour le moment.");
      }

      clearReplyTimer(Reply);
      if (Reply.parentReply) {
        clearReplyTimer(Reply.parentReply);
        Reply.parentReply.answered = true;
      }

      try {
        await message.unsend(Reply.messageID);
      } catch (_) {}

      if (item.id === "fifty_fifty") {
        const correctLetter = resolveCorrectLetter(parentQuizData);
        const wrongLetters = ["A", "B", "C", "D"].filter(l => l !== correctLetter && !parentHiddenLetters.includes(l));
        const toHide = shuffleArray(wrongLetters).slice(0, 2);
        const newHidden = Array.from(new Set([...parentHiddenLetters, ...toHide]));

        await message.reply(`✂️ **${item.name}** acheté (-${item.price} coins) ! Deux mauvaises réponses ont été éliminées (${QUESTION_TIMEOUT_SECONDS}s).`);
        return sendQuestionAtIndex({
          message,
          event,
          session: parentSession,
          commandName: module.exports.config.name,
          hiddenLetters: newHidden,
          usersData
        });
      }

      if (item.id === "skip_question") {
        const activeDifficulty = parentSession.selectedDifficulty || DIFFICULTIES[1];
        const catMultiplier = parentSession.selectedCategory && parentSession.selectedCategory.multiplier ? parentSession.selectedCategory.multiplier : 1;
        const reward = calculateAnswerReward(catMultiplier * activeDifficulty.multiplier);
        const updatedScore = parentSession.score + 1;
        const updatedStreak = parentSession.streak + 1;
        const updatedCoins = parentSession.totalCoinsEarned + reward;

        try {
          await usersData.addMoney(event.senderID, reward);
        } catch (_) {}

        const stats = getOrCreatePlayerStats(event.senderID);
        stats.totalCorrect += 1;

        await message.reply(`⏭️ **${item.name}** utilisé (-${item.price} coins) ! Question validée (+${reward} coins).`);

        await advanceAfterQuestion({
          message,
          event,
          session: parentSession,
          updatedScore,
          updatedStreak,
          updatedCoins,
          commandName: module.exports.config.name,
          usersData
        });
      }
    }
    else if (type === "answerQuiz") {
      if (Reply.answered) return;

      if (lower === "shop") {
        clearReplyTimer(Reply);
        Reply.answered = true;

        const shopLines = Object.entries(SHOP_ITEMS)
          .map(([num, it]) => `${num}. ${it.name} — **${it.price} coins**\n   ${it.desc}`)
          .join("\n\n");

        const sentShop = await message.reply(
          `🛒 BOUTIQUE D'AIDES\n━━━━━━━━━━━━━━━━━━━━━━\n\n${shopLines}\n\n━━━━━━━━━━━━━━━━━━━━━━\n💡 Répondez par 1 ou 2 pour acheter • "fin" pour quitter`
        );

        global.GoatBot.onReply.set(sentShop.messageID, {
          commandName: module.exports.config.name,
          messageID: sentShop.messageID,
          author: event.senderID,
          type: "selectShopItem",
          parentReply: Reply,
          parentSession: session,
          parentQuizData: quizData,
          parentHiddenLetters: hiddenLetters || []
        });
        return;
      }

      const answer = userInput.toUpperCase();

      if (!["A", "B", "C", "D"].includes(answer)) {
        return message.reply(`❌ Répondez par A, B, C ou D (${QUESTION_TIMEOUT_SECONDS}s max) • "shop" = Aides • "top" = Classement • "fin" = Quitter.`);
      }

      clearReplyTimer(Reply);
      Reply.answered = true;
      if (global.GoatBot && global.GoatBot.onReply) {
        global.GoatBot.onReply.delete(Reply.messageID);
      }

      const activeDifficulty = session.selectedDifficulty || DIFFICULTIES[1];
      const correctLetter = resolveCorrectLetter(quizData);
      const isCorrect = answer === correctLetter;
      const catMultiplier = selectedCategory && selectedCategory.multiplier ? selectedCategory.multiplier : 1;
      const combinedMultiplier = catMultiplier * activeDifficulty.multiplier;

      let updatedScore = session.score;
      let updatedStreak = session.streak;
      let updatedCoins = session.totalCoinsEarned;
      let earnedThisTurn = 0;

      if (isCorrect) {
        updatedScore += 1;
        updatedStreak += 1;
        earnedThisTurn = calculateAnswerReward(combinedMultiplier);

        const stats = getOrCreatePlayerStats(event.senderID);
        stats.totalCorrect += 1;
        if (updatedStreak > stats.bestStreak) {
          stats.bestStreak = updatedStreak;
        }

        try {
          const userData = await usersData.addMoney(event.senderID, earnedThisTurn);
          if (!userData) {
            throw new Error("Failed to update user balance");
          }
          updatedCoins += earnedThisTurn;

          try {
            await api.editMessage(
              `✅ Bonne réponse ! (${session.currentIndex + 1}/${TOTAL_QUESTIONS})\n\n━━━━━━━━━━━━━━━━━━━━━━\n💰 +${earnedThisTurn} coins gagnés ! (${activeDifficulty.name})\n🔥 Série : ${updatedStreak} | ⭐ Score : ${updatedScore}/${session.currentIndex + 1}\n━━━━━━━━━━━━━━━━━━━━━━\n\n⏳ Question suivante...`,
              quizMessageID
            );
          } catch (_) {}
        } catch (err) {
          console.error("Quiz reward error:", err);
          return message.reply("❌ Erreur lors de l'ajout des coins. Réessayez plus tard.");
        }
      } else {
        updatedStreak = 0;
        const correctText = quizData.options && quizData.options[correctLetter]
          ? `${correctLetter}. ${quizData.options[correctLetter]}`
          : correctLetter;

        try {
          await api.editMessage(
            `❌ Mauvaise réponse ! (${session.currentIndex + 1}/${TOTAL_QUESTIONS})\n\n━━━━━━━━━━━━━━━━━━━━━━\nBonne réponse : ${correctText}\n⭐ Score actuel : ${updatedScore}/${session.currentIndex + 1}\n━━━━━━━━━━━━━━━━━━━━━━\n\n⏳ Question suivante...`,
            quizMessageID
          );
        } catch (_) {}
      }

      await advanceAfterQuestion({
        message,
        event,
        session,
        updatedScore,
        updatedStreak,
        updatedCoins,
        commandName: module.exports.config.name,
        usersData
      });
    }
  }
};
          
