// Étape 0 : accueil, étapes 1 à N : paliers, étape N + 1 : écran de fin (même numérotation que app.js).
const ETAPE_FIN = PALIERS.length + 1;

// Nom de la fenêtre de projection : il permet de la retrouver sans la recharger.
const NOM_ECRAN = "tombola-projection";

// Les tickets saisis et la scène en direct sont sauvegardés dans le navigateur : un rechargement
// accidentel de la régie ne fait rien perdre et ne change pas ce qui est projeté.
const CLE_SAUVEGARDE = "tombola-playground-regie";

// Scènes, dans l'ordre de la soirée. Chaque palier en a deux : la présentation du lot, puis le même
// écran avec le ticket gagnant, tiré au sort sur papier et saisi dans la régie.
const SCENES = [
  { nom: "Accueil", etape: 0, avecGagnant: false },
  ...PALIERS.flatMap((palier, indice) => [
    { nom: `Palier ${numeroPalier(palier)} · lot`, etape: indice + 1, avecGagnant: false },
    { nom: `Palier ${numeroPalier(palier)} · gagnant`, etape: indice + 1, avecGagnant: true },
  ]),
  { nom: "Fin · palmarès", etape: ETAPE_FIN, avecGagnant: false },
];

const cadreApercu = champ(document, "cadre-apercu");
const cadreDirect = champ(document, "cadre-direct");
const etatEcran = champ(document, "etat-ecran");

// gagnants[i] : ticket gagnant saisi pour PALIERS[i], null tant que son lot n'est pas tiré.
let gagnants = PALIERS.map(() => null);
// Indice dans SCENES de la scène affichée dans l'aperçu.
let apercu = 0;
// Ce qui est projeté : la scène et l'affichage tel qu'il a été envoyé. Comme dans OBS, corriger
// un ticket ne change l'écran qu'au prochain passage en direct.
let direct = { scene: 0, affichage: affichageDe(SCENES[0]) };
// Fenêtre de projection, null tant qu'elle n'est pas ouverte.
let ecran = null;

/* Scènes */

function numeroPalier(palier) {
  return String(palier.numero).padStart(2, "0");
}

function indiceScene(etape, avecGagnant) {
  return SCENES.findIndex((scene) => scene.etape === etape && scene.avecGagnant === avecGagnant);
}

// Affichage envoyé aux écrans pour une scène, au format décrit dans app.js.
function affichageDe({ etape, avecGagnant }) {
  return {
    etape,
    gagnant: avecGagnant ? gagnants[etape - 1] : null,
    palmares: etape === ETAPE_FIN ? [...gagnants] : [],
  };
}

function memeAffichage(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// La scène du gagnant n'est disponible qu'une fois son ticket saisi.
function disponible({ etape, avecGagnant }) {
  return !avecGagnant || gagnants[etape - 1] !== null;
}

function infoScene({ etape, avecGagnant }) {
  if (etape === 0 || etape === ETAPE_FIN) return "";
  if (!avecGagnant) return PALIERS[etape - 1].nom;
  const ticket = gagnants[etape - 1];
  return ticket === null ? "ticket à saisir" : `ticket n° ${ticket}`;
}

function legende(scene, affichage) {
  return affichage.gagnant === null ? scene.nom : `${scene.nom} · ticket n° ${affichage.gagnant}`;
}

/* Écrans

   Les moniteurs Aperçu et Direct et la fenêtre de projection affichent index.html. La régie leur
   envoie l'affichage par postMessage (voir app.js). L'origine cible est "*" : ouvertes depuis
   le disque (file://), les pages n'ont pas d'origine commune à désigner. */

function envoyer(fenetre, affichage) {
  fenetre?.postMessage(affichage, "*");
}

function envoyerApercu() {
  envoyer(cadreApercu.contentWindow, affichageDe(SCENES[apercu]));
}

function envoyerDirect() {
  envoyer(cadreDirect.contentWindow, direct.affichage);
  envoyer(ecran, direct.affichage);
}

function choisirApercu(indice) {
  apercu = indice;
  envoyerApercu();
  actualiser();
}

function passerEnDirect() {
  direct = { scene: apercu, affichage: affichageDe(SCENES[apercu]) };
  sauvegarder();
  envoyerDirect();
  actualiser();
}

function connecterEcran(fenetre) {
  ecran = fenetre;
  etatEcran.textContent = ecran ? "Écran de projection ouvert" : "Écran de projection fermé";
  etatEcran.dataset.etat = ecran ? "ouvert" : "ferme";
}

function ouvrirEcran() {
  // Sans adresse, window.open retrouve la fenêtre de projection déjà ouverte sans la recharger :
  // elle reste en plein écran, par exemple après un rechargement de la régie.
  const fenetre = window.open("", NOM_ECRAN, "popup");
  if (!fenetre) {
    etatEcran.textContent = "Fenêtre bloquée : autoriser les pop-ups pour cette page";
    return;
  }
  if (fenetreVierge(fenetre)) {
    // La page se signale à son chargement (message "pret").
    fenetre.location.href = new URL("index.html", location.href).href;
  } else {
    connecterEcran(fenetre);
    envoyer(fenetre, direct.affichage);
  }
}

// Une fenêtre qui vient d'être créée est vierge et lisible par la régie. Une fenêtre de projection
// déjà chargée ne l'est pas toujours (pages ouvertes depuis le disque) : une erreur d'accès signale donc une page déjà là.
function fenetreVierge(fenetre) {
  try {
    return fenetre.location.href === "about:blank";
  } catch {
    return false;
  }
}

addEventListener("message", ({ source, data }) => {
  if (data === "pret") {
    if (source === cadreApercu.contentWindow) {
      envoyerApercu();
      return;
    }
    // Toute autre page qui se signale montre le direct : le moniteur Direct ou la fenêtre de projection.
    if (source !== cadreDirect.contentWindow) connecterEcran(source);
    envoyer(source, direct.affichage);
  } else if (data === "ferme" && source === ecran) {
    connecterEcran(null);
  }
});

/* Tickets gagnants */

// Un champ vide ou invalide retire le ticket du palier. Renvoie true si un ticket est enregistré.
function enregistrerTicket(indice, saisie, erreur) {
  const texte = saisie.value.trim();
  const ticket = /^\d+$/.test(texte) && Number(texte) >= 1 ? Number(texte) : null;
  const dejaGagnant = gagnants.findIndex((autre, autreIndice) => autreIndice !== indice && autre === ticket);

  let message = "";
  if (texte !== "" && ticket === null) {
    message = "Saisir un numéro de ticket : nombre entier à partir de 1.";
  } else if (ticket !== null && dejaGagnant !== -1) {
    // Un ticket ne gagne qu'une fois : le même numéro sur deux paliers est forcément une erreur de saisie.
    message = `Le ticket n° ${ticket} a déjà gagné le palier ${numeroPalier(PALIERS[dejaGagnant])}.`;
  }
  erreur.textContent = message;
  saisie.setAttribute("aria-invalid", message !== "");
  gagnants[indice] = message ? null : ticket;
  sauvegarder();

  // Sans ticket, la scène du gagnant n'est plus disponible : l'aperçu revient sur le lot.
  if (!disponible(SCENES[apercu])) apercu = indiceScene(indice + 1, false);
  envoyerApercu();
  actualiser();
  return gagnants[indice] !== null;
}

function sauvegarder() {
  try {
    localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify({ gagnants, direct }));
  } catch (erreur) {
    console.warn("Sauvegarde de la régie impossible :", erreur);
  }
}

function restaurer() {
  try {
    const sauvegarde = JSON.parse(localStorage.getItem(CLE_SAUVEGARDE));
    // Une sauvegarde faite avec une autre liste de paliers ne correspond plus aux scènes : elle est ignorée.
    if (sauvegarde?.gagnants.length === PALIERS.length) ({ gagnants, direct } = sauvegarde);
  } catch (erreur) {
    console.warn("Lecture de la sauvegarde de la régie impossible :", erreur);
  }
}

/* Interface */

function cloner(id) {
  return document.getElementById(id).content.firstElementChild.cloneNode(true);
}

function champ(racine, nom) {
  return racine.querySelector(`[data-champ="${nom}"]`);
}

function boutonScene(indice) {
  const bouton = cloner("modele-scene");
  bouton.dataset.scene = indice;
  champ(bouton, "nom").textContent = SCENES[indice].nom;
  bouton.addEventListener("click", () => choisirApercu(indice));
  return bouton;
}

function ligneSimple(indice) {
  const ligne = document.createElement("li");
  ligne.append(boutonScene(indice));
  return ligne;
}

function lignePalier(indice) {
  const ligne = cloner("modele-palier");
  const formulaire = ligne.querySelector("form");
  const saisie = champ(ligne, "ticket");
  const erreur = champ(ligne, "erreur");

  formulaire.before(boutonScene(indiceScene(indice + 1, false)));
  formulaire.after(boutonScene(indiceScene(indice + 1, true)));
  saisie.value = gagnants[indice] ?? "";

  saisie.addEventListener("change", () => enregistrerTicket(indice, saisie, erreur));
  formulaire.addEventListener("submit", (evenement) => {
    evenement.preventDefault();
    if (enregistrerTicket(indice, saisie, erreur)) choisirApercu(indiceScene(indice + 1, true));
  });
  return ligne;
}

function actualiser() {
  for (const bouton of document.querySelectorAll("[data-scene]")) {
    const indice = Number(bouton.dataset.scene);
    bouton.disabled = !disponible(SCENES[indice]);
    bouton.setAttribute("aria-pressed", indice === apercu);
    champ(bouton, "info").textContent = infoScene(SCENES[indice]);
    champ(bouton, "direct").hidden = indice !== direct.scene;
  }
  const affichageApercu = affichageDe(SCENES[apercu]);
  champ(document, "legende-apercu").textContent = legende(SCENES[apercu], affichageApercu);
  champ(document, "legende-direct").textContent = legende(SCENES[direct.scene], direct.affichage);
  champ(document, "passer-direct").disabled = memeAffichage(affichageApercu, direct.affichage);
}

champ(document, "ouvrir-ecran").addEventListener("click", ouvrirEcran);
champ(document, "passer-direct").addEventListener("click", passerEnDirect);

restaurer();
champ(document, "scenes").append(
  ligneSimple(0),
  ...PALIERS.map((_, indice) => lignePalier(indice)),
  ligneSimple(SCENES.length - 1),
);
connecterEcran(null);
actualiser();

// Les moniteurs ne sont chargés qu'une fois la régie prête à répondre à leur message "pret".
cadreApercu.src = "index.html";
cadreDirect.src = "index.html";
