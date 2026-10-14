const LIBELLES_STATUT = {
  debloque: "Débloqué",
  "en-cours": "En cours",
};

// Échelle de la jauge : 5 repères chiffrés subdivisés chacun en 5, comme sur les visuels de référence.
const REPERES = 5;
const SUBDIVISIONS = 5;

// Étape 0 : accueil, étapes 1 à N : paliers, étape N + 1 : écran de fin.
const ETAPE_FIN = PALIERS.length + 1;

const scene = document.querySelector(".scene");
const nombre = new Intl.NumberFormat("fr-FR");

let etape = 0;
let enTransition = false;

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

function construireEcran(numeroEtape) {
  if (numeroEtape === 0) return cloner("modele-accueil");
  if (numeroEtape === ETAPE_FIN) return cloner("modele-fin");
  return construirePalier(PALIERS[numeroEtape - 1]);
}

function construirePalier(palier) {
  const ecran = cloner("modele-palier");

  const statut = champ(ecran, "statut");
  statut.textContent = LIBELLES_STATUT[palier.statut];
  statut.dataset.statut = palier.statut;
  champ(ecran, "numero").textContent = String(palier.numero).padStart(2, "0");
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

// Les boucles lumineuses d'arrière-plan sont infinies : on ne les attend pas.
function animationsTerminees(cible, options) {
  const animations = cible
    .getAnimations(options)
    .filter((animation) => animation.effect.getComputedTiming().endTime !== Infinity);
  return Promise.allSettled(animations.map((animation) => animation.finished));
}

async function afficher(nouvelleEtape) {
  if (enTransition || nouvelleEtape < 0 || nouvelleEtape > ETAPE_FIN) return;
  enTransition = true;
  try {
    scene.classList.add("sortie");
    await animationsTerminees(scene);
    etape = nouvelleEtape;
    scene.classList.remove("sortie");
    scene.replaceChildren(construireEcran(etape));
    await animationsTerminees(scene, { subtree: true });
  } finally {
    enTransition = false;
  }
}

// Le redémarrage demande deux appuis sur R pour éviter une remise à zéro accidentelle pendant la soirée.
function demanderRedemarrage() {
  const fin = scene.querySelector(".fin");
  if (fin.hasAttribute("data-confirmation")) afficher(0);
  else fin.setAttribute("data-confirmation", "");
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
  if (touche !== "r") scene.querySelector(".fin")?.removeAttribute("data-confirmation");

  if ((touche === " " || touche === "arrowright") && etape < ETAPE_FIN) {
    evenement.preventDefault();
    afficher(etape + 1);
  } else if (touche === "arrowleft" && etape > 0) {
    evenement.preventDefault();
    afficher(etape - 1);
  } else if (touche === "f") {
    basculerPleinEcran();
  } else if (touche === "r" && etape === ETAPE_FIN) {
    demanderRedemarrage();
  }
});

// Précharge les images pour qu'elles soient prêtes au moment de leur entrée en scène.
for (const palier of PALIERS) new Image().src = palier.image;

scene.replaceChildren(construireEcran(etape));
