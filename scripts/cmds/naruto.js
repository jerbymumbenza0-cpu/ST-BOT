const fonts = require('../../func/font.js');
const numbers = require('../../func/number.js');

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

let loadImage, createCanvas, registerFont;
let canvasAvailable = false;
try {
	const cv = require("canvas");
	loadImage = cv.loadImage;
	createCanvas = cv.createCanvas;
	registerFont = cv.registerFont;
	canvasAvailable = true;
} catch (e) { console.error("Canvas unavailable:", e.message); }

let fontsLoaded = false;
function ensureFonts() {
	if (fontsLoaded || !canvasAvailable || !registerFont) return;
	fontsLoaded = true;
	try {
		const fd = path.join(__dirname, "assets", "font");
		if (!fs.existsSync(fd)) return;
		const fontFiles = [
			["BeVietnamPro-Bold.ttf", "SH", "bold"],
			["BeVietnamPro-Regular.ttf", "SH", "normal"],
			["BeVietnamPro-SemiBold.ttf", "SH", "600"],
			["NotoSans-Bold.ttf", "SH", "bold"],
			["NotoSans-Regular.ttf", "SH", "normal"]
		];
		for (const [f, fam, w] of fontFiles) {
			try {
				const fp = path.join(fd, f);
				if (fs.existsSync(fp)) registerFont(fp, { family: fam, weight: w });
			} catch (_) {}
		}
	} catch (_) {}
}

const FB_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

const SHINOBI_THEMES = {
	leaf_green: { name: "Konoha Leaf", primary: "#7FBF7F", secondary: "#25392A", bg1: "#070B08", bg2: "#101A13", text: "#EAF5EC", grid: "#7FBF7F" },
	sharingan_crimson: { name: "Sharingan Crimson", primary: "#C24B4B", secondary: "#3C1A1A", bg1: "#0A0505", bg2: "#170C0C", text: "#F6E4E4", grid: "#C24B4B" },
	akatsuki_cloud: { name: "Akatsuki Cloud", primary: "#B0473F", secondary: "#241618", bg1: "#080506", bg2: "#12090B", text: "#F0E2E2", grid: "#C97A46" },
	sage_amber: { name: "Sage Mode", primary: "#C99A4A", secondary: "#3E3018", bg1: "#0A0805", bg2: "#161006", text: "#F5ECDA", grid: "#C99A4A" },
	kurama_orange: { name: "Kurama Chakra", primary: "#D9832E", secondary: "#3E2410", bg1: "#0B0704", bg2: "#170F07", text: "#F7E9D8", grid: "#D9832E" },
	byakugan_lilac: { name: "Byakugan", primary: "#9E8FC2", secondary: "#2C273D", bg1: "#08070A", bg2: "#120F18", text: "#EDE9F5", grid: "#9E8FC2" },
	uchiha_ember: { name: "Uchiha Ember", primary: "#B85C3C", secondary: "#3A2216", bg1: "#0A0605", bg2: "#160D09", text: "#F3E4DA", grid: "#B85C3C" },
	ame_slate: { name: "Amegakure Rain", primary: "#6E8DAE", secondary: "#28323D", bg1: "#06090B", bg2: "#0E1620", text: "#E6EEF4", grid: "#6E8DAE" },
	sand_dune: { name: "Suna Desert", primary: "#D4A05A", secondary: "#3D2E15", bg1: "#0A0804", bg2: "#161006", text: "#F5EDD6", grid: "#D4A05A" },
	mist_haze: { name: "Kirigakure Mist", primary: "#7BA4B8", secondary: "#23323A", bg1: "#06090A", bg2: "#0E161A", text: "#E6F0F4", grid: "#7BA4B8" },
	cloud_lightning: { name: "Kumogakure Lightning", primary: "#D4B84A", secondary: "#3D3315", bg1: "#0A0804", bg2: "#161006", text: "#F5F0D6", grid: "#D4B84A" },
	sound_vibration: { name: "Otogakure Sound", primary: "#8B6EB0", secondary: "#2F2440", bg1: "#08060A", bg2: "#120F18", text: "#EDE6F5", grid: "#8B6EB0" },
	stone_earth: { name: "Iwagakure Stone", primary: "#A0885A", secondary: "#352D1A", bg1: "#080705", bg2: "#141007", text: "#F0EAD6", grid: "#A0885A" },
	water_mist: { name: "Kirigakure Water", primary: "#5A9CB8", secondary: "#1A2D35", bg1: "#050809", bg2: "#0C161A", text: "#E0EEF5", grid: "#5A9CB8" },
	lightning_bolt: { name: "Kumogakure Bolt", primary: "#C4B84A", secondary: "#353015", bg1: "#080704", bg2: "#121006", text: "#F0EDD6", grid: "#C4B84A" }
};

function rr(ctx, x, y, w, h, r) {
	if (typeof r === "number") r = [r, r, r, r];
	const [tl, tr, br, bl] = r;
	ctx.beginPath();
	ctx.moveTo(x + tl, y); ctx.lineTo(x + w - tr, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + tr); ctx.lineTo(x + w, y + h - br);
	ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h); ctx.lineTo(x + bl, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - bl); ctx.lineTo(x, y + tl);
	ctx.quadraticCurveTo(x, y, x + tl, y); ctx.closePath();
}

function T(ctx, s, x, y, sz, color, { align = "left", weight = "bold", glow = null, alpha = 1, letterSpacing = 0 } = {}) {
	ctx.save(); ctx.globalAlpha = alpha;
	ctx.font = `${weight} ${sz}px SH, Arial`;
	ctx.textAlign = letterSpacing ? "left" : align;
	ctx.textBaseline = "middle";
	if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 16; }
	ctx.fillStyle = color;
	if (letterSpacing) {
		let cx = x;
		if (align === "center") {
			const w = [...s].reduce((acc, ch) => acc + ctx.measureText(ch).width + letterSpacing, -letterSpacing);
			cx = x - w / 2;
		} else if (align === "right") {
			const w = [...s].reduce((acc, ch) => acc + ctx.measureText(ch).width + letterSpacing, -letterSpacing);
			cx = x - w;
		}
		for (const ch of s) {
			ctx.fillText(ch, cx, y);
			cx += ctx.measureText(ch).width + letterSpacing;
		}
	} else {
		ctx.fillText(s, x, y);
	}
	ctx.restore();
}

function GL(ctx, x1, y1, x2, y2, color, w = 1.2) {
	const g = ctx.createLinearGradient(x1, y1, x2, y2);
	g.addColorStop(0, "transparent"); g.addColorStop(0.5, color); g.addColorStop(1, "transparent");
	ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = w;
	ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}

function drawScrollBg(ctx, W, H, t) {
	const g = ctx.createLinearGradient(0, 0, 0, H);
	g.addColorStop(0, t.bg1); g.addColorStop(0.55, t.bg2); g.addColorStop(1, t.bg1);
	ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

	ctx.save();
	ctx.strokeStyle = t.grid; ctx.globalAlpha = 0.05; ctx.lineWidth = 1;
	for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
	for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
	ctx.restore();

	const corner = 26;
	ctx.save();
	ctx.strokeStyle = t.primary; ctx.lineWidth = 2; ctx.globalAlpha = 0.7;
	[[24, 24, 1, 1], [W - 24, 24, -1, 1], [24, H - 24, 1, -1], [W - 24, H - 24, -1, -1]].forEach(([x, y, dx, dy]) => {
		ctx.beginPath();
		ctx.moveTo(x, y + corner * dy);
		ctx.lineTo(x, y);
		ctx.lineTo(x + corner * dx, y);
		ctx.stroke();
	});
	ctx.restore();
}

function drawSquareAvatar(ctx, img, x, y, size, t) {
	ctx.save();
	rr(ctx, x, y, size, size, 10);
	ctx.clip();
	if (img) ctx.drawImage(img, x, y, size, size);
	else { ctx.fillStyle = t.secondary; ctx.fillRect(x, y, size, size); }
	ctx.restore();
	ctx.save();
	rr(ctx, x, y, size, size, 10);
	ctx.lineWidth = 2;
	ctx.strokeStyle = t.primary;
	ctx.stroke();
	ctx.restore();
}

function drawBar(ctx, x, y, w, h, ratio, colorBg, colorFg) {
	ctx.save();
	rr(ctx, x, y, w, h, h / 2);
	ctx.fillStyle = colorBg;
	ctx.fill();
	ctx.restore();
	const fillW = Math.max(h, w * Math.max(0, Math.min(1, ratio)));
	ctx.save();
	rr(ctx, x, y, fillW, h, h / 2);
	ctx.fillStyle = colorFg;
	ctx.fill();
	ctx.restore();
}

async function fetchAvatar(uid) {
	try {
		const res = await axios.get(
			`https://graph.facebook.com/${uid}/picture?width=400&height=400&access_token=${FB_TOKEN}`,
			{ responseType: "arraybuffer", timeout: 10000 }
		);
		return await loadImage(Buffer.from(res.data));
	} catch (_) { return null; }
}

function pickTheme() {
	const keys = Object.keys(SHINOBI_THEMES);
	return SHINOBI_THEMES[keys[Math.floor(Math.random() * keys.length)]];
}

async function renderAndAttach(message, text, canvasPromise, prefix) {
	if (!canvasAvailable) return message.reply(text);
	try {
		const canvas = await canvasPromise;
		const cacheDir = path.join(__dirname, "cache");
		if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);
		const outPath = path.join(cacheDir, `${prefix}_${Date.now()}.png`);
		fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
		await message.reply({ body: text, attachment: fs.createReadStream(outPath) });
		setTimeout(() => { try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (_) {} }, 30000);
	} catch (e) {
		console.error(`${prefix} canvas error:`, e);
		return message.reply(text);
	}
}

// ============================================================
// CHARACTER LINES — 92 personnages
// ============================================================
const CHARACTER_LINES = [
	// 1-12: Personnages principaux
	{
		id: 1, key: "naruto", clan: "🏮 Clan Uzumaki",
		emoji: "🦊",
		stages: [
			{ minLevel: 1, name: "Naruto Uzumaki (Genin)", power: 48, basic: "Rasengan", ultimate: "Rasengan Geant + Multi-Clonage" },
			{ minLevel: 15, name: "Naruto Uzumaki (Mode Sage)", power: 64, basic: "Rasengan Geant", ultimate: "Futon : Rasenshuriken" },
			{ minLevel: 30, name: "Naruto Uzumaki (Mode Kurama)", power: 82, basic: "Orbe de Verite", ultimate: "Bijuu Rasenshuriken" },
			{ minLevel: 50, name: "Naruto Uzumaki (Mode Baryon)", power: 102, basic: "Frappe Ultra Rapide", ultimate: "Explosion de Chakra Nucleaire" }
		]
	},
	{
		id: 2, key: "sasuke", clan: "⚡ Clan Uchiha",
		emoji: "⚡",
		stages: [
			{ minLevel: 1, name: "Sasuke Uchiha (Genin)", power: 50, basic: "Chidori", ultimate: "Kirin" },
			{ minLevel: 15, name: "Sasuke Uchiha (Sharingan Eveille)", power: 66, basic: "Chidori Nagashi", ultimate: "Susanoo Partiel" },
			{ minLevel: 30, name: "Sasuke Uchiha (Susanoo)", power: 84, basic: "Amaterasu", ultimate: "Susanoo Complet + Amaterasu" },
			{ minLevel: 50, name: "Sasuke Uchiha (Rinnegan)", power: 104, basic: "Fleche d'Indra", ultimate: "Amenotejikara + Susanoo Ultime" }
		]
	},
	{
		id: 3, key: "sakura", clan: "🌸 Ninja Medicin",
		emoji: "🌸",
		stages: [
			{ minLevel: 1, name: "Sakura Haruno (Genin)", power: 42, basic: "Coup Surpuissant", ultimate: "Sceau Byakugou Mineur" },
			{ minLevel: 15, name: "Sakura Haruno (Ninja Medicin)", power: 58, basic: "Poing Chakra Renforce", ultimate: "Liberation du Sceau" },
			{ minLevel: 30, name: "Sakura Haruno (Force Monstrueuse)", power: 76, basic: "Frappe Sismique", ultimate: "Cent Sceaux Liberes" },
			{ minLevel: 50, name: "Sakura Haruno (Byakugou Supreme)", power: 98, basic: "Frappe Regenerante", ultimate: "Creation de Vie Divine" }
		]
	},
	{
		id: 4, key: "kakashi", clan: "📖 Clan Hatake",
		emoji: "📖",
		stages: [
			{ minLevel: 1, name: "Kakashi Hatake (Jonin)", power: 50, basic: "Raikiri", ultimate: "Kamui Mineur" },
			{ minLevel: 15, name: "Kakashi Hatake (Sharingan Copieur)", power: 66, basic: "Kamui Raikiri", ultimate: "Kamui Integral" },
			{ minLevel: 30, name: "Kakashi Hatake (Susanoo Naissant)", power: 84, basic: "Susanoo Partiel", ultimate: "Kamui Shuriken" },
			{ minLevel: 50, name: "Kakashi Hatake (Susanoo Complet)", power: 104, basic: "Frappe Susanoo", ultimate: "Kamui Dimensionnel Total" }
		]
	},
	{
		id: 5, key: "gaara", clan: "🏜️ Clan du Kazekage",
		emoji: "🏜️",
		stages: [
			{ minLevel: 1, name: "Gaara du Desert (Genin)", power: 48, basic: "Sable Mouvant", ultimate: "Cercueil de Sable" },
			{ minLevel: 15, name: "Gaara du Desert (Maitre du Sable)", power: 64, basic: "Vague de Sable", ultimate: "Prison de Sable Absolue" },
			{ minLevel: 30, name: "Gaara du Desert (Armure de Sable)", power: 82, basic: "Armure Renforcee", ultimate: "Tempete de Sable Funeraire" },
			{ minLevel: 50, name: "Gaara du Desert (Kazekage Supreme)", power: 102, basic: "Golem de Sable", ultimate: "Deluge de Sable Dore" }
		]
	},
	{
		id: 6, key: "hinata", clan: "👁️ Clan Hyuga",
		emoji: "👁️",
		stages: [
			{ minLevel: 1, name: "Hinata Hyuga (Genin)", power: 40, basic: "Paume du Hakke", ultimate: "8 Trigrammes 16 Paumes" },
			{ minLevel: 15, name: "Hinata Hyuga (Byakugan Affute)", power: 56, basic: "Paume Celeste Tournoyante", ultimate: "64 Points du Hakke" },
			{ minLevel: 30, name: "Hinata Hyuga (Poing Doux Maitrise)", power: 74, basic: "Lion Tournoyant", ultimate: "128 Points du Hakke" },
			{ minLevel: 50, name: "Hinata Hyuga (Chef du Clan)", power: 96, basic: "Frappe du Destin", ultimate: "Trigrammes Infinis" }
		]
	},
	{
		id: 7, key: "rocklee", clan: "💪 Ninja Taijutsu",
		emoji: "💪",
		stages: [
			{ minLevel: 1, name: "Rock Lee (Genin)", power: 46, basic: "Lotus Initial", ultimate: "Lotus Primaire" },
			{ minLevel: 15, name: "Rock Lee (Portes Ouvertes)", power: 62, basic: "Lotus Avance", ultimate: "5eme Porte - Lotus Vivace" },
			{ minLevel: 30, name: "Rock Lee (7eme Porte)", power: 80, basic: "Frappe Explosive", ultimate: "7eme Porte - Lotus Ardent" },
			{ minLevel: 50, name: "Rock Lee (8eme Porte)", power: 100, basic: "Frappe Fatale", ultimate: "8eme Porte - Nuit de la Mort" }
		]
	},
	{
		id: 8, key: "itachi", clan: "🩸 Clan Uchiha (Anbu)",
		emoji: "🩸",
		stages: [
			{ minLevel: 1, name: "Itachi Uchiha (Anbu)", power: 52, basic: "Tsukuyomi Mineur", ultimate: "Amaterasu Ciblee" },
			{ minLevel: 15, name: "Itachi Uchiha (Sharingan Illusoire)", power: 68, basic: "Shuriken de l'Ombre", ultimate: "Amaterasu + Susanoo Partiel" },
			{ minLevel: 30, name: "Itachi Uchiha (Susanoo Eternel)", power: 86, basic: "Frappe Susanoo", ultimate: "Totsuka + Yata" },
			{ minLevel: 50, name: "Itachi Uchiha (Izanami Supreme)", power: 106, basic: "Illusion Absolue", ultimate: "Izanami Inevitable" }
		]
	},
	{
		id: 9, key: "jiraiya", clan: "🐸 Sannin Legendaire",
		emoji: "🐸",
		stages: [
			{ minLevel: 1, name: "Jiraiya (Sannin)", power: 54, basic: "Rasengan", ultimate: "Invocation de Gamabunta" },
			{ minLevel: 20, name: "Jiraiya (Mode Hermite)", power: 72, basic: "Senpo Rasengan", ultimate: "Senpo : Goemon" },
			{ minLevel: 40, name: "Jiraiya (Sage Supreme)", power: 90, basic: "Senpo Rasen Shuriken", ultimate: "Invocation Ultime" },
			{ minLevel: 55, name: "Jiraiya (L'Erudit Legendaire)", power: 108, basic: "Frappe du Sage", ultimate: "Scellage du Demiurge" }
		]
	},
	{
		id: 10, key: "madara", clan: "👺 Clan Uchiha (Rinnegan)",
		emoji: "👺",
		stages: [
			{ minLevel: 1, name: "Madara Uchiha (Eveille)", power: 56, basic: "Grande Boule de Feu", ultimate: "Susanoo Archaique" },
			{ minLevel: 25, name: "Madara Uchiha (Rinnegan)", power: 78, basic: "Limbo", ultimate: "Meteore d'Indra" },
			{ minLevel: 45, name: "Madara Uchiha (Jinchuriki)", power: 96, basic: "Orbe du Ten-Tails", ultimate: "Expansion Infinie" },
			{ minLevel: 60, name: "Madara Uchiha (Divin)", power: 120, basic: "Frappe de l'Infini", ultimate: "Fin du Monde" }
		]
	},
	{
		id: 11, key: "minato", clan: "🌀 Clan Namikaze",
		emoji: "🌀",
		stages: [
			{ minLevel: 1, name: "Minato Namikaze (Genin)", power: 46, basic: "Rasengan", ultimate: "Teleportation" },
			{ minLevel: 18, name: "Minato Namikaze (Hokage)", power: 68, basic: "Rasengan Geant", ultimate: "Teleportation du Ryu" },
			{ minLevel: 35, name: "Minato Namikaze (Mode Kyuubi)", power: 86, basic: "Rasengan Ultime", ultimate: "Explosion Teleportee" },
			{ minLevel: 52, name: "Minato Namikaze (Legendaire)", power: 106, basic: "Frappe du Fleau", ultimate: "Reincarnation Divine" }
		]
	},
	{
		id: 12, key: "pain", clan: "🕊️ Clan Nagato",
		emoji: "🕊️",
		stages: [
			{ minLevel: 1, name: "Pain (Chef de l'Akatsuki)", power: 54, basic: "Shinra Tensei", ultimate: "Chibaku Tensei" },
			{ minLevel: 22, name: "Pain (Corps Preta)", power: 74, basic: "Absorption de Chakra", ultimate: "Reanimation" },
			{ minLevel: 42, name: "Pain (Les Six Chemins)", power: 92, basic: "Almighty Push", ultimate: "Cataclysme Celeste" },
			{ minLevel: 58, name: "Pain (Nagato Supreme)", power: 112, basic: "Frappe de la Lune", ultimate: "Resurrection Universelle" }
		]
	},
	// 13-24: Personnages secondaires de Konoha
	{
		id: 13, key: "shikamaru", clan: "♟️ Clan Nara",
		emoji: "♟️",
		stages: [
			{ minLevel: 1, name: "Shikamaru Nara (Genin)", power: 38, basic: "Ombre Bougeante", ultimate: "Prison d'Ombre" },
			{ minLevel: 12, name: "Shikamaru Nara (Chunin)", power: 52, basic: "Etreinte d'Ombre", ultimate: "La Trahison d'Ombre" },
			{ minLevel: 28, name: "Shikamaru Nara (Jonin)", power: 70, basic: "Kage Mane", ultimate: "Paralysie d'Ombre" },
			{ minLevel: 45, name: "Shikamaru Nara (Strategiste Supreme)", power: 88, basic: "Ombre du Strategiste", ultimate: "Trappe d'Ombre Inevitable" }
		]
	},
	{
		id: 14, key: "ino", clan: "🌺 Clan Yamanaka",
		emoji: "🌺",
		stages: [
			{ minLevel: 1, name: "Ino Yamanaka (Genin)", power: 36, basic: "Transfert d'Esprit", ultimate: "Possession d'Esprit" },
			{ minLevel: 12, name: "Ino Yamanaka (Chunin)", power: 50, basic: "Lien d'Esprit", ultimate: "Transfert de Conscience" },
			{ minLevel: 28, name: "Ino Yamanaka (Jonin)", power: 68, basic: "Fleau d'Esprit", ultimate: "Controle Mental" },
			{ minLevel: 45, name: "Ino Yamanaka (Maitre des Esprits)", power: 86, basic: "Vague d'Esprit", ultimate: "Guerre Mentale" }
		]
	},
	{
		id: 15, key: "choji", clan: "🍬 Clan Akimichi",
		emoji: "🍬",
		stages: [
			{ minLevel: 1, name: "Choji Akimichi (Genin)", power: 40, basic: "Ballon Humain", ultimate: "Boule de Fer Humaine" },
			{ minLevel: 12, name: "Choji Akimichi (Chunin)", power: 54, basic: "Butterfly Choji", ultimate: "Guerrier Papillon" },
			{ minLevel: 28, name: "Choji Akimichi (Jonin)", power: 72, basic: "Frappe Colossale", ultimate: "Papillon de l'Enfer" },
			{ minLevel: 45, name: "Choji Akimichi (L'Ange de la Nourriture)", power: 90, basic: "Meteore Humain", ultimate: "Feu d'Artifice Final" }
		]
	},
	{
		id: 16, key: "neji", clan: "👁️ Clan Hyuga",
		emoji: "👁️",
		stages: [
			{ minLevel: 1, name: "Neji Hyuga (Genin)", power: 44, basic: "Paume du Hakke", ultimate: "64 Points du Hakke" },
			{ minLevel: 14, name: "Neji Hyuga (Chunin)", power: 58, basic: "Rotation", ultimate: "128 Points du Hakke" },
			{ minLevel: 30, name: "Neji Hyuga (Jonin)", power: 76, basic: "Paume Celeste", ultimate: "256 Points du Hakke" },
			{ minLevel: 48, name: "Neji Hyuga (Genie du Byakugan)", power: 94, basic: "Poing de la Destinee", ultimate: "Trigrammes du Destin" }
		]
	},
	{
		id: 17, key: "tenten", clan: "🗡️ Clan des Armes",
		emoji: "🗡️",
		stages: [
			{ minLevel: 1, name: "Tenten (Genin)", power: 38, basic: "Shuriken Torrent", ultimate: "Pluie d'Armes" },
			{ minLevel: 12, name: "Tenten (Chunin)", power: 52, basic: "Tempete d'Armes", ultimate: "Tornade de Lames" },
			{ minLevel: 28, name: "Tenten (Jonin)", power: 70, basic: "Bazooka d'Armes", ultimate: "Ouragan de Metaux" },
			{ minLevel: 45, name: "Tenten (Maitre des Armes)", power: 88, basic: "Deluge d'Acier", ultimate: "Cataclysme d'Armes" }
		]
	},
	{
		id: 18, key: "temari", clan: "🌪️ Clan du Vent",
		emoji: "🌪️",
		stages: [
			{ minLevel: 1, name: "Temari (Genin)", power: 42, basic: "Coup d'Eventail", ultimate: "Rafale de Vent" },
			{ minLevel: 14, name: "Temari (Chunin)", power: 56, basic: "Danse de l'Eventail", ultimate: "Tempete de Sable" },
			{ minLevel: 30, name: "Temari (Jonin)", power: 74, basic: "Tourbillon d'Eventail", ultimate: "Tornade de Vent" },
			{ minLevel: 48, name: "Temari (Deesse du Vent)", power: 92, basic: "Frappe du Vent Divin", ultimate: "Cataclysme Aeolien" }
		]
	},
	{
		id: 19, key: "kankuro", clan: "🎭 Clan des Marionnettistes",
		emoji: "🎭",
		stages: [
			{ minLevel: 1, name: "Kankuro (Genin)", power: 40, basic: "Marionnette Kuroari", ultimate: "Marionnette Sanshōuo" },
			{ minLevel: 14, name: "Kankuro (Chunin)", power: 54, basic: "Marionnette Karasu", ultimate: "Danse des Marionnettes" },
			{ minLevel: 30, name: "Kankuro (Jonin)", power: 72, basic: "Marionnette Sasori", ultimate: "Theatre des Marionnettes" },
			{ minLevel: 48, name: "Kankuro (Maitre Marionnettiste)", power: 90, basic: "Mille Marionnettes", ultimate: "Feu d'Artifice de Marionnettes" }
		]
	},
	{
		id: 20, key: "kiba", clan: "🐺 Clan Inuzuka",
		emoji: "🐺",
		stages: [
			{ minLevel: 1, name: "Kiba Inuzuka (Genin)", power: 40, basic: "Morsure de Akamaru", ultimate: "Transformation Humaine" },
			{ minLevel: 12, name: "Kiba Inuzuka (Chunin)", power: 54, basic: "Grifle de Akamaru", ultimate: "Double Transformation" },
			{ minLevel: 28, name: "Kiba Inuzuka (Jonin)", power: 72, basic: "Hurlement de la Meute", ultimate: "Tornade de la Meute" },
			{ minLevel: 45, name: "Kiba Inuzuka (Alpha)", power: 90, basic: "Frappe de la Meute", ultimate: "Assaut de la Meute" }
		]
	},
	{
		
