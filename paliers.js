// Nombre de tickets vendus : cellule B2 de l'onglet « Dashboard » du Google Sheet de la tombola.
// La feuille doit rester partagée en lecture (« Tous les utilisateurs disposant du lien »).
const GOOGLE_SHEET = {
  id: "1-vASa7wcRgmppYlCKKS5YMRNuovmnP2H7BBix_9dtYs",
  onglet: "Dashboard",
  cellule: "B2",
};

// Prix d'un ticket, en euros : montant récolté = tickets vendus × PRIX_TICKET.
const PRIX_TICKET = 2;

// Paliers de la tombola, présentés dans l'ordre du tableau.
//
// Champs :
//   numero            numéro affiché en grand
//   statut            "debloque" ou "en-cours". Pour un palier avec objectif, il est recalculé à partir
//                     du montant récolté : cette valeur ne sert que si le Google Sheet est injoignable.
//   nom, description  textes du lot
//   image             chemin depuis index.html (voir README)
//   offertPar         facultatif, partenaire qui offre le lot
//   objectif          facultatif, montant total récolté (en euros) qui débloque ce palier
//   prochainObjectif  facultatif, texte affiché en bas du panneau de progression
const PALIERS = [
  {
    numero: 1,
    statut: "debloque",
    nom: "Casque gaming",
    description: "Casque HyperX Cloud III",
    image: "assets/lots/casque-hyperx-cloud-iii.webp",
    offertPar: "Zone01",
    prochainObjectif: "palier 2",
  },
  {
    numero: 2,
    statut: "debloque",
    nom: "Écran gaming",
    description: "Koorui 24 pouces incurvé · 180 Hz",
    image: "assets/lots/ecran-koorui-24.webp",
    objectif: 100,
    prochainObjectif: "palier 3",
  },
  {
    numero: 3,
    statut: "en-cours",
    nom: "Séjour duo",
    description: "Parc Astérix · 2 entrées · 1 journée",
    image: "assets/lots/coffret-parc-asterix.webp",
    objectif: 250,
    prochainObjectif: "palier 4",
  },
];
