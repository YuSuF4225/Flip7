
let game = null;
let listeIA = [];
let listeH = [];

//---------- NAVIGATION ----------//


/**
 * Affiche la page demandée et masque toutes les autres.
 */
function openPage(page){
    if(page==="principal-jeu"){
        jouerSon("manche");
    }
    else{
        jouerSon("bouton2");
    }
    document.querySelectorAll(".principal").forEach(x => x.classList.remove("actif"));
    document.getElementById(page).classList.add("actif");
}


//---------- GESTION DES JOUEURS DANS LOBBY ----------//

/**
 * Ajoute un joueur humain à la liste du lobby.
 * Valide le format du pseudo (commence par majuscule, lettres/chiffres/tirets, sans accents).
 * Refuse les doublons de pseudo.
 */
function ajouterH() {
    jouerSon("bouton5");
    const nom = document.getElementById("pseudo");
    const val = nom.value.trim();
    if(!val) return;
    if(!/^[A-Z](-?[a-z0-9]+)*$/.test(val)){
        alert("Pseudo invalide.\nDoit commencer par une majuscule, suivi de minsucules/chiffres (tirets autorisées).\nPas d'accents.");
        return;
    }
    if(listeH.map(o => o.pseudo).includes(val)){
        alert("Pseudo déjà pris !");
        return;
    }
    listeH.push({pseudo : val});
    nom.value = "";
    afficherListe();
}

/**
 * Ajoute une IA à la liste du lobby.
 * Le niveau (1 = simple, 2 = avancée) est lu depuis les boutons radio.
 * Le nom de l'IA est généré automatiquement (_Bot-N).
 */
function ajouterIA(){
    jouerSon("bouton5");
    let lvl = document.querySelector("input[name='IA']:checked").value;
    listeIA.push({nom: "_Bot-"+(listeIA.length+1), level: lvl==="facile" ? 1 : 2});
    afficherListe();
}


//Supprime un joueur (humain ou IA) de la liste du lobby.
function supprimerJoueur(type, id) {
    jouerSon("bouton1");
    if(type==="H") listeH.splice(id, 1);
    else listeIA.splice(id, 1);
    afficherListe();
}

/**
 * Re-génère l'affichage de la liste des joueurs configurés dans le lobby.
 * Chaque entrée affiche le nom, le type (humain/IA simple/IA avancée) et un bouton de suppression.
 */

function afficherListe() {
    const div = document.getElementById("liste-joueurs");
    div.innerHTML = "";
    listeH.forEach((j, i) => {
        div.innerHTML += `<div class="player">
            <span>${j.pseudo}</span>
            <span class="badge">Humain</span>
            <button class="rond" onclick="supprimerJoueur('H',${i})">✕</button>
            </div>`;
    });
    listeIA.forEach((j, i) => {
        div.innerHTML += `<div class="player">
            <span>${j.nom}</span>
            <span class="badge">${j.level===1 ? "IA Simple" : "IA Avancée"}</span>
            <button class="rond" onclick="supprimerJoueur('IA',${i})">✕</button>
            </div>`;
    });
}

//---------- DEMARRAGE / FIN DE PARTIE ----------//

/**
 * Lance la partie avec les joueurs configurés dans le lobby.
 * Vérifie qu'il y a au moins 3 joueurs.
 * Crée les objets Joueur / IA, initialise le Game, et démarre la première manche.
 */
function startGame(){
    if(listeH.length + listeIA.length < 3){
        alert("Il faut au moins 3 joueurs.");
        return;
    }
    const joueurs = [];
    listeH.forEach(j => joueurs.push(new Joueur(j.pseudo)));
    listeIA.forEach(j => joueurs.push(new IA(j.nom, j.level)));
    listeIA = [];
    listeH = [];
    document.getElementById("liste-joueurs").innerHTML = "";
    game = new Game(joueurs);
    document.getElementById("liste-joueurs").innerHTML = "";
    document.getElementById("actionsJeu").style.display = "flex";
    document.getElementById("bandeFin").style.display = "flex";
    document.getElementById("btn-remplacer").style.display = "flex";
    document.getElementById("btn-quitter").style.display = "flex";
    document.getElementById("zone-jeu").style.display = "flex";
    document.getElementById("bande-tour").style.display = "block";
    document.getElementById("Fin-Manche").style.display = "none";
    document.getElementById("Fin-Jeu").style.display = "none";
    openPage("principal-jeu");
    game.lancerManche();
}

/**
 * Quitte la partie en cours et retourne à l'accueil.
 * Demande confirmation si la partie n'est pas terminée.
 * Stoppe tous les sons.
 */
function quitterGame(){
    if(!game || game.termine){ 
        openPage("principal-accueil"); 
        return;
    }
    if(confirm("Quitter la partie ?")){
        Object.values(SONS).forEach(s => { s.pause(); s.currentTime = 0; });
        game = null;
        listeIA = [];
        listeH = [];
        document.getElementById("liste-joueurs").innerHTML = "";
        openPage("principal-accueil");
    }
}

/**
 * Remplace le joueur humain courant par une IA de niveau 1.
 * Transfère l'état complet du joueur (main, score, bonus…) à l'IA.
 * Lance immédiatement le tour de l'IA.
 */
function remplacerJoueur(){
    if(!game || game.termine){ 
        openPage("principal-accueil"); 
        return;
    }
    const j = game.manche.joueurCourant();
    if(!j || j instanceof IA) return;
    if(!confirm(`Remplacer ${j.pseudo} par une IA ?`)) return;
    jouerSon("ia");
    const ia  = new IA("_Bot-" + j.pseudo.toLowerCase(), 2);
    ia.total = j.total;
    ia.main = [...j.main];
    ia.score = j.score;
    ia.bonus = j.bonus;
    ia.double = j.double;
    ia.secondeChance = j.secondeChance;
    ia.status = j.status;
    const id= game.joueurs.indexOf(j);
    if(id!==-1) game.joueurs[id] = ia;
    render();
    Message(`${j.pseudo} remplacé(e) par une IA.`);
    game.manche.tourIA();
}

/**
 * Ferme le panneau de fin de manche et lance la manche suivante.
 * Réinitialise l'état de chaque joueur (mais pas le total cumulé).
 */
function closeManche(){
    jouerSon("manche");
    document.getElementById("Fin-Manche").style.display = "none";
    document.getElementById("resultats-manche").innerHTML = "";
    document.getElementById("actionsJeu").style.display = "flex";
    document.getElementById("btn-remplacer").style.display = "flex";
    document.getElementById("btn-quitter").style.display = "flex";
    document.getElementById("bandeFin").style.display = "flex";
    if(game && !game.termine){
        game.joueurs.forEach(j => j.reset());
        game.lancerManche();
    }
}

/**
 * Affiche le classement final de la partie (panneau Fin-Jeu).
 * Trie les joueurs par total décroissant.
 * Envoie les scores au serveur PHP via une requête POST pour les sauvegarder.
 */
function afficherResultats(){
    if(!game) return;
    document.getElementById("btn-quitter").style.display = "none";
    document.getElementById("bande-tour").style.display = "none";
    document.getElementById("zone-jeu").style.display = "none";
    document.getElementById("Fin-Manche").style.display = "none";
    let joueurs = [...game.joueurs].sort((a, b) => b.total - a.total);
    let html = "";
    joueurs.forEach((j,i) => {
        html += `<div class="classement ${i===0 ? "winner" : ""}">
        <span>${i+1}.</span>
        <span>${j.pseudo}</span>
        <span>${j.total} pts<span>
        </div>`;
    });
    document.getElementById("resultats-partie").innerHTML = html;
    jouerSon("result1");
    document.getElementById("Fin-Jeu").style.display = "flex"; 
    const xhttp = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
    xhttp.open("POST", "php/stats.php");
    xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    const data = game.joueurs.map(j => `${j.pseudo}=${j.total}`).join("&");
    xhttp.send(data);
}

//---------- AFFICHAGE ----------//

/**
 * Met à jour l'intégralité de l'interface de jeu selon l'état courant.
 * Appelé après chaque action (pioche, stop, fin de manche…).
 *
 * Génère :
 *  - La bande de tour (joueur actif)
 *  - Les cartes de tous les joueurs
 *  - Les statuts (en jeu / stop / éliminé)
 *  - Le panneau de choix d'effet (Freeze, Flip Three, Seconde Chance)
 */
function render(){
    if(!game || !game.manche) return;
    const manche = game.manche;
    document.getElementById("Fin-Manche").style.display = manche.mancheTerminee ? "flex" : "none";
    document.getElementById("Fin-Jeu").style.display = game.termine ? "flex" : "none";
    const joueur = game.manche.mancheTerminee ? null : game.manche.joueurCourant();
    const bande = document.getElementById("bande-tour");
    if(bande){
        bande.style.display = "block";
        document.getElementById("bande-texte").textContent = "Tour de : " + (joueur ? joueur.pseudo : "");
    }
    let html = `<div class="grille-joueurs">`;
    for(const j of game.joueurs){
        const isCourant = joueur && j===joueur;
        const status = manche.mancheTerminee ? (j.estElimine() ? "Eliminé" : "Terminé") : (j.estEnJeu() ? "En jeu" : (j.estReste() ? "Stop" : "Eliminé"));
        const couleur = j.estEnJeu() ? "status-enjeu" : (j.estReste() ? "status-reste" : "status-elimine");
        html += `
        <div class="joueur ${isCourant ? "actif" : ""}">
            <div class="header">
                <span class="pseudo">${j.pseudo}</span>
                ${game.joueurs.indexOf(j) === ((game.nbManche-1) % game.joueurs.length) ? "<span class='badge-donneur'>DONNEUR</span>" : ""}
                <span class="total">${j.total}</span>
            </div>
            <div class="cartes">
                ${j.main.map(c => c.carteToHtml()).join("")}
            </div>
            <div class="score">${j.scoreTotal()} pts</div>
            <div class="status ${couleur}">${status}</div>  
        </div>    
        `;
    }
    html += `</div>`;
    document.getElementById("joueurs").innerHTML = html;
    if(joueur) document.querySelector(".joueur.actif")?.scrollIntoView({behavior : "smooth", block : "center"});

    const btnAff = document.getElementById("btn-afficher-effet");
    const effet = document.getElementById("choix-effet");
    const data = game.manche.attenteChoisSecondeChance || game.manche.attenteChoisFreeze || game.manche.attenteChoisFlipThree;
    if(data){
        effet.style.display = "flex";
        btnAff.style.display = "none";
        let quelFonction = "";
        effet.innerHTML = `<div class="effet-cacher"><button id="toggle-effet">▼ Cacher</button></div>`;
        if(game.manche.attenteChoisSecondeChance){
            effet.innerHTML += "<h3>Donner la carte seconde chance :</h3>";
            quelFonction = "SecondeChance";
        }
        else if (game.manche.attenteChoisFreeze){
            effet.innerHTML += `<h3>Qui geler ? :</h3>`;
            quelFonction = "Freeze";
        }
        else if (game.manche.attenteChoisFlipThree){
            effet.innerHTML += `<h3>Qui doit tirer 3 cartes ? :</h3>`;
            quelFonction = "FlipThree";
        }
        data.cibles.forEach((j,i) => {
            effet.innerHTML += `<button onclick="game.manche.donner${quelFonction}(${i})">${j.pseudo}${j===joueur ? " (moi)" : ""}</button>`;
        });
        document.getElementById("toggle-effet")?.addEventListener("click", ()=>{
            effet.style.display = "none";
            btnAff.style.display = "block";
        })
    }
    else{
        effet.style.display = "none";
        btnAff.style.display = "none";
    }
    actionsBouton();
}

/**
 * Active ou désactive les boutons d'action (Piocher, Stop, Remplacer)
 * selon l'état courant de la manche et du joueur actif.
 * Les boutons sont désactivés si c'est le tour d'une IA, si la manche est terminée,
 * ou si une action spéciale est en attente de résolution.
 */
function actionsBouton(){
    if(!game || !game.manche) return;
    const j = game.manche.joueurCourant();
    const actif = j && j.type!=="ia" && j.estEnJeu() && !game.termine &&
                !game.manche.mancheTerminee && 
                !game.manche.bloquerActions &&
                !game.manche.attenteChoisSecondeChance &&
                !game.manche.attenteChoisFreeze &&
                !game.manche.attenteChoisFlipThree;
    document.getElementById("btn-piocher").disabled = !actif;
    document.getElementById("btn-reste").disabled = !actif;
    document.getElementById("btn-remplacer").disabled = !actif;
}

//---------- MESSAGE / NOTIFICATIONS ----------//

/**
 * Affiche un message de notification temporaire (2,5 secondes).
 * Le message précédent est remplacé si un nouveau arrive avant expiration.
 */
let msgTimer = null;
function Message(texte){
    const msg = document.getElementById("message");
    if(!msg) return;
    msg.style.display = "block";
    msg.textContent = texte;
    msg.classList.add("visible");
    //parler(texte);
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => {
        msg.classList.remove("visible");
        setTimeout(() => {
            msg.style.display = "none";
            msg.textContent = "";
        }, 300);
    }, 2500);
}

// synthese vocal - desactivé
function parler(texte){
    const msg = new SpeechSynthesisUtterance(texte);
    msg.lang = "fr-FR";
    msg.rate = 1;
    msg.pitch = 1;
    speechSynthesis.speak(msg);
}


//---------- DARK MODE ----------//

function darkmode(checkbox){
    const estCoche = checkbox.checked;
    document.body.classList.toggle("dark", estCoche);
    localStorage.setItem("darkmode", estCoche);
    jouerSon("dark");
}

function restaurerDarkmode() {
    const darkmodeActive = localStorage.getItem("darkmode") === "true";
    const checkbox = document.getElementById("cb-darkmode");
    if (checkbox) {
        checkbox.checked = darkmodeActive;
        
        document.body.classList.toggle("dark", darkmodeActive);
    }
}

document.addEventListener("keydown", function(e) {
        const Saisie=document.activeElement.tagName;
        if(Saisie==="INPUT"){
            return;
        }
        if (e.code === "KeyD") {  
            const darkActive =document.body.classList.toggle("dark");
            localStorage.setItem("darkmode", document.body.classList.contains("dark"));
             const checkbox = document.getElementById("cb-darkmode");
            if(checkbox){
                checkbox.checked=darkActive;
            }
            return;
        }
    });

//---------- SONS ----------//

// dictionnaires de tous les effets sonores du jeu
const SONS = {
    freeze : new Audio("sons/freeze.mp3"),
    secondechance : new Audio("sons/vie.mp3"),
    vieperdu : new Audio("sons/vieperdu.mp3"),
    piocher : new Audio("sons/carte.mp3"),
    piocher2 : new Audio("sons/carte2.mp3"),
    piocher3 : new Audio("sons/piocher3.mp3"),
    piocher4 : new Audio("sons/piocher4.mp3"),
    flipthree : new Audio("sons/cartethree.mp3"),
    bouton1 : new Audio("sons/bouton1.mp3"),
    bouton2 : new Audio("sons/bouton2.mp3"),
    bouton3 : new Audio("sons/bouton3.mp3"),
    bouton4 : new Audio("sons/bouton4.mp3"),
    menu1 : new Audio("sons/menu1.mp3"),
    elimine : new Audio("sons/elimine.mp3"),
    stop : new Audio("sons/stop.mp3"),
    plus1 : new Audio("sons/plus1.mp3"),
    plus2 : new Audio("sons/plus2.mp3"),
    flip7 : new Audio("sons/flip7.mp3"),
    dark : new Audio("sons/dark.mp3"),
    ia : new Audio("sons/ia.mp3"),
    manche : new Audio("sons/manche.mp3"),
    result1 : new Audio("sons/result1.mp3"),
    result2 : new Audio("sons/result2.mp3"),
    bouton5 : new Audio("sons/bouton5.mp3"),
};


// joue le son de cle "son" du tableau SONS
function jouerSon(son){
    const s = SONS[son];
    if(!s) return;
    s.currentTime = 0;
    s.play();
}

//---------- STATISTIQUES ----------//


//Récupère les statistiques des parties depuis le serveur PHP (GET sur stats.php)
//et les affiche dans la page Statistiques.
async function afficherStats(){
    const zone = document.getElementById("statistiques");
    zone.innerHTML = "Chargement...";
    try{
        const res = await fetch("php/stats.php");
        const data = await res.json();
        if(data.status!=="OK"){
            zone.innerHTML = "Erreur : " + data.message;
            return;
        }
        if(!data.data || !data.data.games){
            zone.innerHTML = "Aucune donnée";
            return;
        }
        zone.innerHTML = "";
        const recordDiv = document.createElement("div");
        recordDiv.className = "records";
        const maxScore = data.data.records?.maxScore ?? 0;
        recordDiv.innerHTML = `<div class="record">Score max : ${maxScore}</div>`;
        zone.appendChild(recordDiv);
        const games = [];
        let gameActuel = null;
        data.data.games.forEach(row => {
            if(!gameActuel || gameActuel.id !== row.gaID){
                gameActuel = { id : row.gaID, date : row.gaDateTime, joueurs : [] };
                games.push(gameActuel);
            }
            gameActuel.joueurs.push({ pseudo : row.scPseudo, score : row.scPoints });
        });
        for(const game of Object.values(games)){
            const bloc = document.createElement("div");
            bloc.className = "stat-bloc";
            let joueursHTML = "";
            game.joueurs.forEach(j => {
                joueursHTML += `<div class="ligne-stat">
                    <span>${j.pseudo}</span>
                    <span>${j.score}</span>
                    </div>`;
            });
            bloc.innerHTML = `<div class="stat-titre">
                Partie du ${new Date(game.date).toLocaleString('fr-FR')}</div>
                <div class="stat-joueurs">${joueursHTML}</div>`;
                zone.appendChild(bloc);
        }
    }
    catch(err){
        zone.innerHTML = "Erreur de chargement";
        console.error(err);
    }
}