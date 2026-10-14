const LIBELLES_STATUT = {
  debloque: "Débloqué",
  "en-cours": "En cours",
};

// Échelle de la jauge : 5 repères chiffrés subdivisés chacun en 5, comme sur les visuels de référence.
const REPERES = 5;
const SUBDIVISIONS = 5;

// Suspense avant l'affichage du gagnant : les numéros défilent de plus en plus lentement,
// comme une roue de loterie qui s'arrête (environ 2 secondes au total, délais en millisecondes).
const DEFILEMENT_DEPART = 40;
const DEFILEMENT_FIN = 300;
const DEFILEMENT_RALENTISSEMENT = 1.12;

// Le tirage est sauvegardé dans le navigateur : un rechargement accidentel de la page
// ne relance pas les tirages et ne remet pas en jeu les tickets déjà gagnants.
const CLE_SAUVEGARDE = "tombola-playground";

// Étape 0 : accueil, étapes 1 à N : paliers, étape N + 1 : écran de fin.
const ETAPE_FIN = PALIERS.length + 1;

const scene = document.querySelector(".scene");
const nombre = new Intl.NumberFormat("fr-FR");
const liste = new Intl.ListFormat("fr-FR", { type: "conjunction" });
const mouvementReduit = matchMedia("(prefers-reduced-motion: reduce)");

let etape = 0;
let enTransition = false;
// Les tickets en jeu sont numérotés de 1 à dernierTicket.
let dernierTicket = null;
// gagnants[i] : ticket tiré pour PALIERS[i].
let gagnants = [];

/* Tirage au sort

   Le hasard vient de crypto.getRandomValues, le générateur cryptographique du navigateur :
   il est imprévisible et n'utilise pas de graine, contrairement à Math.random.
   Chaque tirage est uniforme : tous les tickets encore en jeu ont exactement la même chance.
   Les gagnants des paliers précédents sont retirés avant chaque tirage, un ticket ne peut
   donc gagner qu'une seule fois. Le tirage a lieu au moment de l'appui sur Espace. */

// Entier uniforme entre 0 et taille - 1. Les valeurs au-delà du plus grand multiple de
// `taille` sont rejetées : sans ce rejet, le modulo avantagerait légèrement les premiers indices.
function indiceAuHasard(taille) {
  const plafond = 2 ** 32 - (2 ** 32 % taille);
  const valeur = new Uint32Array(1);
  do {
    crypto.getRandomValues(valeur);
  } while (valeur[0] >= plafond);
  return valeur[0] % taille;
}

function ticketsEnJeu() {
  const enJeu = [];
  for (let ticket = 1; ticket <= dernierTicket; ticket++) {
    if (!gagnants.includes(ticket)) enJeu.push(ticket);
  }
  return enJeu;
}

async function tirerGagnant() {
  const indice = etape - 1;
  const enJeu = ticketsEnJeu();
  gagnants[indice] = enJeu[indiceAuHasard(enJeu.length)];
  sauvegarder();
  console.info(`Palier ${numeroPalier(PALIERS[indice])} : ticket ${gagnants[indice]} tiré parmi ${enJeu.length} tickets en jeu.`);

  const ecran = scene.firstElementChild;
  remplirGagnant(ecran, indice);
  ecran.classList.add("tirage");
  await defiler(champ(ecran, "gagnant"), enJeu);
  champ(ecran, "gagnant").textContent = gagnants[indice];
  ecran.classList.add("revele");
  await animationsTerminees(ecran, { subtree: true });
}

// Suspense purement visuel : le gagnant est déjà tiré et sauvegardé, les numéros qui défilent
// sont d'autres tickets en jeu affichés au hasard et n'influencent pas le résultat.
async function defiler(affichage, enJeu) {
  if (mouvementReduit.matches) return;
  for (let delai = DEFILEMENT_DEPART; delai < DEFILEMENT_FIN; delai *= DEFILEMENT_RALENTISSEMENT) {
    affichage.textContent = enJeu[indiceAuHasard(enJeu.length)];
    await new Promise((resoudre) => setTimeout(resoudre, delai));
  }
}

function sauvegarder() {
  try {
    localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify({ dernierTicket, gagnants }));
  } catch (erreur) {
    console.warn("Sauvegarde du tirage impossible :", erreur);
  }
}

function restaurer() {
  try {
    const sauvegarde = JSON.parse(localStorage.getItem(CLE_SAUVEGARDE));
    if (sauvegarde) ({ dernierTicket, gagnants } = sauvegarde);
  } catch (erreur) {
    console.warn("Lecture de la sauvegarde du tirage impossible :", erreur);
  }
}

/* Construction des écrans */

function cloner(id) {
  return document.getElementById(id).content.firstElementChild.cloneNode(true);
}

function champ(ecran, nom) {
  return ecran.querySelector(`[data-champ="${nom}"]`);
}

function element(balise, texte, classe = "") {
  const noeud = document.createElement(balise);
  noeud.textContent = texte;
  noeud.className = classe;
  return noeud;
}

function euros(valeur) {
  return `${nombre.format(valeur)}€`;
}

function numeroPalier(palier) {
  return String(palier.numero).padStart(2, "0");
}

function construireEcran(numeroEtape) {
  if (numeroEtape === 0) return construireAccueil();
  if (numeroEtape === ETAPE_FIN) return construireFin();
  return construirePalier(numeroEtape - 1);
}

function construireAccueil() {
  const ecran = cloner("modele-accueil");
  const saisie = champ(ecran, "dernier-ticket");
  saisie.value = dernierTicket ?? "";
  // La plage est figée dès le premier tirage pour que tous les paliers portent sur les mêmes tickets.
  saisie.disabled = gagnants.length > 0;
  ecran.dataset.etat = gagnants.length > 0 ? "en-cours" : dernierTicket ? "pret" : "saisie";

  ecran.querySelector("form").addEventListener("submit", (evenement) => {
    evenement.preventDefault();
    const valeur = Number(saisie.value);
    // Il faut au moins autant de tickets que de paliers pour qu'aucun ticket ne gagne deux fois.
    if (!Number.isInteger(valeur) || valeur < PALIERS.length) {
      champ(ecran, "erreur").textContent = `Entrer un nombre entier d'au moins ${PALIERS.length} : un ticket différent gagne à chaque palier.`;
      return;
    }
    champ(ecran, "erreur").textContent = "";
    dernierTicket = valeur;
    sauvegarder();
    saisie.blur();
    ecran.dataset.etat = "pret";
  });
  return ecran;
}

function construirePalier(indice) {
  const palier = PALIERS[indice];
  const ecran = cloner("modele-palier");

  const statut = champ(ecran, "statut");
  statut.textContent = LIBELLES_STATUT[palier.statut];
  statut.dataset.statut = palier.statut;
  champ(ecran, "numero").textContent = numeroPalier(palier);
  champ(ecran, "type").textContent = palier.type;
  champ(ecran, "nom").textContent = palier.nom;
  champ(ecran, "description").textContent = palier.description;

  // Une image absente ne doit pas casser l'écran : le halo et le cercle restent seuls.
  const image = champ(ecran, "image");
  image.addEventListener("error", () => {
    console.warn(`Image introuvable : ${palier.image}`);
    image.remove();
  });
  image.alt = palier.nom;
  image.src = palier.image;

  const pastille = champ(ecran, "pastille");
  const lignes = lignesPastille(palier);
  if (lignes) lignes.forEach((texte, index) => (pastille.children[index].textContent = texte));
  else pastille.remove();

  remplirProgression(ecran, palier);

  // Un palier déjà tiré réaffiche son gagnant : revenir en arrière ne relance jamais un tirage.
  champ(ecran, "gagnant-palier").textContent = numeroPalier(palier);
  if (gagnants[indice] !== undefined) {
    remplirGagnant(ecran, indice);
    ecran.classList.add("tirage", "revele");
  }
  return ecran;
}

function remplirGagnant(ecran, indice) {
  const dejaGagnants = gagnants.slice(0, indice).map((ticket) => `n° ${ticket}`);
  let detail = `Tiré au hasard parmi ${nombre.format(dernierTicket - indice)} tickets (1 à ${nombre.format(dernierTicket)})`;
  if (dejaGagnants.length) detail += ` · exclus car déjà gagnants : ${liste.format(dejaGagnants)}`;

  champ(ecran, "gagnant").textContent = gagnants[indice];
  champ(ecran, "gagnant-lot").textContent = PALIERS[indice].nom;
  champ(ecran, "gagnant-tirage").textContent = detail;
}

function construireFin() {
  const ecran = cloner("modele-fin");
  champ(ecran, "palmares").append(
    ...PALIERS.map((palier, indice) => {
      const ticket = element("li", "", "ticket");
      ticket.append(
        element("span", `Palier ${numeroPalier(palier)}`),
        element("strong", `n° ${gagnants[indice]}`),
        element("span", palier.nom),
      );
      return ticket;
    }),
  );
  return ecran;
}

function lignesPastille(palier) {
  if (palier.offertPar) return ["Offert par", palier.offertPar, ""];
  if (palier.statut === "debloque" && palier.progression) {
    return ["Objectif", euros(palier.progression.objectif), "atteint"];
  }
  return null;
}

function remplirProgression(ecran, palier) {
  const { statut, progression, offertPar, prochainObjectif } = palier;
  const valide = statut === "debloque";

  const titre = champ(ecran, "titre");
  const detail = champ(ecran, "detail");
  if (valide) {
    titre.textContent = "Validé";
    if (offertPar) detail.textContent = `Offert par ${offertPar}`;
    else if (progression) detail.textContent = `${euros(progression.collecte)} récoltés`;
  } else if (progression) {
    titre.replaceChildren(
      euros(progression.collecte),
      element("span", `/ ${euros(progression.objectif)}`, "progression-objectif"),
    );
    detail.textContent = "récoltés";
  } else {
    titre.textContent = LIBELLES_STATUT[statut];
  }
  if (!detail.textContent) detail.remove();

  // Sans montants connus, un palier en cours n'affiche pas de jauge : on n'invente pas de progression.
  let niveau = null;
  if (valide) niveau = 1;
  else if (progression) niveau = Math.min(progression.collecte / progression.objectif, 1);

  const jauge = ecran.querySelector(".jauge");
  if (niveau === null) {
    jauge.remove();
  } else {
    jauge.style.setProperty("--niveau", niveau);
    champ(ecran, "pourcentage").textContent = `${Math.round(niveau * 100)}%`;
    if (progression) champ(ecran, "echelle").append(...graduations(progression.objectif));
  }

  const suite = champ(ecran, "suite");
  const reste = progression ? progression.objectif - progression.collecte : 0;
  if (!valide && reste > 0) {
    suite.append("Encore ", element("strong", `${nombre.format(reste)} €`), " pour débloquer ");
    if (prochainObjectif) suite.append("le ", element("strong", prochainObjectif));
    else suite.append("ce lot");
  } else if (prochainObjectif) {
    suite.append("Prochain objectif : ", element("strong", prochainObjectif));
  } else {
    suite.remove();
  }
}

function graduations(objectif) {
  const total = REPERES * SUBDIVISIONS;
  return Array.from({ length: total + 1 }, (_, index) => {
    const graduation = document.createElement("li");
    graduation.style.setProperty("--position", index / total);
    if (index % SUBDIVISIONS === 0) {
      graduation.textContent = nombre.format(Math.round((objectif * index) / total));
    }
    return graduation;
  });
}

/* Navigation */

// Les boucles lumineuses d'arrière-plan sont infinies : on ne les attend pas.
function animationsTerminees(cible, options) {
  const animations = cible
    .getAnimations(options)
    .filter((animation) => animation.effect.getComputedTiming().endTime !== Infinity);
  return Promise.allSettled(animations.map((animation) => animation.finished));
}

// Les appuis reçus pendant une transition ou un tirage sont ignorés.
async function sansInterruption(action) {
  if (enTransition) return;
  enTransition = true;
  try {
    await action();
  } finally {
    enTransition = false;
  }
}

function afficherEcran() {
  scene.replaceChildren(construireEcran(etape));
  if (etape === 0 && dernierTicket === null) champ(scene, "dernier-ticket").focus();
}

async function afficher(nouvelleEtape) {
  scene.classList.add("sortie");
  await animationsTerminees(scene);
  etape = nouvelleEtape;
  scene.classList.remove("sortie");
  afficherEcran();
  await animationsTerminees(scene, { subtree: true });
}

function avancer() {
  if (etape === 0 && dernierTicket === null) {
    champ(scene, "dernier-ticket").focus();
    return;
  }
  const tirageAFaire = etape > 0 && gagnants[etape - 1] === undefined;
  sansInterruption(tirageAFaire ? tirerGagnant : () => afficher(etape + 1));
}

// Effacer les gagnants demande deux appuis sur R pour éviter une remise à zéro accidentelle pendant la soirée.
function demanderEffacement() {
  const ecran = scene.firstElementChild;
  if (!ecran.hasAttribute("data-confirmation")) {
    ecran.setAttribute("data-confirmation", "");
    return;
  }
  sansInterruption(() => {
    gagnants = [];
    sauvegarder();
    return afficher(0);
  });
}

function basculerPleinEcran() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen();
}

function saisieEnCours(cible) {
  return cible.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(cible.tagName);
}

document.addEventListener("keydown", (evenement) => {
  if (evenement.repeat || evenement.ctrlKey || evenement.metaKey || evenement.altKey) return;
  if (saisieEnCours(evenement.target)) return;

  const touche = evenement.key.toLowerCase();
  if (touche !== "r") scene.firstElementChild.removeAttribute("data-confirmation");

  if ((touche === " " || touche === "arrowright") && etape < ETAPE_FIN) {
    evenement.preventDefault();
    avancer();
  } else if (touche === "arrowleft" && etape > 0) {
    evenement.preventDefault();
    sansInterruption(() => afficher(etape - 1));
  } else if (touche === "f") {
    basculerPleinEcran();
  } else if (touche === "r" && (etape === ETAPE_FIN || (etape === 0 && gagnants.length > 0))) {
    demanderEffacement();
  }
});

// Précharge les images pour qu'elles soient prêtes au moment de leur entrée en scène.
for (const palier of PALIERS) new Image().src = palier.image;

restaurer();
afficherEcran();
