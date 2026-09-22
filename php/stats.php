<?php

// la réponse HTTP sera un objet JSON
header('Content-Type: application/json; charset=utf-8');

define ('BD_NAME', 'statsWeb3_bd');
define ('BD_USER', 'statsWeb3_user');
define ('BD_PASS', 'statsWeb3_passe');
define ('BD_SERVER', 'mariadb-hostname');

$conn = bdConnect();

if (count($_POST) > 1) {
    // vérification des données
    foreach($_POST as $key => $value) {
        if (!preg_match('/^_?[A-Z](-?[a-z0-9]+)*$/u', $key)) {
            sendResponseAndExit(false, "Le format du pseudo n'est pas correct ($key)");
        }
        if (!preg_match('/^[0-9]+$/u', $value)) {
            sendResponseAndExit(false, "Le score de $key n'est pas une valeur numérique valide ($value)");
        }
    }
    // creation de la nouvelle partie (numéro auto + timestamp par défaut)
    $sql = 'INSERT INTO game values ()';
    bdSendRequest($conn, $sql, 'Erreur lors de l\'enregistrement de la partie');
    $game = mysqli_insert_id($conn);
    $sql = 'INSERT INTO score VALUES ';
    $nb = 0;
    foreach($_POST as $pseudo => $score) {
        $pseudo = mysqli_real_escape_string($conn, $pseudo);
        $sql .= ($nb > 0 ? ',' : '') . "($game,'$pseudo',$score)";
        ++$nb;
    }
    bdSendRequest($conn, $sql, 'Erreur lors de l\'enregistrement des scores');
    sendResponseAndExit(true, "ID de la partie ajoutée : $game");
}
else if($_SERVER['REQUEST_METHOD'] === 'POST'){
    sendResponseAndExit(false, 'Le nombre de joueurs ne peut pas être égal à 1.');
}
else if($_SERVER['REQUEST_METHOD'] !== 'GET'){
    sendResponseAndExit(false, 'Requête non valide.');
}

// Script appelé avec une commande HTTP GET.
// => calcul puis envoi des statistiques

// TODO : à compléter / modifier pour obtenir plus de statistiques 

/*
$sql = '(SELECT "max_points" as type, scPseudo as pseudo, scPoints as value 
        FROM score 
        WHERE scPoints >= ALL(SELECT scPoints FROM score) LIMIT 1)
        UNION 
        (SELECT "nbgames" as type, null as pseudo, COUNT(*) as value 
        FROM game)';
*/
$sql = "SELECT g.gaID, g.gaDateTime, s.scPseudo, s.scPoints
    FROM game AS g
    JOIN score AS s ON g.gaID = s.scGame
    ORDER BY g.gaDateTime DESC, s.scPoints DESC";

$sqlRecord = "SELECT MAX(scPoints) AS maxScore FROM score"; 

$data = array();
$res = bdSendRequest($conn, $sql, 'Erreur dans la récupération des données');
while ($tab = mysqli_fetch_assoc($res)) {
    $data["games"][] = $tab;
}
mysqli_free_result($res);
$res2 = bdSendRequest($conn, $sqlRecord, 'Erreur record');
$data["records"] = mysqli_fetch_assoc($res2);
mysqli_free_result($res2);
sendResponseAndExit(true, $data);

//____________________________________________________________________________
/**
 * Envoie la réponse sous forme d'un objet JSON et termine le script.
 * 
 * @param bool          $succes     true si la réquête a réussi, false sinon
 * @param string|array  $data       résultat(s) ou message d'erreur
 * 
 * @return void
 */
function sendResponseAndExit(bool $succes, string|array $data) : void {
    global $conn; // null si bdConnect() échoue
    if (isset($conn)){
        mysqli_close($conn);
    }
    echo json_encode(array('status' => ($succes ? 'OK' : 'KO'), ($succes ? 'data' : 'message') => $data));
    exit();
}

//____________________________________________________________________________
/**
 * Invoquée lors de la levée d'une exception liée à la connexion au SGBD, ou à l'envoi d'une requête SQL.
 * Envoie un message d'erreur et termine le script.
 * 
 * @param string                $err    chaine décrivant l'erreur
 * @param mysqli_sql_exception  $e      exception attrapée
 * 
 * @return void
 */
function bdSendErrorAndExit(string $err, mysqli_sql_exception $e) : void {
    sendResponseAndExit(false, "$err. Code : {$e->getCode()}. {$e->getMessage()}");
}

//____________________________________________________________________________
/**
 * Ouverture de la connexion à la base de données en gérant les erreurs.
 *
 * En cas d'erreur, une réponse avec un status KO est envoyée ET le script est arrêté.
 *
 * @return mysqli  objet connecteur à la base de données
 */
function bdConnect(): mysqli {
    // pour forcer la levée de l'exception mysqli_sql_exception
    // si la connexion échoue
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    try{
        $conn = mysqli_connect(BD_SERVER, BD_USER, BD_PASS, BD_NAME);
    }
    catch(mysqli_sql_exception $e){
        bdSendErrorAndExit('Erreur de connexion avec la base de données', $e);
    }
    try{
        //mysqli_set_charset() définit le jeu de caractères par défaut à utiliser lors de l'envoi
        //de données depuis et vers le serveur de bases de données.
        mysqli_set_charset($conn, 'utf8');
        
    }
    catch(mysqli_sql_exception $e){
        mysqli_close($conn);
        bdSendErrorAndExit('Erreur de paramétrage de la base de données', $e);
    }
    return $conn;
}

//____________________________________________________________________________
/**
 * Envoie une requête SQL au serveur de BdD en gérant les erreurs.
 *
 * En cas d'erreur, une réponse avec un status KO est envoyée et le
 * script est arrêté. Si l'envoi de la requête réussit, cette fonction renvoie :
 *      - un objet de type mysqli_result dans le cas d'une requête SELECT
 *      - true dans le cas d'une requête INSERT, DELETE ou UPDATE
 *
 * @param   mysqli              $bd     Objet connecteur sur la base de données
 * @param   string              $sql    Requête SQL
 * @param   string              $err    Message d'erreur si l'envoi de la requête échoue
 *
 * @return  mysqli_result|bool          Résultat de la requête
 */
function bdSendRequest(mysqli $bd, string $sql, string $err): mysqli_result|bool {
    try{
        $r = mysqli_query($bd, $sql);
    }
    catch(mysqli_sql_exception $e){
        bdSendErrorAndExit($err, $e);
    }
    return $r;
}



