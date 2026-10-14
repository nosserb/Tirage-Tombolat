// Paliers de la tombola, présentés dans l'ordre du tableau.
//
// Champs :
//   numero            numéro affiché en grand
//   statut            "debloque" ou "en-cours"
//   type              ligne au-dessus du nom (ex. "Lot à gagner")
//   nom, description  textes du lot
//   image             chemin depuis index.html (voir README)
//   offertPar         facultatif, partenaire qui offre le lot
//   progression       facultatif, montants réellement récoltés en euros : { collecte, objectif }
//                     Ne le renseigner que si les montants sont connus : sans lui, aucune jauge chiffrée n'est affichée.
//   prochainObjectif  facultatif, texte affiché en bas du panneau de progression
const PALIERS = [
  {
    numero: 1,
    statut: "debloque",
    type: "Lot débloqué",
    nom: "Casque gaming",
    description: "Casque HyperX Cloud III",
    image: "assets/lots/casque-hyperx-cloud-iii.webp",
    offertPar: "Zone01",
    prochainObjectif: "palier 2",
  },
  {
    numero: 2,
    statut: "debloque",
    type: "Lot débloqué",
    nom: "Écran gaming",
    description: "Koorui 24 pouces incurvé · 180 Hz",
    image: "assets/lots/ecran-koorui-24.webp",
    progression: { collecte: 100, objectif: 100 },
    prochainObjectif: "palier 3",
  },
  {
    numero: 3,
    statut: "en-cours",
    type: "Lot à gagner",
    nom: "Séjour duo",
    description: "Parc Astérix · 2 entrées · 1 journée",
    image: "assets/lots/coffret-parc-asterix.webp",
    progression: { collecte: 174, objectif: 250 },
    prochainObjectif: "palier 4",
  },
];
