
class Game {
    constructor(joueurs){
        this.joueurs = joueurs;
        this.deck = new Deck(this.joueurs.length);
        this.defausse = [];
        this.manche = null;
        this.termine = false;
        this.nbManche = 0;
    }

    /**
     * Demande à la manche en cours de traiter une action "piocher" pour le joueur humain actif.
     * Plusieurs gardes sont vérifiées avant de déléguer à Manche :
     *  - La partie ne doit pas être terminée
     *  - Aucune action spéciale n'est en attente de résolution
     *  - Le joueur courant doit être humain et encore en jeu
     */
    piocher(){
        if(!this.manche || this.termine) return;
        if(this.manche.bloquerActions || this.manche.attenteChoisFlipThree) return;
        if(this.manche.attenteChoisFreeze || this.manche.attenteChoisSecondeChance) return;
        const j = this.manche.joueurCourant();
        if(!j || j instanceof IA || !j.estEnJeu()) return;
        this.manche.piocher();
    }

    /**
     * Demande à la manche en cours de traiter une action "rester" pour le joueur humain actif.
     * Mêmes gardes que piocher().
     */
    rester(){ 
        if(!this.manche || this.termine) return;
        if(this.manche.bloquerActions || this.manche.attenteChoisFlipThree) return;
        if(this.manche.attenteChoisFreeze || this.manche.attenteChoisSecondeChance) return;
        const j = this.manche.joueurCourant();
        if(!j || j instanceof IA || !j.estEnJeu()) return;
        this.manche.rester();
    }

    /**
     * Lance une nouvelle manche.
     * Le donneur tourne à chaque manche (ordre circulaire) :
     * le premier joueur à jouer est celui qui suit le donneur.
     */
    lancerManche(){
        const idDonneur = this.nbManche % this.joueurs.length;
        this.nbManche++;
        this.manche = new Manche(this);
        this.manche.idCourant = (idDonneur + 1) % this.joueurs.length;
        this.manche.demarrer();
    }

    /**
     * Vérifie si la condition de fin de partie est atteinte
     * (au moins un joueur a cumulé 200 points ou plus).
     */

    checkFin(){
        if(!this.joueurs.some(j => j.total>=200)) return false;
        this.termine = true;
        return true;
    }

    /**
     * Affiche le récapitulatif de fin de manche dans l'interface.
     * Met à jour le DOM avec les résultats (score de chaque joueur, survie/élimination).
     * Si la condition de fin de partie est atteinte, affiche le bouton "VOIR LES RESULTATS"
     * à la place du bouton "SUITE".
     */
    showManche(resultats){
        document.getElementById("bande-tour").style.display = "none";
        const divResultats = document.getElementById("resultats-manche");
        if(divResultats){
            let html = "<div class='resultats'>";
            for(const r of resultats){
                const status = r.survie ? "ok" : "ko";
                html += `<div class="ligne-resultat ${status}">
                <span class="col-pseudo">${r.joueur.pseudo}</span>
                <span class="col-score">${r.score} pts</span>
                <span class="col-total">Total : ${r.total}</span>
                </div>`;
            }
            html += "</div>";
            divResultats.innerHTML = html;
        }
        document.getElementById("Fin-Manche").style.display = "flex";
        document.getElementById("actionsJeu").style.display = "none";
        document.getElementById("btn-remplacer").style.display = "none";
        if(this.checkFin()){
            document.getElementById("bandeFin").style.display = "none";
            document.querySelector("#Fin-Manche button").style.display = "none";
            document.getElementById("btn-resultats").style.display = "block";
        }
    }


}
