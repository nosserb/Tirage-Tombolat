const STATUTS = {
  debloque: { libelle: "Débloqué", typeLot: "Lot débloqué" },
  "en-cours": { libelle: "En cours", typeLot: "Lot à gagner" },
};

// Échelle de la jauge : 5 repères chiffrés subdivisés chacun en 5, comme sur les visuels de référence.
const REPERES = 5;
const SUBDIVISIONS = 5;

// Étape 0 : accueil, étapes 1 à N : paliers, étape N + 1 : écran de fin.
const ETAPE_FIN = PALIERS.length + 1;

const scene = document.querySelector(".scene");
const nombre = new Intl.NumberFormat("fr-FR");

// Cette page est pilotée par la régie (regie.html), qui l'ouvre dans une fenêtre (écran de projection)
// ou l'intègre dans un cadre (moniteurs Aperçu et Direct). Ouverte seule, elle reste sur l'accueil.
const regie = window.opener ?? (window.parent === window ? null : window.parent);

// Affichage demandé par la régie : { etape, gagnant, palmares }
//   etape     0 accueil, 1 à N palier, N + 1 fin
//   gagnant   ticket gagnant affiché sur le palier, null pour ne présenter que le lot
//   palmares  pour l'écran de fin : ticket gagnant de chaque palier, null si le lot n'a pas été tiré
let affichageCourant = null;
let affichageDemande = null;
let enTransition = false;
// Nombre de tickets vendus lu dans le Google Sheet, null tant qu'il n'est pas connu.
let ticketsVendus = null;

/* Montant récolté

   Le nombre de tickets vendus est lu dans le Google Sheet au chargement de la page et le montant
   récolté vaut ce nombre multiplié par PRIX_TICKET. Si la feuille est injoignable, aucun montant
   n'est affiché et les statuts de paliers.js s'appliquent tels quels. */

// La feuille est lue par une balise <script> (réponse JSONP de Google) plutôt que par fetch :
// Google refuse fetch depuis une page ouverte directement depuis le disque (file://).
function chargerTicketsVendus() {
  const { id, onglet, cellule } = GOOGLE_SHEET;
  const parametres = new URLSearchParams({
    tqx: "responseHandler:recevoirTicketsVendus",
    sheet: onglet,
    range: cellule,
    headers: 0,
  });
  const script = document.createElement("script");
  script.src = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?${parametres}`;
  script.addEventListener("error", () => console.warn("Google Sheet injoignable : les montants récoltés ne sont pas affichés."));
  document.head.append(script);
}

function recevoirTicketsVendus(reponse) {
  const valeur = reponse.table?.rows[0]?.c[0]?.v;
  if (!Number.isInteger(valeur) || valeur < 0) {
    console.warn("Nombre de tickets vendus illisible dans le Google Sheet :", reponse);
    return;
  }
  ticketsVendus = valeur;
  console.info(`Google Sheet : ${valeur} tickets vendus, soit ${montantRecolte()} € récoltés.`);
}

function montantRecolte() {
  return ticketsVendus === null ? null : ticketsVendus * PRIX_TICKET;
}

// Un palier avec objectif est débloqué dès que le montant récolté l'atteint.
// Sans objectif ou sans montant connu, le statut indiqué dans paliers.js s'applique.
function statutPalier(palier) {
  const collecte = montantRecolte();
  if (palier.objectif === undefined || collecte === null) return palier.statut;
  return collecte >= palier.objectif ? "debloque" : "en-cours";
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

function construireEcran({ etape, gagnant, palmares }) {
  if (etape === 0) return cloner("modele-accueil");
  if (etape === ETAPE_FIN) return construireFin(palmares);
  return construirePalier(etape - 1, gagnant);
}

function construirePalier(indice, gagnant) {
  const palier = PALIERS[indice];
  const ecran = cloner("modele-palier");

  const statut = statutPalier(palier);
  const badgeStatut = champ(ecran, "statut");
  badgeStatut.textContent = STATUTS[statut].libelle;
  badgeStatut.dataset.statut = statut;
  champ(ecran, "numero").textContent = numeroPalier(palier);
  champ(ecran, "type").textContent = STATUTS[statut].typeLot;
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
  const lignes = lignesPastille(palier, statut);
  if (lignes) lignes.forEach((texte, index) => (pastille.children[index].textContent = texte));
  else pastille.remove();

  remplirProgression(ecran, palier, statut);

  champ(ecran, "gagnant-palier").textContent = numeroPalier(palier);
  if (gagnant !== null) {
    remplirGagnant(ecran, indice, gagnant);
    ecran.classList.add("revele");
  }
  return ecran;
}

function remplirGagnant(ecran, indice, gagnant) {
  champ(ecran, "gagnant").textContent = gagnant;
  champ(ecran, "gagnant-lot").textContent = PALIERS[indice].nom;
}

// Un lot qui n'a pas été tiré (palier non débloqué, par exemple) n'apparaît pas au palmarès.
function construireFin(palmares) {
  const ecran = cloner("modele-fin");
  champ(ecran, "palmares").append(
    ...PALIERS.flatMap((palier, indice) => {
      if (palmares[indice] === null) return [];
      const ticket = element("li", "", "ticket");
      ticket.append(
        element("span", `Palier ${numeroPalier(palier)}`),
        element("strong", `n° ${palmares[indice]}`),
        element("span", palier.nom),
      );
      return ticket;
    }),
  );
  return ecran;
}

function lignesPastille(palier, statut) {
  if (palier.offertPar) return ["Offert par", palier.offertPar, ""];
  if (statut === "debloque" && palier.objectif) return ["Objectif", euros(palier.objectif), "atteint"];
  return null;
}

function remplirProgression(ecran, palier, statut) {
  const { objectif, offertPar, prochainObjectif } = palier;
  const collecte = montantRecolte();
  const valide = statut === "debloque";
  const chiffree = objectif !== undefined && collecte !== null;

  const titre = champ(ecran, "titre");
  const detail = champ(ecran, "detail");
  if (valide) {
    titre.textContent = "Validé";
    if (offertPar) detail.textContent = `Offert par ${offertPar}`;
    else if (chiffree) detail.textContent = `${euros(collecte)} récoltés`;
  } else if (chiffree) {
    titre.replaceChildren(euros(collecte), element("span", `/ ${euros(objectif)}`, "progression-objectif"));
    detail.textContent = "récoltés";
  } else {
    titre.textContent = STATUTS[statut].libelle;
  }
  if (!detail.textContent) detail.remove();

  // Sans montant connu, un palier en cours n'affiche pas de jauge : on n'invente pas de progression.
  let niveau = null;
  if (valide) niveau = 1;
  else if (chiffree) niveau = Math.min(collecte / objectif, 1);

  const jauge = ecran.querySelector(".jauge");
  if (niveau === null) {
    jauge.remove();
  } else {
    jauge.style.setProperty("--niveau", niveau);
    champ(ecran, "pourcentage").textContent = `${Math.round(niveau * 100)}%`;
    if (objectif !== undefined) champ(ecran, "echelle").append(...graduations(objectif));
  }

  const suite = champ(ecran, "suite");
  const reste = chiffree ? objectif - collecte : 0;
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

// Un affichage reçu pendant une transition ne l'interrompt pas : le dernier reçu est appliqué ensuite.
async function demanderAffichage(affichage) {
  affichageDemande = affichage;
  if (enTransition) return;
  enTransition = true;
  try {
    while (JSON.stringify(affichageDemande) !== JSON.stringify(affichageCourant)) {
      const cible = affichageDemande;
      await passerA(cible);
      affichageCourant = cible;
    }
  } finally {
    enTransition = false;
  }
}

// Le gagnant du palier déjà affiché apparaît par-dessus le lot, sans changer d'écran.
function passerA(affichage) {
  const revelation =
    affichageCourant?.etape === affichage.etape && affichageCourant.gagnant === null && affichage.gagnant !== null;
  return revelation ? revelerGagnant(affichage) : afficher(affichage);
}

async function afficher(affichage) {
  scene.classList.add("sortie");
  await animationsTerminees(scene);
  scene.classList.remove("sortie");
  scene.replaceChildren(construireEcran(affichage));
  await animationsTerminees(scene, { subtree: true });
}

async function revelerGagnant({ etape, gagnant }) {
  const ecran = scene.firstElementChild;
  remplirGagnant(ecran, etape - 1, gagnant);
  ecran.classList.add("revele");
  await animationsTerminees(ecran, { subtree: true });
}

function basculerPleinEcran() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen();
}

document.addEventListener("keydown", (evenement) => {
  if (evenement.repeat || evenement.ctrlKey || evenement.metaKey || evenement.altKey) return;
  if (evenement.key.toLowerCase() === "f") basculerPleinEcran();
});

/* Liaison avec la régie

   Les deux fenêtres communiquent par postMessage : c'est le seul canal qui fonctionne dans tous
   les navigateurs quand les pages sont ouvertes depuis le disque (Firefox isole alors le localStorage
   de chaque fichier). Au chargement, la page demande à la régie ce qu'elle doit afficher. */

addEventListener("message", (evenement) => {
  if (evenement.source === regie) demanderAffichage(evenement.data);
});

// Prévient la régie que l'écran de projection est fermé ou rechargé.
addEventListener("pagehide", () => regie?.postMessage("ferme", "*"));

// Précharge les images pour qu'elles soient prêtes au moment de leur entrée en scène.
for (const palier of PALIERS) new Image().src = palier.image;

if (regie && !regie.closed) regie.postMessage("pret", "*");
else demanderAffichage({ etape: 0, gagnant: null, palmares: [] });
chargerTicketsVendus();
