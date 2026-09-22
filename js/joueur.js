// Classe joueur
class Joueur {

    constructor(pseudo, type="human"){
        this.pseudo = pseudo;
        this.type = type;
        this.total = 0;
        this.reset();
    }

    // réinitialise l'état du joueur pour une nouvelle manche
    reset(){
        this.main = [];
        this.score = 0;
        this.bonus = 0;
        this.status = "EN_JEU";
        this.secondeChance = false;
        this.double = false;
    }

    // marque le joueur comme éliminé (doublon) et vide sa main
    elimine(){
        this.main = [];
        this.score = 0;
        this.bonus = 0;
        this.status = "ELIMINE";
        this.secondeChance = false;
        this.double = false;
    }

    // getters de status
    estEnJeu(){ return this.status === "EN_JEU"; }
    estReste(){ return this.status === "RESTE"; }
    estElimine(){ return this.status === "ELIMINE"; }

    // calcule le score total de la manche
    scoreTotal(){
        let s = this.score;
        if(this.double) s *= 2;
        return s+this.bonus;
    }

    //retourne uniquement les cartes numéro de la main
    numEnMain(){
        return this.main.filter(carte => carte.isNumero());
    }

    // retourne un Set des valeurs numériques unique en main
    valNum(){
        return new Set(this.numEnMain().map(carte => carte.val));
    }

    // verifie si le joueur possède deja une carte de la valeur donné
    aDouble(val){
        return this.valNum().has(val);
    }

    //ajoute une carte à la main et mets à jour le score/état
    ajouterCarte(carte){
        this.main.push(carte);
        if(carte.isNumero()) this.score += carte.val;
        else if(carte.isModifier()) this.bonus += carte.bonusVal();
        else if(carte.isDouble()) this.double = true;
        else if(carte.isChance()) this.secondeChance = true;
    }
    
    // verifie si le joueur a exactement 7 valeurs numériques differents en main
    isFlip7(){
        return this.valNum().size===7;
    }

    // estime la proba d'atteindre un FLIP7 selon le nombre de numéros uniques déjà en main
    // utilisé pour les décision d'IA 
    probaFlip7() {
        const nbUniques = this.valNum().size;
        const manque = 7 - nbUniques;
        if(manque <= 0) return 1;
        if(manque === 1) return 0.95;
        if(manque === 2) return 0.80;
        if(manque === 3) return 0.50;
        if(manque === 4) return 0.25;
        return 0.05;
    }

    // estime le risque de tirer un doublon en se basant sur les cartes visibles :
    // défausse + main de tous les joueurs
    calculerRisqueDoublon(game) {
        const valeursEnMain = this.valNum();
        if(valeursEnMain.size === 0) return 0;
        const carteVues = [...game.defausse, ...game.joueurs.flatMap(j => j.main)];
        let proba = 0;
        const tailleDeck = Math.max(game.deck.cartes.length, 1);
        for(let val of valeursEnMain) {
            const totalCopies = val;
            const dejaSorties = carteVues.filter(c => c.val === val).length;
            const restantes = Math.max(totalCopies - dejaSorties, 0);
            proba += restantes / tailleDeck;
        }
        return Math.min(proba, 1);
    }
};

// classe IA (hérite de Joueur)
// deux niveaux : 1 = simple (aléatoire) , 2 = Avancée (statégique)
class IA extends Joueur {

    // pseudo = nom de l'ia
    constructor(pseudo, level=1){
        super(pseudo, "ia");
        this.level = level;
    }


    // décide de l'action à jouer pour ce tour : piocher ou stopper
    // niveau 1 : décision purement aléatoire (50/50)
    // niveau 2 : voir le README pour les détails
    decider(game) {
        if(this.level === 1){
            return Math.random() < 0.5 ? "piocher" : "rester";
        }
    
        if(this.secondeChance){
            return "piocher";
        }
    
        const risqueDoublon = this.calculerRisqueDoublon(game);
        const probaFlip7 = this.probaFlip7();
        const nbCartes = this.main.filter(c => c.isNumero()).length;
        const nbUniques = this.valNum().size;
        const scoreActuel = this.scoreTotal();
    
        // === 1. SI JE SUIS PROCHE DU FLIP7 (≥5 uniques) → je tente TOUJOURS ===
        if (nbUniques >= 5) {
            return "piocher";
        }
    
        // === 2. SI J'AI TRÈS PEU DE CARTES (≤3) → je pioche (rien à perdre) ===
        if (nbCartes <= 3) {
            return "piocher";
        }
    
        // === 3. SI MON SCORE EST FAIBLE (< 25) → je continue à piocher ===
        // Je m'arrête seulement si le risque est EXTREME (> 0.8)
        if (scoreActuel < 25) {
            if (risqueDoublon > 0.65) {
                return "rester";
            }
            return "piocher";
        }
    
        // === 4. SI MON SCORE EST MOYEN (25-40) → je suis un peu prudent ===
        if (scoreActuel >= 25 && scoreActuel < 40) {
            // Je m'arrête si risque élevé (> 0.6)
            if (risqueDoublon > 0.6) {
                return "rester";
            }
            // Bonus : si j'ai une bonne proba de FLIP7 (≥ 60%), je continue
            if (probaFlip7 >= 0.6) {
                return "piocher";
            }
            return "piocher";
        }
    
        // === 5. SI MON SCORE EST BON (≥ 40) ===
        if (scoreActuel >= 40) {
            return "rester";
        }
    
        // Par défaut : je pioche
    return "piocher";
}

    // calcul du risque de doublon pour l'ia avancée
    // examine séparément : défausse, propre main, mains des adversaires
    // cela donne une estimation plus précis des cartes restantes dans le deck
    calculerRisqueDoublon(game) {
        const valeursEnMain = this.valNum();
        if (valeursEnMain.size === 0) return 0;
    
        let dangereuses = 0;
        let total = 0;
    
        for (let val of valeursEnMain) {
            // Compter combien de cartes de cette valeur sont déjà hors du deck
            let dejaSorties = 0;
        
            // 1. Cartes dans la défausse
            dejaSorties += game.defausse.filter(c => c.val === val).length;
        
            // 2. Mes propres cartes de cette valeur
            dejaSorties += this.main.filter(c => c.val === val).length;
        
            // 3. Cartes des autres joueurs visibles
            for (let autre of game.joueurs) {
                if (autre === this) continue;
                dejaSorties += autre.main.filter(c => c.val === val).length;
            }
        
            // Nombre de cartes de cette valeur restant dans le deck
            const restantes = val - dejaSorties;
            dangereuses += Math.max(restantes, 0);
            total += val;
        }
        return total === 0 ? 0 : dangereuses / total;
    }

    peutAtteindreFlip7() {
        const nbUniques = this.valNum().size;
        const manque = 7 - nbUniques;
        return manque <= 2;
    }

    //estime la proba d'atteindre le flip7
    // légerement différente des valeurs heuristiques de la classe Joueur
    probaFlip7() {
        const nbUniques = this.valNum().size;
        const manque = 7 - nbUniques;
        
        if(manque <= 0) return 1;
        if(manque === 1) return 0.9;
        if(manque === 2) return 0.7;
        if(manque === 3) return 0.4;
        if(manque === 4) return 0.2;
        return 0.05;
    }

    // choisit la meilleur cible parmi une liste de joueurs éligibles
    // voir le README
    choisirCible(cibles, typeCarte, game) {
        if (!cibles || cibles.length === 0) return 0;
        // NE PAS SE FREEEZZE SAUF SI ELLE EST TOUTE SEULE 
        if (typeCarte === "freeze") {
            let meilleurIndex = 0;
            let meilleurScore = -Infinity;
            
            for(let i = 0; i < cibles.length; i++) {
                const scorePotentiel = cibles[i].total + cibles[i].scoreTotal();
                if(scorePotentiel > meilleurScore) {
                    meilleurScore = scorePotentiel;
                    meilleurIndex = i;
                }
            }
            return meilleurIndex;
        }
        if (typeCarte === "flipthree") {
            if (this.secondeChance) {
                const idx = cibles.indexOf(this);
                return idx !== -1 ? idx : 0;
            }
        const nbCartesNumeriques = this.main.filter(c => c.isNumero()).length;
        if (nbCartesNumeriques <= 3) {
            const idx = cibles.indexOf(this);
            return idx !== -1 ? idx : 0;
        }
        let meilleurIndex = -1;
        let meilleurScore = -Infinity;
        for (let i = 0; i < cibles.length; i++) {
            const cible = cibles[i];
            if (cible === this) continue;
            const score = cible.probaFlip7();
            if (score > meilleurScore) {
                meilleurScore = score;
                meilleurIndex = i;
            }
        }
            return meilleurIndex !== -1 ? meilleurIndex : 0;
        }
        
        if (typeCarte === "secondechance") {
            let plusFaibleIndex = 0;
            let plusPetitScore = Infinity;
            
            for(let i = 0; i < cibles.length; i++) {
                const scoreTotal = cibles[i].total + cibles[i].scoreTotal();
                if(scoreTotal < plusPetitScore) {
                    plusPetitScore = scoreTotal;
                    plusFaibleIndex = i;
                }
            }
            return plusFaibleIndex;
        }
        
        return 0;
    }
}