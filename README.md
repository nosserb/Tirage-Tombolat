# Tombola Playground

Présentation et tirage au sort de la tombola de la soirée d'intégration Playground, à projeter en plein écran et à piloter au clavier. Chaque palier désigne un ticket gagnant, et un ticket ne peut gagner qu'une fois.

## Lancer

Aucune dépendance à installer : ouvrir `index.html` dans Chrome, Edge ou Firefox.

Pour servir le dossier en local (optionnel) :

```sh
python3 -m http.server 8000
```

puis ouvrir http://localhost:8000.

## Déroulement

1. Sur l'accueil, saisir le dernier numéro de ticket vendu (les tickets en jeu vont de 1 à ce numéro) puis valider avec Entrée.
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
| R, deux fois, sur l'écran de fin ou sur l'accueil | effacer les gagnants et recommencer |

Les appuis pendant une transition ou un tirage sont ignorés, tout comme la répétition d'une touche maintenue. Tab permet de revenir dans la saisie pour corriger la plage tant qu'aucun gagnant n'a été tiré.

## Tirage au sort

- **Source du hasard** : `crypto.getRandomValues`, le générateur cryptographique du navigateur. Contrairement à `Math.random`, il n'a pas de graine et son résultat ne peut pas être prédit.
- **Équité** : chaque ticket encore en jeu a exactement la même probabilité d'être tiré (1 sur le nombre de tickets restants). La conversion du nombre aléatoire en ticket rejette les valeurs qui introduiraient un biais (biais du modulo), aucun ticket n'est avantagé.
- **Un seul gain par ticket** : avant chaque tirage, les gagnants des paliers précédents sont retirés. Le palier 2 est tiré parmi les tickets restants sans le gagnant du palier 1, le palier 3 sans les gagnants des paliers 1 et 2, etc. L'écran du gagnant indique le nombre de tickets en jeu et les numéros exclus.
- **Moment du tirage** : le gagnant est tiré à l'instant où Espace est pressée sur le palier, pas à l'avance. Les numéros qui défilent ensuite ne sont qu'un effet de suspense : le résultat est déjà fixé et n'en dépend pas.
- **Pas de nouveau tirage** : revenir en arrière réaffiche le gagnant déjà tiré. Le tirage est sauvegardé dans le navigateur (`localStorage`), donc un rechargement accidentel de la page conserve les gagnants et ne remet pas leurs tickets en jeu. Seul un double appui sur R efface le tirage.
- **Traçabilité** : chaque tirage est aussi écrit dans la console du navigateur (F12), avec le nombre de tickets en jeu.

La plage de tickets doit compter au moins autant de tickets que de paliers, et elle est verrouillée dès le premier tirage.

## Modifier les lots

Tout le contenu est dans `paliers.js`, dans l'ordre de présentation. Ajouter un palier revient à ajouter un objet au tableau ; la navigation s'adapte seule. Les champs sont décrits en tête du fichier.

Le panneau de progression n'affiche que ce qui est renseigné :

- palier `debloque` : « Validé » et jauge pleine ;
- palier `en-cours` avec `progression` : montant récolté, objectif, jauge graduée et montant restant ;
- palier `en-cours` sans `progression` : statut et prochain objectif uniquement.

Penser à mettre à jour `progression.collecte` du palier en cours avant la soirée.

## Images

Les images des lots sont dans `assets/lots/`, référencées par le champ `image` de chaque palier. Utiliser de préférence un PNG ou un WebP à fond transparent. Si un fichier manque, le ticket s'affiche sans image (halo et cercle seuls) et le chemin attendu est signalé dans la console du navigateur.

## Police

Montserrat, sous licence SIL Open Font License (`assets/fonts/OFL.txt`).
