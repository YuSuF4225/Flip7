# FLIP 7 - PROJET WEB3
YUSUF KORKMAZ

# Présentation
Ce projet est une adaptation web du jeu de cartes "FLIP 7".

Chaque joueur, à son tour, peut piocher une carte ou s'arreter.
Si un joueur pioche un doublon, alors il est éliminé de la manche.
L'objectif est d'avoir le plus de points avant que la partie se termine.
Une partie se termine quand au moins une personne a atteint 200 points en fin de manche.

Le jeu permet de jouer avec :
- des joueurs humains,
- des intelligences artificielles (simple et plus intelligent),
- un systeme de score,
- des statistiques sauvergardées en base de données.

# Structure du projet

## JavaScript

### carte.js
Gestion :
- des cartes
- du deck
- du mélange
- du rendu HTML des cartes

### joueur.js
Gestion :
- des joueurs
- des scores
- des IA

### manche.js
Gestion :
- du déroulement d'une manche
- des tours
- des effets de cartes
- des éliminations

### game.js
Gestion :
- des manches
- des scores
- de la fin de partie

### interface.js
Gestion :
- de l'affichage
- des boutons
- du dark mode
- des statistiques
- des sons

### event.js
Gestion des événements utilisateurs

## Base de données
Le projet utilise : PHP et MariaDB/MySQL

Le fichier stats.php permet :
- d'enregistrer les scores
- de récupérer les statistiques
- de récuperer le record

# Fonctionnalités Implémentées

## Gestion de partie
- Création d'une nouvelle partie
- Ajout de joueurs humains
- Ajout d'IA
- Remplacer joueur humain par IA
- Plusieurs manches
- Rotation du donneur
- Fin de partie à 200 points

## Cartes spéciales
- les modificateurs (+2, +4, +6, +8, +10, *2)
- Freeze
- Flip Three
- Seconde Chance

## Interface graphique
- Cartes fait en CSS
- Dark mode
- Jouable sur mobile (mode portrait) et tablette (mode paysage)
- Affichages dynamiques
- Message visuels

## Audio
- Effets sonores
- Gestion du volume
- Sons différent selon les actions

## Sauvegarde statistiques
- Historique des parties
- Score enregistrés en base de données
- Affichage du record


## Description des IA

### IA Simple (niveau 1)
- Joue au hasard : 1 chance sur 2 de piocher, 1 chance sur 2 de s'arrêter
- Pour choisir une cible (FREEZE, FLIP THREE, SECONDE CHANCE) : choisit au hasard

### IA Avancée (niveau 2)

#### Quand est-ce qu'elle pioche ou s'arrête ?

L'IA suit ces règles simples :

1. Si elle a 5 valeurs différentes ou plus** -> elle pioche (veut faire le FLIP7)

2. Si elle a 3 cartes ou moins** -> elle pioche (peu de risque)

3. Si son score est faible (moins de 25 points)** -> elle pioche
   - Elle s'arrête seulement si le risque de doublon est très élevé (> 0.65)

4. Si son score est moyen (entre 25 et 40 points)** -> elle pioche
   - Elle s'arrête si le risque de doublon est élevé (> 0.6)

5. Si son score est bon (40 points ou plus)** -> elle s'arrête

En résumé :
- Score bas -> on tente sa chance
- Score haut -> on ne prend pas de risque
- Proche du FLIP7 -> on tente coûte que coûte

#### Comment elle calcule le risque de doublon ?

Elle compte combien de cartes de chaque valeur sont déjà sorties :
- Dans la défausse
- Dans sa propre main
- Dans les mains des autres joueurs

Plus il reste peu de cartes d'une valeur dans le paquet, plus le risque est grand.

#### Comment elle choisit une cible ?

- FREEZE (geler) : elle cible le joueur qui a le plus de points (pour le bloquer)

- FLIP THREE (envoyer 3 cartes) :
  - Si elle a une carte seconde chance ->elle se cible elle-même
  - Si elle a peu de cartes (3 ou moins) ->elle se cible elle-même
  - Sinon -> elle cible celui qui a le plus de chances de faire un FLIP7

- SECONDE CHANCE (donner une carte) : elle cible le joueur qui a le moins de points (pour l'aider)

# Comment y jouer

- git clone https://github.com/YuSuF4225/Flip7.git
- cd Flip7
- open index.html &
- Sinon télecharger le fichier .zip, dézipper le, puis lancer index.html

Si vous voulez activer l'historique et les statistiques (Docker) :
- docker compose up --build
- Ouvrez http://localhost:8080/ dans votre navigateur
