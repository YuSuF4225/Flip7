document.addEventListener("DOMContentLoaded", () => {

    restaurerDarkmode();
    
    const vol = localStorage.getItem("volume") ?? "1";
    document.getElementById("volume").value = vol;
    Object.values(SONS).forEach(s => s.volume = vol);

    // PAGE ACCUEIL

    document.getElementById("btn-newgame")?.addEventListener("click", ()=>{
        openPage('principal-config');
    });

    document.getElementById('btn-accueil-stats')?.addEventListener("click", ()=>{
        openPage('principal-stats'); 
        afficherStats();
    });

    // PAGE CONFIG

    document.getElementById('btn-ajouter-h')?.addEventListener("click", ajouterH);

    document.getElementById('btn-ajouter-ia')?.addEventListener("click", ajouterIA);

    document.getElementById('cb-darkmode')?.addEventListener("change", function(){
        darkmode(this);
    });

    document.getElementById("btn-retour")?.addEventListener("click", function(){
        openPage('principal-accueil');
    });

    document.getElementById("btn-demarrer")?.addEventListener("click", startGame);

    // PAGE GAME

    document.getElementById("btn-piocher")?.addEventListener("click", ()=>{
        game.piocher();
    });

    document.getElementById("btn-reste")?.addEventListener("click", ()=>{
        game.rester();
    });

    document.getElementById("btn-quitter")?.addEventListener("click", quitterGame);

    document.getElementById("btn-remplacer")?.addEventListener("click", remplacerJoueur);

    document.getElementById("btn-suite")?.addEventListener("click", closeManche);

    document.getElementById("btn-resultats")?.addEventListener("click", afficherResultats);

    document.getElementById('btn-fin-jeu')?.addEventListener("click", ()=>{
        openPage('principal-accueil');
    });

    document.getElementById('btn-stats')?.addEventListener("click", ()=>{
        openPage('principal-accueil');
    });

    document.getElementById("volume")?.addEventListener("input", e => {
        Object.values(SONS).forEach(s => s.volume = e.target.value);
        localStorage.setItem("volume", e.target.value);
    });

    document.getElementById("btn-afficher-effet")?.addEventListener("click", () => {
        const effet = document.getElementById("choix-effet");
        const btn = document.getElementById("btn-afficher-effet");
        effet.style.display = "flex";
        btn.style.display = "none";
    });
})