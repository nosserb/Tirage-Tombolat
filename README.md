# Tombola Playground

Présentation de la tombola de la soirée d'intégration Playground, à projeter en plein écran et à piloter au clavier.

## Lancer

Aucune dépendance à installer : ouvrir `index.html` dans Chrome, Edge ou Firefox.

Pour servir le dossier en local (optionnel) :

```sh
python3 -m http.server 8000
```

puis ouvrir http://localhost:8000.

## Commandes

| Touche | Action |
| --- | --- |
| Espace ou → | ticket suivant (sur le dernier ticket : écran de fin) |
| ← | ticket précédent |
| F | activer ou quitter le plein écran |
| Échap | quitter le plein écran (comportement du navigateur) |
| R, deux fois, sur l'écran de fin | recommencer depuis l'accueil |

Les appuis pendant une transition sont ignorés, tout comme la répétition d'une touche maintenue.

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
