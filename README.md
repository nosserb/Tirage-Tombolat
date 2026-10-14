# Tombola Playground

Présentation et tirage au sort de la tombola de la soirée d'intégration Playground, à projeter en plein écran et à piloter au clavier. Chaque palier désigne un ticket gagnant, et un ticket ne peut gagner qu'une fois.

## Lancer

Aucune dépendance à installer : ouvrir `index.html` dans Chrome, Edge ou Firefox.

Pour servir le dossier en local (optionnel) :

```sh
python3 -m http.server 8000
```

puis ouvrir http://localhost:8000.

Une connexion internet est nécessaire pour lire le nombre de tickets vendus dans le Google Sheet (voir plus bas). Sans connexion, la présentation et le tirage fonctionnent quand même.

## Déroulement

1. Sur l'accueil, vérifier le dernier numéro de ticket (les tickets en jeu vont de 1 à ce numéro), pré-rempli avec le nombre de tickets vendus du Google Sheet, puis valider avec Entrée.
2. Espace affiche le palier 1.
3. Espace tire au sort le gagnant du palier 1.
4. Espace passe au palier suivant, puis Espace tire son gagnant, et ainsi de suite.
5. Après le dernier palier, l'écran de fin récapitule les tickets gagnants.

## Commandes

| Touche | Action |
| --- | --- |
| Entrée (dans la saisie) | valider la plage de tickets |
| Espace ou → | tirer le gagnant du palier affiché, sinon passer à l'écran suivant |
| ← | écran précédent (un gagnant déjà tiré est réaffiché, jamais retiré) |
| F | activer ou quitter le plein écran |
| Échap | quitter le plein écran (comportement du navigateur) |
| R, deux fois, sur l'écran de fin ou sur l'accueil | effacer les gagnants et la plage de tickets, puis recommencer |

Les appuis pendant une transition ou un tirage sont ignorés, tout comme la répétition d'une touche maintenue. Tab permet de revenir dans la saisie pour corriger la plage tant qu'aucun gagnant n'a été tiré.

## Montant récolté (Google Sheet)

Au chargement de la page, le site lit le nombre de tickets vendus dans la cellule B2 de l'onglet « Dashboard » du Google Sheet de la tombola. Le montant récolté vaut ce nombre × 2 € (`PRIX_TICKET`). Ces réglages sont en tête de `paliers.js`.

- La feuille doit rester partagée en lecture (« Tous les utilisateurs disposant du lien »). Elle est alors lisible par toute personne qui a le lien : n'y mettre aucune donnée personnelle.
- Les jauges, statuts et montants restants suivent ce montant : un palier passe en « Débloqué » dès que le montant atteint son `objectif`.
- La valeur est lue une seule fois, au chargement : recharger la page (F5) pour l'actualiser. Un tirage commencé est conservé.
- Si la feuille est injoignable (pas d'internet, partage retiré), aucun montant n'est affiché : les statuts de `paliers.js` s'appliquent et la plage de tickets se saisit à la main.
- Le tirage au sort ne dépend jamais de la feuille.

## Tirage au sort

- **Source du hasard** : `crypto.getRandomValues`, le générateur cryptographique du navigateur. Contrairement à `Math.random`, il n'a pas de graine et son résultat ne peut pas être prédit.
- **Équité** : chaque ticket encore en jeu a exactement la même probabilité d'être tiré (1 sur le nombre de tickets restants). La conversion du nombre aléatoire en ticket rejette les valeurs qui introduiraient un biais (biais du modulo), aucun ticket n'est avantagé.
- **Un seul gain par ticket** : avant chaque tirage, les gagnants des paliers précédents sont retirés. Le palier 2 est tiré parmi les tickets restants sans le gagnant du palier 1, le palier 3 sans les gagnants des paliers 1 et 2, etc. L'écran du gagnant indique le nombre de tickets en jeu et les numéros exclus.
- **Moment du tirage** : le gagnant est tiré à l'instant où Espace est pressée sur le palier, pas à l'avance. Les numéros qui défilent ensuite ne sont qu'un effet de suspense : le résultat est déjà fixé et n'en dépend pas.
- **Pas de nouveau tirage** : revenir en arrière réaffiche le gagnant déjà tiré. Le tirage est sauvegardé dans le navigateur (`localStorage`), donc un rechargement accidentel de la page conserve les gagnants et ne remet pas leurs tickets en jeu. Seul un double appui sur R efface le tirage.
- **Traçabilité** : chaque tirage est aussi écrit dans la console du navigateur (F12), avec le nombre de tickets en jeu.

La plage de tickets doit compter au moins autant de tickets que de paliers, et elle est verrouillée dès le premier tirage. Une plage validée sans aucun tirage n'est pas conservée au rechargement : elle est de nouveau pré-remplie depuis le Google Sheet.

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


