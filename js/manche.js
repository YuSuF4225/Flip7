
class Manche {
    constructor(game){
        this.game = game;
        this.joueurs = game.joueurs;
        this.idCourant = 0;
        this.mancheTerminee = false;
        this.attenteChoisSecondeChance = null;
        this.attenteChoisFreeze = null;
        this.attenteChoisFlipThree = null;
        this.aFlip7 = null;
        this.bloquerActions = false;
    }

    // retourne le joueur actif à partir de l'index courant
    // null si aucun joueur n'est actif
    joueurCourant(){
        let i = this.idCourant;
        let compt = 0;
        while(compt<this.joueurs.length){
            const j = this.joueurs[i];
            if(j.estEnJeu()) return j;
            i = (i+1) % this.joueurs.length;
            compt++;
        }
        return null;
    }

    // demarre la manche: affiche l'état initial et lance le tour de l'ia si c'est elle qui joue en premier
    demarrer(){
        render();
        if(this.joueurCourant() instanceof IA) this.tourIA();
    }

    // Affiche une carte dans la zone centrale de l'interface
    afficherCarte(carte){
        const c = document.getElementById("afficher-carte");
        if(!c) return;
        c.innerHTML = carte.carteToHtml();
        c.style.display = "block";
    }

    //Cache la zone d'affichage de carte
    cacherCarte(){
        const c = document.getElementById("afficher-carte");
        if(c){
            c.style.display = "none";
            c.innerHTML = "";
        }
    }

    /*
     Action principale : le joueur courant tire une carte.
     * Séquence :
     *  1. Verrou actif -> bloque les actions pendant l'animation
     *  2. Tire une carte du deck
     *  3. Affiche la carte (DELAI_CARTE)
     *  4. Cache la carte puis appelle traiterCarte()
     *  5. Une fois traitée, passe au joueur suivant (suivant())
     * 
     * si faireSuivant true, appelle suivant() après le traitement
    */
    piocher(faireSuivant=true){
        if(this.bloquerActions) return;
        this.bloquerActions = true;
        actionsBouton();
        const j = this.joueurCourant();
        if(!j){
            this.bloquerActions = false;
            actionsBouton();
            return;
        }
        const carte = this.game.deck.piocher(this.game.defausse);
        if(!carte){
            this.bloquerActions = false;
            actionsBouton();
            return;
        }
        jouerSon("piocher");
        this.afficherCarte(carte);
        setTimeout(() => {
            this.cacherCarte();
            this.traiterCarte(j, carte, () => this.suivant());
        }, DELAI_CARTE);
    }

    /*
    Traite l'effet d'une carte pour un joueur donné.
    aLaFin : callback appelé quand le traitement est términé
    */
    traiterCarte(j, carte, aLaFin){
        if(carte.isNumero() && j.aDouble(carte.val)){
            if(j.secondeChance){
                j.secondeChance = false;
                const id = j.main.findIndex(c => c.isChance());
                if(id!==-1) this.game.defausse.push(j.main.splice(id, 1)[0]);
                this.game.defausse.push(carte);
                render();
                jouerSon("vieperdu")
                Message(`${j.pseudo} utilise sa carte seconde chance !`);
            }
            else{
                this.game.defausse.push(...j.main, carte);
                j.elimine();
                render();
                jouerSon("elimine");
                Message(`${j.pseudo} a reçu un doublon ! ${j.pseudo} est éliminé de la manche.`);
            }
            this.bloquerActions = false;
            actionsBouton();
            aLaFin();
            return;
        }
        if(carte.isFreeze()){
            this.game.defausse.push(carte);
            const envie = this.joueurs.filter(j => j.estEnJeu());
            if(envie.length==1) {
                j.status = "RESTE";
                render();
                jouerSon("freeze");
                Message(`${j.pseudo} est gèlé ! ${j.pseudo} se retire avec ${j.scoreTotal()} pts.`);
                this.bloquerActions = false;
                actionsBouton();
                aLaFin();
                return;
            }
            const cibles = [...envie];
            this.attenteChoisFreeze = {joueur : j, cibles : cibles, aLaFin : aLaFin};
            render();
            Message(`${j.pseudo} doit choisir une cible à geler.`);
            if(j instanceof IA){
                let idCible = 0;
                if(j.level == 1){
                    idCible = Math.floor(Math.random() * cibles.length);
                }
                else{
                    idCible = j.choisirCible(cibles, "freeze", this.game);
                }
                setTimeout(() => this.donnerFreeze(idCible), DELAI_IA);
            }
            return;
        }
        if(carte.isFlipThree()){
            this.game.defausse.push(carte);
            const cibles = this.joueurs.filter(x => x.estEnJeu());
            this.attenteChoisFlipThree = {joueur : j, cibles : cibles, aLaFin : aLaFin};
            if(cibles.length===1){
                Message(`${j.pseudo} tire la carte Flip Three ! ${j.pseudo} doit tirer 3 cartes.`);
                setTimeout(() => this.donnerFlipThree(0) ,DELAI_IA);
                return;
            }
            render();
            Message(`${j.pseudo} tire la carte Flip Three ! Choisir une cible.`);
            if(j instanceof IA){
                    let idCible = 0;
                    if(j.level == 1){
                        idCible = Math.floor(Math.random() * cibles.length);
                    }
                    else{
                        idCible = j.choisirCible(cibles, "flipthree", this.game);
                    }
                    setTimeout(() => this.donnerFlipThree(idCible), DELAI_IA);
            }
            return;
        }
        if(carte.isChance()){
            if(!j.secondeChance){
                j.ajouterCarte(carte);
                render();
                jouerSon("secondechance");
                Message(`${j.pseudo} obtient une carte seconde chance !`);
                setTimeout(() => this.piocherSuivant(j, aLaFin), DELAI_CARTE);
                return;
            }
            const cibles = this.joueurs.filter(x => x!==j && x.estEnJeu() && !x.secondeChance);
            if(cibles.length!=0){
                this.attenteChoisSecondeChance = {joueur : j, carte : carte, cibles : cibles, aLaFin : aLaFin};
                render();
                Message(`${j.pseudo} doit choisir un joueur à qui donner la carte seconde chance`);
               if(j instanceof IA){
                    let idCible = 0;
                    if(j.level == 1){
                        idCible = Math.floor(Math.random() * cibles.length);
                    }
                    else{
                        idCible = j.choisirCible(cibles, "secondechance", this.game);
                    }
                    setTimeout(() => this.donnerSecondeChance(idCible), DELAI_IA);
                }
                return;
            }
            this.game.defausse.push(carte);
            render();
            Message("Aucun joueur peut recevoir une carte seconde shance !");
            this.bloquerActions = false;
            actionsBouton();
            aLaFin();
            return;
        }
        j.ajouterCarte(carte);
        if(j.isFlip7()){
            j.bonus += 15;
            this.aFlip7 = j;
            this.mancheTerminee = true;
            render();
            jouerSon("flip7");
            Message(`${j.pseudo} obtient le bonus FLIP 7 ! +15 points !`);
            this.bloquerActions = false;
            actionsBouton();
            setTimeout(() => this.finManche(), 900);
            return;
        }
        render();
        if(carte.isModifier() || carte.isDouble()) jouerSon("plus1");
        this.bloquerActions = false;
        actionsBouton();
        aLaFin();
    }

    /**
     * Pioche une carte supplémentaire pour le joueur j (utilisé après la Seconde Chance).
     * Même logique que piocher() mais sans changer de joueur courant.
     */
    piocherSuivant(j, aLaFin){
        const carte = this.game.deck.piocher(this.game.defausse);
        if(!carte){
            this.bloquerActions = false;
            actionsBouton();
            aLaFin();
            return;
        }
        jouerSon("piocher");
        this.afficherCarte(carte);
        setTimeout(() => {
            this.cacherCarte();
            this.traiterCarte(j, carte, aLaFin);
        },  DELAI_CARTE);
    }

    // le joueur courant choisit de s'arreter
    // son status passe à "RESTE" et on passe au joueur suivant
    rester(){
        if(this.bloquerActions) return;
        this.bloquerActions = true;
        actionsBouton();
        const j = this.joueurCourant();
        if(!j){
            this.bloquerActions = false;
            actionsBouton();
            return;
        }
        j.status = "RESTE";
        render();
        jouerSon("stop");
        Message(`${j.pseudo} se retire de la manche avec ${j.scoreTotal()} points.`);
        this.bloquerActions = false;
        actionsBouton();
        this.suivant();
    }

    /**
     * Passe au joueur suivant dans l'ordre circulaire.
     * Si plus aucun joueur n'est en jeu, déclenche la fin de manche.
     * Sinon, si le nouveau joueur courant est une IA, déclenche son tour.
     */
    suivant(){
        if(this.mancheTerminee) return;
        const resteActif = this.joueurs.some(j => j.estEnJeu());
        if(!resteActif){
            this.mancheTerminee = true;
            setTimeout(() => this.finManche(), 800);
            return;
        }
        let compt = 0;
        do{
            this.idCourant = (this.idCourant+1) % this.joueurs.length;
            compt++;
        } while(compt<this.joueurs.length && (!this.joueurs[this.idCourant].estEnJeu()));
        this.bloquerActions = false;
        render();
        actionsBouton();
        this.tourIA();
    }

    /**
     * Calcule les scores finaux et affiche le récapitulatif de fin de manche.
     * Les joueurs éliminés ne gagnent aucun point.
     * Les survivants ajoutent leur scoreTotal() à leur total cumulé.
     * Toutes les cartes retournent dans la défausse.
     */
    finManche(){
        this.mancheTerminee = true;
        const res = [];
        for(let j of this.joueurs) {
            let s = 0;
            const survie = !j.estElimine();
            if(survie){
                s = j.score;
                if(j.double) s *= 2;
                s += j.bonus;
                j.total += s;
            }
            res.push({joueur : j, score : s, total : j.total, survie : survie});
            this.game.defausse.push(...j.main);
        };
        this.game.showManche(res);
    }

    /**
     * Déclenche le tour de l'IA si le joueur courant en est une.
     * Un délai (DELAI_IA) simule un temps de "réflexion".
     */
    tourIA(){
        const j = this.joueurCourant();
        if(!(j instanceof IA)) return;
        const mancheRef = this;
        setTimeout(()=>{
            if(!game) return;
            if(this.mancheTerminee || this.game.termine) return;
            if(this.game.manche !== mancheRef) return;
            j.decider(this.game)==="piocher" ? this.piocher() : this.rester();
        }, DELAI_IA);
    }

    // résout le don d'une carte Seconde Chance à la cible choisie.
    donnerSecondeChance(idCible){
        const info = this.attenteChoisSecondeChance;
        if(!info) return;
        const cible = info.cibles[idCible];
        if(!cible) return;
        this.attenteChoisSecondeChance = null;
        cible.secondeChance = true;
        cible.main.push(info.carte);
        render();
        jouerSon("secondechance");
        Message(`${info.joueur.pseudo} donne la carte seconde chance à ${cible.pseudo}`);
        this.bloquerActions = false;
        actionsBouton();
        info.aLaFin();
    }

    // Résout le Freeze : la cible choisie est forcée de s'arrêter.
    donnerFreeze(idCible){
        const info = this.attenteChoisFreeze;
        if(!info) return;
        const cible = info.cibles[idCible];
        if(!cible) return;
        this.attenteChoisFreeze = null;
        cible.status = "RESTE";
        render();
        jouerSon("freeze");
        Message(`${info.joueur.pseudo} gèle ${cible.pseudo} ! ${cible.pseudo} se retire avec ${cible.scoreTotal()} pts.`);
        this.bloquerActions = false;
        actionsBouton();
        info.aLaFin();
    }

    /**
     * Résout le Flip Three : la cible choisie doit tirer 3 cartes supplémentaires.
     * Les cartes spéciales (Freeze, Flip Three, Seconde Chance déjà possédée) tirées
     * pendant le Flip Three sont mises de côté et résolues après les 3 tirages.
     */
    donnerFlipThree(idCible){
        const info = this.attenteChoisFlipThree;
        if(!info) return;
        const cible = info.cibles[idCible];
        if(!cible) return;
        this.attenteChoisFlipThree = null;
        // Sauvegarde du joueur courant pour le restaurer après le Flip Three
        const idCourantSauvegarde = this.idCourant;
        this.idCourant = this.joueurs.indexOf(cible);
        render();
        Message(`${info.joueur.pseudo} envoie 3 cartes à ${cible.pseudo} !`);
        const cartesAppliquer = [];
        let i = 0;
        let stop = false;
        /** Restaure l'état et passe au joueur suivant après le Flip Three. */
        const terminer = () => {
            this.idCourant = idCourantSauvegarde;
            this.bloquerActions = true;
            actionsBouton();
            if(this.mancheTerminee){
                setTimeout(() => this.finManche(), 900);
                return;
            }
            setTimeout(() => {
                this.bloquerActions = false;
                info.aLaFin();
            }, 0);
        };
         /** Tire la prochaine des 3 cartes du Flip Three de façon récursive. */
        const tirerSuivante = () => {
            if(i>=3 || stop){
                appliquerEffets();
                return;
            }
            const c = this.game.deck.piocher(this.game.defausse);
            if(!c){
                appliquerEffets();
                return;
            }
            this.afficherCarte(c);
            jouerSon("flipthree");
            if(c.isModifier() || c.isDouble()) jouerSon("plus1");
            setTimeout(() => {
                this.cacherCarte();
                if(c.isNumero() && cible.aDouble(c.val)){
                    if(!cible.secondeChance){
                        this.game.defausse.push(...cible.main, c);
                        cible.elimine();
                        render();
                        stop = true;
                        jouerSon("elimine");
                        Message(`${cible.pseudo} a reçu un doublon pendant le Flip Three !`);
                    }
                    else{
                        cible.secondeChance = false;
                        const id = cible.main.findIndex(c => c.isChance());
                        if(id!==-1) this.game.defausse.push(cible.main.splice(id, 1)[0]);
                        this.game.defausse.push(c);
                        render();
                        jouerSon("vieperdu");
                        Message(`${cible.pseudo} utilise sa carte seconde chance pendant le Flip Three !`);
                    }
                }
                else{
                    if(!c.isChance() && !c.isFlipThree() && !c.isFreeze()){
                        cible.ajouterCarte(c);
                        render();
                        if(cible.isFlip7()){
                            cible.bonus += 15;
                            this.aFlip7 = cible;
                            this.mancheTerminee = true;
                            stop = true;
                            jouerSon("flip7");
                            Message(`${cible.pseudo} fait un FLIP 7 grâce au Flip Three !`);
                        }
                    }
                    else if(c.isChance()){
                        if(!cible.secondeChance){
                            cible.ajouterCarte(c);
                            render();
                            jouerSon("secondechance");
                            Message(`${cible.pseudo} obtient une carte seconde chance (flip three) !`);
                        }
                        else{
                            cartesAppliquer.push(c);
                        }
                    }
                    else{
                        cartesAppliquer.push(c);
                    }
                }
                i++;
                setTimeout(tirerSuivante, DELAI_CARTE/2);
            }, DELAI_CARTE);
        };
        /**
         * Résout les cartes spéciales reportées (Freeze, Flip Three, Seconde Chance en excès)
         * une par une après la fin des 3 tirages du Flip Three.
         */
        const appliquerEffets = () => {
            let id = 0;
            const appliquerUne = () => {
                if(id>=cartesAppliquer.length){
                    terminer();
                    return;
                }
                const c = cartesAppliquer[id];
                id++;
                this.idCourant = this.joueurs.indexOf(cible);
                this.traiterCarte(cible, c, () => {
                    this.idCourant = this.joueurs.indexOf(cible);
                    setTimeout(() => appliquerUne(), DELAI_CARTE);
                });
            };
            appliquerUne();
        };
        tirerSuivante();
    }
}
