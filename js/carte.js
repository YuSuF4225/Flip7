
// Constantes des types de cartes spéciales
// 13 = +2 ; 14 = +4 ; 15 = +6 ; 16 = +8 ; 17 = +10
// 18 = *2
// 19 = freeze ; 20 = flibthree ; 21 = chance
const MODIF_MIN = 13;
const MODIF_MAX = 17;
const DOUBLE = 18;
const FREEZE = 19;
const FLIPTHREE = 20;
const CHANCE = 21;

const DELAI_CARTE = 950;
const DELAI_IA = 1100;

// Classe Carte
// Représente une carte unique du jeu
class Carte {
    
    // val : valeur numérique de la carte
    constructor(val){
        this.val = val;
    }

    // retourne le label affiché de la carte
    label(){
        if(this.val===0) return "0";
        else if(this.val<=12) return String(this.val);
        else if(this.val>=MODIF_MIN && this.val<=MODIF_MAX) return "+" + (this.val-12)*2;
        else if(this.val===DOUBLE) return "x2";
        else if(this.val===FREEZE) return "GEL";
        else if(this.val===FLIPTHREE) return "x3";
        else if(this.val===CHANCE) return "2° chance";
    }

    // Méthode de test des types de carte
    isNumero() { return this.val>=0 && this.val<=12; }
    isModifier() { return this.val>=MODIF_MIN && this.val<=MODIF_MAX; }
    isDouble() { return this.val===DOUBLE; }
    isFreeze() { return this.val===FREEZE; }
    isFlipThree() { return this.val===FLIPTHREE; }
    isChance() { return this.val===CHANCE; }

    // retourne la valeur de bonus apporté par une carte modificateur
    bonusVal() { return this.isModifier() ? (this.val-12)*2 : 0; }

    // Génère le HTML visuel de la carte pour l'afficher dans l'interface
    // Chaque type de carte a son propre rendu CSS
    carteToHtml(){
        if(this.isNumero()){
            const nomsNumeros = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE'];
            const nom = nomsNumeros[this.val];
            const htlm = `<div class="contour-carte">
                            <div class="carte carte-numero n${this.val}">
                                <div class="cadre-interieur"></div>    
                                <div class="titre-press">PRESS YOUR LUCK</div>
                                <div class="arcs">
                                    <div class="arc arc-haut"></div>
                                    <div class="arc arc-bas"></div>
                                    <div class="arc arc-gauche"></div>
                                    <div class="arc arc-droit"></div>
                                </div>
                                <div class="chiffre">${this.val}</div>
                                <div class="ruban-numero">${nom}</div>
                            </div>
                        </div>`;
            return htlm;
        }
        if(this.isModifier() || this.isDouble()){
            let label = "";
            let desc = "";
            if(this.isModifier()){
                const valModif = (this.val-12)*2;
                label = `+${valModif}`;
                desc = `${label} THE SUM OF YOUR NUMBER CARDS`;
            }
            else{
                label = "x2";
                desc = "x2 THE SUM OF YOUR NUMBER CARDS";
            }
            const html = `<div class="contour-carte">
                            <div class="carte carte-modificateur">
                                <div class="cadre-interieur"></div>    
                                <div class="texte-descriptif texte-haut">${desc}</div>
                                <div class="etiquette-modif">${label}</div>
                                <div class="texte-descriptif texte-bas">${desc}</div>
                            </div>
                        </div>`;
            return html;
        }
        if(this.isFreeze()){
            return `<div class="contour-carte">    
                        <div class="carte carte-gel">
                            <div class="cadre-interieur"></div>   
                            <div class="badge-instant badge-hg">
                                <span>INSTANT</span><span>ACTION</span>
                            </div>
                            <div class="cadenas cadenas-hg">
                                <div class="cadenas-corps"></div>
                                <div class="cadenas-anneau"></div>
                                <div class="cadenas-trou"></div>
                            </div>
                            <div class="contenu-action">
                                <div class="texte-action">PLAY ON<br>AN ACTIVE PLAYER</div>
                                <div class="ruban-action">FREEZE</div>
                                <div class="texte-action">PLAY ON<br>AN ACTIVE PLAYER</div>
                            </div>
                            <div class="badge-instant badge-bd">
                                <span>INSTANT</span><span>ACTION</span>
                            </div>
                            <div class="cadenas cadenas-bd">
                                <div class="cadenas-corps"></div>
                                <div class="cadenas-anneau"></div>
                                <div class="cadenas-trou"></div>
                            </div>
                        </div>
                    </div>`;
        }
        if(this.isFlipThree()){
            return `<div class="contour-carte">    
                        <div class="carte carte-flipthree">
                            <div class="cadre-interieur"></div>
                            <div class="badge-instant badge-hg">
                                <span>INSTANT</span><span>ACTION</span>
                            </div>
                            <div class="eventail eventail-hg">
                                <div class="carte-eventail"></div>
                                <div class="carte-eventail"></div>
                                <div class="carte-eventail"></div>
                            </div>
                            <div class="contenu-action">
                                <div class="texte-action">PLAY ON<br>AN ACTIVE PLAYER</div>
                                <div class="ruban-action">FLIP<br>THREE</div>
                                <div class="texte-action">PLAY ON<br>AN ACTIVE PLAYER</div>
                            </div>
                            <div class="badge-instant badge-bd">
                                <span>INSTANT</span><span>ACTION</span>
                            </div>
                            <div class="eventail eventail-bd">
                                <div class="carte-eventail"></div>
                                <div class="carte-eventail"></div>
                                <div class="carte-eventail"></div>
                            </div>
                        </div>
                    </div>`;
        }
        if(this.isChance()){
            return `<div class="contour-carte">    
                        <div class="carte carte-secondechance">
                            <div class="cadre-interieur"></div>   
                            <div class="coeur coeur-hg">
                                <div class="forme-coeur"></div>
                            </div>
                            <div class="contenu-action">
                                <div class="texte-action">SAVE THIS CARD<br>UNTIL NEEDED</div>
                                <div class="ruban-action">SECOND<br>CHANCE</div>
                                <div class="texte-action">SAVE THIS CARD<br>UNTIL NEEDED</div>
                            </div>
                            <div class="coeur coeur-bd">
                                <div class="forme-coeur"></div>
                            </div>
                        </div>
                    </div>`;
        }
    }
};


// Classe Deck
// représente la paquet de carte (pioche + mélange)
class Deck {

    // Crée un deck. Si la partie a plus de 18 joueurs, on double le deck
    constructor(nbJoueurs){
        this.cartes = this.init();
        if(nbJoueurs >= 18) this.cartes = this.cartes.concat(this.init());
        this.melanger(); //a enlever le jours de la démo
    }

    // Initialise un deck standard
    init(){
        let deck = [];
        deck.push(new Carte(0));
        for(let j=1; j<=12; j++){
            for(let i=0; i<j; i++){
                deck.push(new Carte(j));
            }
        }
        for(let j=MODIF_MIN; j<=DOUBLE; j++) deck.push(new Carte(j));
        for(let i=0; i<3; i++){
            deck.push(new Carte(FREEZE));
            deck.push(new Carte(FLIPTHREE));
            deck.push(new Carte(CHANCE));
        }
        return deck;
    }

    // Tire une carte aléatoire du deck
    // si le deck est vide, il est reconstitué à partir de la defausse et mélangé
    piocher(defausse){
        if(this.cartes.length===0){
            this.cartes = defausse.splice(0);
            this.melanger();
        }
        const i = Math.floor(Math.random() * this.cartes.length);
        return this.cartes.splice(i, 1)[0];
    }

    // mélange le deck
    melanger(){
        for(let i=this.cartes.length-1; i>0; i--){
            const j = Math.floor(Math.random() * (i+1));
            [this.cartes[i], this.cartes[j]] = [this.cartes[j], this.cartes[i]];
        }
    }
};


