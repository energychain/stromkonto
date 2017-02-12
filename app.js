/************
StromDAO - Stromkonto
------------------------------------------------------------------------------
Das Stromkonto ist ein auf die Ethereum-Blockchain basierendes Energiekonto
für Stromkunden. Dieser Beispielcode zeigt die generelle Verwendung und 
Einbindung in andere Webprojekte.
 
Autor: Thorsten Zoerner <thorsten.zoerner@stromdao.de>
https://stromdao.de/stromkonto 
 ************/

/*
 renderUI() - wird aufgerufen nach dem "Document-Ready" Event und sollte
 mindestens die E-Wallet initialisieren und die Verträge (Smart Contracts) 
 laden.
*/ 
function renderUI() {
	
	console.log("Ethereum Address:",dao.address); // nach dem forceLogin() ist die Adresse bekannt und das Stromkonto nutzbar
	
	// Nach dem Init kann die Adresse überschrieben werden!
	
	// dao.address='0x277CB0DdA6746b5B87F8c817758344b3987850f6'; // Beispiel
	
	// Kontonummer aus dem Request Parameter lesen
	if(typeof $_GET["a"] != "undefined") {
		dao.address=$_GET["a"];
	}
	
	/*
		Implementierung einer Portal/Kunden spezifischen Anzeige
	*/
	
	//Zeige die Kontonummer als innerHTML bei allen Elementen der Klasse .kontonummer
	stromkonto.ui.showKontonummer('.kontonummer'); 
	
	// Zeige Soll, Haben, Saldo des Stromkonto
	stromkonto.ui.showBalance('.soll','.haben','.saldo');
	
    // Zeige die letzten Transaktionen in einer Tabelle mit dem Offset von 0
	stromkonto.ui.showLastTXTable('#transaktionen',0);
}


$(document).ready(function() {dao.app.forceLogin(renderUI);});