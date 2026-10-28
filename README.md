# Tombola Playground

Présentation de la tombola de la soirée d'intégration Playground, pilotée depuis une régie à deux écrans, comme OBS : la régie reste sur l'écran de l'ordinateur et l'écran de projection part sur le vidéoprojecteur. Le tirage au sort se fait sur papier : la régie sert à saisir les tickets tirés et à les afficher.

## Lancer

Aucune dépendance à installer : ouvrir `regie.html` dans Chrome, Edge ou Firefox.

1. Cliquer sur « Ouvrir l'écran de projection » : une nouvelle fenêtre s'ouvre (autoriser les pop-ups si le navigateur la bloque).
2. Glisser cette fenêtre sur le vidéoprojecteur, cliquer dedans et appuyer sur F pour le plein écran.
3. Revenir sur la régie : tout se pilote depuis elle.

Pour servir le dossier en local (optionnel) :

```sh
python3 -m http.server 8000
```

puis ouvrir http://localhost:8000/regie.html.

Une connexion internet est nécessaire pour lire le nombre de tickets vendus dans le Google Sheet (voir plus bas). Sans connexion, la régie et l'écran de projection fonctionnent quand même.

## Régie

- **Aperçu** (à gauche, cadre bleu) : la scène choisie, telle qu'elle apparaîtra. Le public ne la voit pas.
- **Direct** (à droite, cadre rouge) : ce qui est projeté en ce moment.
- **Passer en direct** : envoie l'aperçu sur l'écran de projection. Le bouton est grisé quand l'aperçu est déjà en direct.
- **Scènes** : cliquer sur une scène la met dans l'aperçu. La scène projetée porte l'étiquette « Direct ».

Chaque palier a deux scènes : « lot » présente le lot, « gagnant » affiche par-dessus le ticket gagnant. La scène « gagnant » n'est disponible qu'une fois le ticket saisi, et passer du lot au gagnant d'un même palier fait apparaître le ticket sans changer d'écran.

L'indicateur en haut à droite dit si l'écran de projection est ouvert. Il se reconnecte seul quand l'écran de projection est rechargé. Si c'est la régie qui est rechargée, cliquer de nouveau sur « Ouvrir l'écran de projection » : la fenêtre déjà ouverte est retrouvée sans être rechargée et reste en plein écran.

## Déroulement

1. Accueil en direct au lancement.
2. Choisir « Palier 01 · lot », puis Passer en direct.
3. Tirer le ticket sur papier, saisir son numéro dans le champ du palier puis Entrée : l'aperçu passe sur « Palier 01 · gagnant ». Vérifier le numéro, puis Passer en direct.
4. Recommencer pour chaque palier.
5. Terminer par « Fin · palmarès », qui récapitule les tickets gagnants.

## Tickets gagnants

- **Un seul gain par ticket** : la régie refuse un numéro déjà gagnant sur un autre palier, c'est forcément une erreur de saisie.
- **Saisie** : un nombre entier à partir de 1. Vider le champ retire le gagnant du palier.
- **Correction** : comme dans OBS, corriger un ticket déjà en direct ne change pas l'écran projeté. Le nouveau numéro apparaît dans l'aperçu, puis sur l'écran au prochain passage en direct.
- **Lot non tiré** : un palier sans ticket (palier non débloqué, par exemple) n'apparaît pas sur l'écran de fin.
- **Sauvegarde** : les tickets saisis et la scène en direct sont sauvegardés dans le navigateur (`localStorage`). Un rechargement accidentel de la régie ne fait rien perdre. Pour recommencer, vider les champs des tickets et repasser l'accueil en direct.

## Écran de projection

L'écran de projection (`index.html`) n'affiche que ce que la régie lui envoie. Ouvert seul, sans la régie, il reste sur l'accueil.

| Touche | Action |
| --- | --- |
| F | activer ou quitter le plein écran |
| Échap | quitter le plein écran (comportement du navigateur) |

Les deux fenêtres communiquent par `postMessage`, qui fonctionne aussi quand les fichiers sont ouverts directement depuis le disque. Les deux fenêtres doivent donc rester dans le même navigateur, la projection étant ouverte depuis la régie.

## Montant récolté (Google Sheet)

Au chargement de l'écran, le site lit le nombre de tickets vendus dans la cellule B2 de l'onglet « Dashboard » du Google Sheet de la tombola. Le montant récolté vaut ce nombre × 2 € (`PRIX_TICKET`). Ces réglages sont en tête de `paliers.js`.

- La feuille doit rester partagée en lecture (« Tous les utilisateurs disposant du lien »). Elle est alors lisible par toute personne qui a le lien : n'y mettre aucune donnée personnelle.
- Les jauges, statuts et montants restants suivent ce montant : un palier passe en « Débloqué » dès que le montant atteint son `objectif`.
- La valeur est lue une seule fois, au chargement : recharger l'écran de projection (F5, puis F pour revenir en plein écran) pour l'actualiser. Il réaffiche aussitôt la scène en direct. Recharger la régie actualise les moniteurs Aperçu et Direct.
- Si la feuille est injoignable (pas d'internet, partage retiré), aucun montant n'est affiché : les statuts de `paliers.js` s'appliquent.

## Modifier les lots

Tout le contenu est dans `paliers.js`, dans l'ordre de présentation. Ajouter un palier revient à ajouter un objet au tableau ; la navigation s'adapte seule. Les champs sont décrits en tête du fichier.

Le panneau de progression n'affiche que des données connues :

- palier débloqué : « Validé » et jauge pleine ;
- palier en cours avec `objectif` et montant lu dans le Google Sheet : montant récolté, objectif, jauge graduée et montant restant ;
- palier en cours sans montant connu : statut et prochain objectif uniquement.

Le type de lot affiché (« Lot débloqué » ou « Lot à gagner ») suit le statut.

## Images

Les images des lots sont dans `assets/lots/`, référencées par le champ `image` de chaque palier. Utiliser de préférence un PNG ou un WebP à fond transparent. Si un fichier manque, le ticket s'affiche sans image (halo et cercle seuls) et le chemin attendu est signalé dans la console du navigateur.

## Police

Montserrat, sous licence SIL Open Font License (`assets/fonts/OFL.txt`).


