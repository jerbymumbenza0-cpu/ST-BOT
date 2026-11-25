"use strict";

// ═══════════════════════════════════════════════════════════════════════════════
//  GIVE QUANTUM v4.0 — Transmission de fonds style "signal quantique"
//  Auteur   : Christus
//  Concept  : Layout VERTICAL — deux stations (envoyeur haut / receveur bas)
//             reliées par un tube de données central avec particules d energie.
//             Le montant est affiché dans un "noyau" central lumineux.
//             Completement different de Give Sovereign (qui etait horizontal)
//  Canvas   : 820 × 1100 px (format portrait, like une carte)
//  Symboles : zéro emoji — uniquement caracteres speciaux
//  20 themes exclusifs
// ═══════════════════════════════════════════════════════════════════════════════

const fs     = require("fs-extra");
const path   = require("path");
const axios  = require("axios");
const moment = require("moment-timezone");

let loadImage, createCanvas, registerFont;
let canvasAvailable = false;
try {
  const cv = require("canvas");
  loadImage    = cv.loadImage;
  createCanvas = cv.createCanvas;
  registerFont = cv.registerFont;
  canvasAvailable = true;
} catch (e) { console.error("Canvas indisponible :", e.message); }

// ─── Polices ──────────────────────────────────────────────────────────────────
let fontsLoaded = false;
function ensureFonts() {
  if (fontsLoaded || !canvasAvailable || !registerFont) return;
  fontsLoaded = true;
  try {
    const fd = path.join(__dirname, "assets", "font");
    if (!fs.existsSync(fd)) return;
    const ff = [
      ["JetBrainsMono-Bold.ttf",    "QF", "bold"],
      ["JetBrainsMono-Regular.ttf", "QF", "normal"],
      ["BeVietnamPro-Bold.ttf",     "QF", "bold"],
      ["BeVietnamPro-Regular.ttf",  "QF", "normal"],
      ["NotoSans-Bold.ttf",         "QF", "bold"],
      ["NotoSans-Regular.ttf",      "QF", "normal"],
    ];
    for (const [f, fam, w] of ff) {
      try {
        const fp = path.join(fd, f);
        if (fs.existsSync(fp)) registerFont(fp, { family: fam, weight: w });
      } catch (_) {}
    }
  } catch (_) {}
}

const FB_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

// ─── Utilitaires ──────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null || isNaN(n)) return "$0";
  n = Number(n);
  if (!isFinite(n)) return "$MAX";
  const S = [{v:1e18,s:"Qi"},{v:1e15,s:"Qa"},{v:1e12,s:"T"},{v:1e9,s:"B"},{v:1e6,s:"M"},{v:1e3,s:"K"}];
  const sc = S.find(s => Math.abs(n) >= s.v);
  if (sc) return `${n<0?"-":""}$${(Math.abs(n)/sc.v).toFixed(2).replace(/\.00$/,"")}${sc.s}`;
  const p = Math.abs(n).toFixed(2).split(".");
  p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${n<0?"-":""}$${p.join(".")}`;
}

const SUFFIXES = { k:1e3, m:1e6, b:1e9, t:1e12, q:1e15 };
function parseAmount(input) {
  if (!input || typeof input !== "string") return NaN;
  const m = input.trim().toLowerCase().match(/^([\d,.]+)\s*([kmbtq]?)$/i);
  if (!m) return NaN;
  let v = parseFloat(m[1].replace(/,/g, "."));
  if (m[2] && SUFFIXES[m[2]]) v *= SUFFIXES[m[2]];
  return isNaN(v) ? NaN : Math.floor(v);
}

const TIERS = [
  { name:"Starter", min:0,       max:999,      color:"#CD7F32", sym:"[I]"  },
  { name:"Rookie",  min:1_000,   max:4_999,    color:"#C0C0C0", sym:"[II]" },
  { name:"Pro",     min:5_000,   max:19_999,   color:"#FFD700", sym:"[III]"},
  { name:"Elite",   min:20_000,  max:49_999,   color:"#E8E8FF", sym:"[IV]" },
  { name:"Master",  min:50_000,  max:99_999,   color:"#00FFFF", sym:"[V]"  },
  { name:"Legend",  min:100_000, max:499_999,  color:"#FF00FF", sym:"[VI]" },
  { name:"GOD",     min:500_000, max:Infinity,  color:"#FF2020", sym:"[VII]"},
];
function getTier(b) { return TIERS.find(t => (b||0)>=t.min && (b||0)<=t.max) || TIERS[0]; }

// ─── Seedé random ─────────────────────────────────────────────────────────────
function seededRng(seed) {
  let s = typeof seed === "string"
    ? [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 2147483647, 1)
    : Math.abs(seed) || 1;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  20 THEMES "QUANTUM TRANSMISSION"
//  Chaque theme a : fond unique, tube de donnees, noyau central, couleurs
// ═══════════════════════════════════════════════════════════════════════════════
const THEMES = {

  // ── GROUPE 1 : COSMOS ─────────────────────────────────────────────────────
  neutron_pulse: {
    name:"Neutron Pulse", sym:"//",
    bg1:"#04000E", bg2:"#080018",
    tube:"#5500FF", tubeGlow:"#8844FF",
    core:"#AA66FF", coreGlow:"#7733FF",
    particle:"#CCAAFF",
    primary:"#BB88FF", accent:"#FF99FF", gold:"#FFEEAA",
    text:"#F0EAFF", muted:"#8877AA",
    card1:"#0C0424", card2:"#140830",
    border:"#6622CC",
  },

  solar_wind: {
    name:"Solar Wind", sym:">>",
    bg1:"#0E0400", bg2:"#180800",
    tube:"#FF6600", tubeGlow:"#FF9900",
    core:"#FFD700", coreGlow:"#FF8800",
    particle:"#FFEEAA",
    primary:"#FF9900", accent:"#FFD700", gold:"#FFFFAA",
    text:"#FFF8E8", muted:"#AA8844",
    card1:"#200800", card2:"#2C1000",
    border:"#CC5500",
  },

  event_horizon: {
    name:"Event Horizon", sym:"**",
    bg1:"#000000", bg2:"#050508",
    tube:"#4444FF", tubeGlow:"#6666FF",
    core:"#FFFFFF", coreGlow:"#AAAAFF",
    particle:"#AAAAFF",
    primary:"#8888FF", accent:"#FFFFFF", gold:"#FFFF88",
    text:"#EEEEFF", muted:"#666699",
    card1:"#080810", card2:"#101018",
    border:"#3333BB",
  },

  quasar_jet: {
    name:"Quasar Jet", sym:"~~",
    bg1:"#000C0E", bg2:"#00181C",
    tube:"#00DDFF", tubeGlow:"#00FFFF",
    core:"#00FFFF", coreGlow:"#00BBFF",
    particle:"#AAFFFF",
    primary:"#00EEFF", accent:"#88FFFF", gold:"#FFFF88",
    text:"#E0FFFF", muted:"#337788",
    card1:"#001820", card2:"#002030",
    border:"#007799",
  },

  dark_matter: {
    name:"Dark Matter", sym:"##",
    bg1:"#000000", bg2:"#040406",
    tube:"#9900CC", tubeGlow:"#CC00FF",
    core:"#FF00FF", coreGlow:"#BB00CC",
    particle:"#FF88FF",
    primary:"#CC44FF", accent:"#FF88FF", gold:"#FFAAFF",
    text:"#F8EEFF", muted:"#7733AA",
    card1:"#100010", card2:"#180018",
    border:"#880099",
  },

  // ── GROUPE 2 : TECHNO ─────────────────────────────────────────────────────
  data_stream: {
    name:"Data Stream", sym:"01",
    bg1:"#000800", bg2:"#001200",
    tube:"#00AA33", tubeGlow:"#00FF44",
    core:"#00FF44", coreGlow:"#00CC33",
    particle:"#AAFFBB",
    primary:"#00EE44", accent:"#88FF99", gold:"#AAFF88",
    text:"#EEFFEE", muted:"#336644",
    card1:"#001400", card2:"#002000",
    border:"#006622",
  },

  circuit_burn: {
    name:"Circuit Burn", sym:"[]",
    bg1:"#100200", bg2:"#180400",
    tube:"#FF3300", tubeGlow:"#FF6600",
    core:"#FF9900", coreGlow:"#FF5500",
    particle:"#FFCCAA",
    primary:"#FF5500", accent:"#FF9900", gold:"#FFCC44",
    text:"#FFF0E8", muted:"#993322",
    card1:"#1C0400", card2:"#280600",
    border:"#AA2200",
  },

  neon_grid: {
    name:"Neon Grid", sym:"++",
    bg1:"#040010", bg2:"#080018",
    tube:"#0088FF", tubeGlow:"#00CCFF",
    core:"#00CCFF", coreGlow:"#0088FF",
    particle:"#AADDFF",
    primary:"#00AAFF", accent:"#00EEFF", gold:"#FFEE88",
    text:"#E8F8FF", muted:"#224488",
    card1:"#060020", card2:"#0A0030",
    border:"#0055BB",
  },

  cyber_gold: {
    name:"Cyber Gold", sym:"$$",
    bg1:"#0A0800", bg2:"#14100000",
    tube:"#CC9900", tubeGlow:"#FFD700",
    core:"#FFD700", coreGlow:"#FFAA00",
    particle:"#FFEEAA",
    primary:"#FFD700", accent:"#FFE880", gold:"#FFFFFF",
    text:"#FFFBE8", muted:"#887733",
    card1:"#181000", card2:"#241800",
    border:"#AA7700",
  },

  plasma_rift: {
    name:"Plasma Rift", sym:"~~",
    bg1:"#0E000E", bg2:"#180014",
    tube:"#FF00AA", tubeGlow:"#FF44CC",
    core:"#FF66DD", coreGlow:"#CC0088",
    particle:"#FFBBEE",
    primary:"#FF44BB", accent:"#FF88DD", gold:"#FFDDFF",
    text:"#FFF0FF", muted:"#993388",
    card1:"#1A001A", card2:"#240024",
    border:"#BB0088",
  },

  // ── GROUPE 3 : NATURE / ELEMENTS ──────────────────────────────────────────
  aurora_transfer: {
    name:"Aurora Transfer", sym:"--",
    bg1:"#000A06", bg2:"#001408",
    tube:"#00FF88", tubeGlow:"#00FFCC",
    core:"#00FFCC", coreGlow:"#00CC88",
    particle:"#AAFFDD",
    primary:"#00FF99", accent:"#00FFDD", gold:"#AAFFEE",
    text:"#E8FFF8", muted:"#226644",
    card1:"#001C10", card2:"#002818",
    border:"#008855",
  },

  lava_flow: {
    name:"Lava Flow", sym:"^^",
    bg1:"#120200", bg2:"#1C0300",
    tube:"#FF2200", tubeGlow:"#FF5500",
    core:"#FF8800", coreGlow:"#FF3300",
    particle:"#FFBBAA",
    primary:"#FF4400", accent:"#FF8800", gold:"#FFCC44",
    text:"#FFF4F0", muted:"#883322",
    card1:"#200300", card2:"#2C0400",
    border:"#991100",
  },

  ice_crystal: {
    name:"Ice Crystal", sym:"::",
    bg1:"#000812", bg2:"#001020",
    tube:"#66CCFF", tubeGlow:"#99EEFF",
    core:"#CCFFFF", coreGlow:"#88CCFF",
    particle:"#DDEEFF",
    primary:"#88DDFF", accent:"#BBFFFF", gold:"#DDEEFF",
    text:"#F0FAFF", muted:"#446688",
    card1:"#001828", card2:"#002030",
    border:"#4499BB",
  },

  thunder_arc: {
    name:"Thunder Arc", sym:"!!",
    bg1:"#080808", bg2:"#0E0C00",
    tube:"#FFFF00", tubeGlow:"#FFEE00",
    core:"#FFFFFF", coreGlow:"#FFFF66",
    particle:"#FFFFAA",
    primary:"#FFEE00", accent:"#FFFFFF", gold:"#FFFF88",
    text:"#FFFFF0", muted:"#888844",
    card1:"#141200", card2:"#1C1800",
    border:"#AAAA00",
  },

  void_rift: {
    name:"Void Rift", sym:"<>",
    bg1:"#000000", bg2:"#030306",
    tube:"#4400FF", tubeGlow:"#7733FF",
    core:"#AA44FF", coreGlow:"#6600CC",
    particle:"#CC99FF",
    primary:"#8833FF", accent:"#BB77FF", gold:"#DDAAFF",
    text:"#F0EAFF", muted:"#553388",
    card1:"#060010", card2:"#0A0018",
    border:"#440099",
  },

  // ── GROUPE 4 : RETRO / LO-FI ──────────────────────────────────────────────
  retro_transfer: {
    name:"Retro Transfer", sym:">>",
    bg1:"#0A0018", bg2:"#140022",
    tube:"#FF71CE", tubeGlow:"#FF99DD",
    core:"#FF71CE", coreGlow:"#CC44AA",
    particle:"#FFCCEE",
    primary:"#FF71CE", accent:"#FFBBDD", gold:"#B967FF",
    text:"#FFE8F8", muted:"#994477",
    card1:"#18002E", card2:"#220038",
    border:"#AA3388",
  },

  outrun_send: {
    name:"Outrun Send", sym:"//",
    bg1:"#080010", bg2:"#100018",
    tube:"#FF3864", tubeGlow:"#FF6688",
    core:"#2DE2E6", coreGlow:"#00BBCC",
    particle:"#AAFFFF",
    primary:"#FF3864", accent:"#2DE2E6", gold:"#FFE74C",
    text:"#FFF0F8", muted:"#883355",
    card1:"#14001C", card2:"#1C0028",
    border:"#CC2255",
  },

  synthwave_tx: {
    name:"Synthwave TX", sym:"~~",
    bg1:"#06000E", bg2:"#0C0018",
    tube:"#7209B7", tubeGlow:"#9B2FE8",
    core:"#F72585", coreGlow:"#CC1060",
    particle:"#FFAACC",
    primary:"#9B2FE8", accent:"#F72585", gold:"#4CC9F0",
    text:"#FFE0F4", muted:"#662277",
    card1:"#100018", card2:"#180022",
    border:"#5A0099",
  },

  lo_fi_send: {
    name:"Lo-Fi Send", sym:"--",
    bg1:"#060810", bg2:"#0C1020",
    tube:"#7B8CDE", tubeGlow:"#9DAAFF",
    core:"#A8C0FF", coreGlow:"#6677BB",
    particle:"#CCDDFF",
    primary:"#8899EE", accent:"#AABBFF", gold:"#FFDD99",
    text:"#E8ECFF", muted:"#5566AA",
    card1:"#0E1428", card2:"#141C34",
    border:"#445588",
  },

  cassette_gold: {
    name:"Cassette Gold", sym:"[]",
    bg1:"#080600", bg2:"#100C00",
    tube:"#C8960C", tubeGlow:"#FFD700",
    core:"#FFE066", coreGlow:"#CCAA00",
    particle:"#FFF4AA",
    primary:"#E8B800", accent:"#FFE066", gold:"#FFFFFF",
    text:"#FFFDE8", muted:"#887733",
    card1:"#141000", card2:"#1E1800",
    border:"#886600",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
//  PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════════
function rr(ctx, x, y, w, h, r) {
  if (typeof r === "number") r = [r,r,r,r];
  const [tl,tr,br,bl] = r;
  ctx.beginPath();
  ctx.moveTo(x+tl,y); ctx.lineTo(x+w-tr,y); ctx.quadraticCurveTo(x+w,y,x+w,y+tr);
  ctx.lineTo(x+w,y+h-br); ctx.quadraticCurveTo(x+w,y+h,x+w-br,y+h);
  ctx.lineTo(x+bl,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-bl);
  ctx.lineTo(x,y+tl); ctx.quadraticCurveTo(x,y,x+tl,y); ctx.closePath();
}

function T(ctx, s, x, y, sz, color, {align="left",weight="bold",glow=null,alpha=1,blur=14}={}) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.font = `${weight} ${sz}px QF, "JetBrains Mono", "Courier New", monospace`;
  ctx.textAlign = align; ctx.textBaseline = "middle";
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = blur; }
  ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
}

// ─── Fond "cosmos" : gradient + particules seedées + grille fine ──────────────
function drawQuantumBg(ctx, W, H, t, seed) {
  // Gradient de fond
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, t.bg1); g.addColorStop(0.5, t.bg2); g.addColorStop(1, t.bg1);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // Halo autour du tube (axe central vertical)
  const tubeX = W / 2;
  const tg = ctx.createRadialGradient(tubeX, H*0.5, 0, tubeX, H*0.5, W*0.5);
  tg.addColorStop(0, t.tube + "18"); tg.addColorStop(1, "transparent");
  ctx.fillStyle = tg; ctx.fillRect(0, 0, W, H);

  // Etoiles / particules de fond
  const rng = seededRng(seed + "_bg");
  ctx.save();
  for (let i = 0; i < 180; i++) {
    const sx = rng() * W, sy = rng() * H;
    const sr = rng() * 1.2 + 0.2;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${rng() * 0.35 + 0.05})`;
    ctx.fill();
  }
  ctx.restore();

  // Lignes horizontales très fines (grille quantique)
  ctx.save();
  ctx.strokeStyle = t.tube + "22"; ctx.lineWidth = 0.5;
  for (let y = 0; y < H; y += 48) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();
}

// ─── Station (bloc joueur) ─────────────────────────────────────────────────────
// role: "sender" (haut) ou "receiver" (bas)
async function drawStation(ctx, W, t, cx, y, avatarImg, name, newBalance, role, seed) {
  const CARD_W = W - 80;
  const CARD_H = 200;
  const CARD_X = (W - CARD_W) / 2;

  // Ombre portée
  ctx.save();
  ctx.shadowColor = t.tube + "88"; ctx.shadowBlur = 40; ctx.shadowOffsetY = role === "sender" ? 8 : -8;
  ctx.fillStyle = t.card1;
  rr(ctx, CARD_X, y, CARD_W, CARD_H, 18); ctx.fill();
  ctx.restore();

  // Fond dégradé de la carte
  const cg = ctx.createLinearGradient(CARD_X, y, CARD_X + CARD_W, y + CARD_H);
  cg.addColorStop(0, t.card1); cg.addColorStop(1, t.card2);
  ctx.fillStyle = cg; rr(ctx, CARD_X, y, CARD_W, CARD_H, 18); ctx.fill();

  // Bordure lumineuse
  ctx.save();
  ctx.strokeStyle = t.border; ctx.lineWidth = 1.8;
  ctx.shadowColor = t.tube; ctx.shadowBlur = 12;
  rr(ctx, CARD_X, y, CARD_W, CARD_H, 18); ctx.stroke();
  ctx.restore();

  // Bordure accent intérieure
  ctx.save();
  ctx.strokeStyle = t.primary + "40"; ctx.lineWidth = 1;
  rr(ctx, CARD_X + 5, y + 5, CARD_W - 10, CARD_H - 10, 14); ctx.stroke();
  ctx.restore();

  // Coins décoratifs (L-shapes)
  const corners = [
    [CARD_X + 16, y + 16, 1, 1],
    [CARD_X + CARD_W - 16, y + 16, -1, 1],
    [CARD_X + 16, y + CARD_H - 16, 1, -1],
    [CARD_X + CARD_W - 16, y + CARD_H - 16, -1, -1],
  ];
  corners.forEach(([cx2, cy2, dx, dy]) => {
    ctx.save();
    ctx.strokeStyle = t.gold; ctx.lineWidth = 2.2;
    ctx.shadowColor = t.gold; ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(cx2, cy2 + dy * 22); ctx.lineTo(cx2, cy2); ctx.lineTo(cx2 + dx * 22, cy2);
    ctx.stroke(); ctx.restore();
  });

  // Label role
  const roleLabel = role === "sender" ? "EMETTEUR" : "RECEPTEUR";
  const roleSymbol = role === "sender" ? "[->>]" : "[>>-]";
  T(ctx, `${roleSymbol}  ${roleLabel}`, CARD_X + CARD_W/2, y + 22, 11, t.muted, { align:"center", weight:"700" });

  // Avatar circulaire (gauche de la carte)
  const AV_CX = CARD_X + 76;
  const AV_CY = y + CARD_H / 2 + 8;
  const AV_R  = 56;

  // Anneaux orbitaux autour de l avatar
  [0, 1].forEach(i => {
    ctx.save();
    ctx.strokeStyle = t.tube + ["80", "35"][i]; ctx.lineWidth = [1.8, 1][i];
    ctx.shadowColor = t.tubeGlow; ctx.shadowBlur = [10, 4][i];
    ctx.beginPath(); ctx.arc(AV_CX, AV_CY, AV_R + 8 + i * 10, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  });

  // Image avatar
  ctx.save();
  ctx.beginPath(); ctx.arc(AV_CX, AV_CY, AV_R, 0, Math.PI*2); ctx.clip();
  if (avatarImg) {
    ctx.drawImage(avatarImg, AV_CX - AV_R, AV_CY - AV_R, AV_R*2, AV_R*2);
  } else {
    const rng2 = seededRng(seed);
    ctx.fillStyle = `hsl(${Math.round(rng2()*360)},70%,35%)`;
    ctx.fillRect(AV_CX-AV_R, AV_CY-AV_R, AV_R*2, AV_R*2);
    T(ctx, (name||"?").charAt(0).toUpperCase(), AV_CX, AV_CY, 44, "#FFF", { align:"center" });
  }
  ctx.restore();

  // Contour avatar
  ctx.save();
  ctx.beginPath(); ctx.arc(AV_CX, AV_CY, AV_R, 0, Math.PI*2);
  ctx.strokeStyle = t.primary; ctx.lineWidth = 2.8;
  ctx.shadowColor = t.coreGlow; ctx.shadowBlur = 16; ctx.stroke();
  ctx.restore();

  // Zone texte droite
  const TX = AV_CX + AV_R + 28;
  const TW = CARD_X + CARD_W - TX - 20;

  // Nom
  ctx.save();
  ctx.font = `bold 22px QF, "JetBrains Mono", monospace`;
  let dispName = name || "Utilisateur";
  while (ctx.measureText(dispName).width > TW - 10 && dispName.length > 2) {
    dispName = dispName.slice(0, -1);
  }
  if (dispName !== (name || "Utilisateur")) dispName += "~";
  ctx.restore();
  T(ctx, dispName, TX, AV_CY - 32, 22, t.text, { weight:"800" });

  // Palier
  const tier = getTier(newBalance);
  T(ctx, `${tier.sym}  ${tier.name}`, TX, AV_CY - 6, 14, tier.color, { weight:"700", glow: tier.color, blur:8 });

  // Nouveau solde
  T(ctx, "SOLDE APRES :", TX, AV_CY + 20, 10, t.muted, { weight:"600" });
  T(ctx, fmt(newBalance), TX, AV_CY + 42, 20, t.primary, { weight:"900", glow: t.coreGlow, blur:10 });

  // Indicateur de connexion (LED) en haut à droite de la carte
  const LED_X = CARD_X + CARD_W - 30;
  const LED_Y = y + 22;
  ctx.save();
  ctx.fillStyle = t.primary; ctx.shadowColor = t.primary; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(LED_X, LED_Y, 5, 0, Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = "#FFF"; ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.arc(LED_X - 1, LED_Y - 1, 2, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

// ─── Tube de données central (axe vertical entre les deux stations) ───────────
function drawQuantumTube(ctx, W, tubeTop, tubeBot, t, seed) {
  const cx = W / 2;
  const TUBE_W = 52;

  // Fond du tube (canal semi-transparent)
  ctx.save();
  ctx.fillStyle = t.tube + "18";
  const tubeX = cx - TUBE_W / 2;
  const tubeH = tubeBot - tubeTop;
  ctx.fillRect(tubeX, tubeTop, TUBE_W, tubeH);
  ctx.restore();

  // Bordures du tube (deux lignes verticales lumineuses)
  [-1, 1].forEach(side => {
    const lineX = cx + side * (TUBE_W / 2);
    const lg = ctx.createLinearGradient(lineX, tubeTop, lineX, tubeBot);
    lg.addColorStop(0, "transparent");
    lg.addColorStop(0.2, t.tube + "AA");
    lg.addColorStop(0.5, t.tubeGlow + "DD");
    lg.addColorStop(0.8, t.tube + "AA");
    lg.addColorStop(1, "transparent");
    ctx.save();
    ctx.strokeStyle = lg; ctx.lineWidth = 1.8;
    ctx.shadowColor = t.tubeGlow; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(lineX, tubeTop); ctx.lineTo(lineX, tubeBot); ctx.stroke();
    ctx.restore();
  });

  // Particules de données qui "coulent" dans le tube (seedées, fixes)
  const rng = seededRng(seed + "_particles");
  const numParticles = 16;
  for (let i = 0; i < numParticles; i++) {
    const py = tubeTop + rng() * (tubeBot - tubeTop);
    const px = cx + (rng() - 0.5) * (TUBE_W * 0.7);
    const pr = rng() * 3 + 1.5;
    const alpha = rng() * 0.7 + 0.2;

    ctx.save();
    ctx.fillStyle = t.particle;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = t.tubeGlow; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI*2); ctx.fill();
    ctx.restore();

    //
