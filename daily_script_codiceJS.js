// dopo aver scaricato (nell script) InformationPoint da Alexa Developer Console, richiedo (require) il file JSON
fs = require('fs');

const urlConn = require('./urlConnection');
// const Request = require('sync-request');
// const today = new Date().toLocaleDateString();
// const myUrl = "https://www.unibo.it/UniboWeb/Utils/OrarioLezioni/RestService.aspx?SearchType=OccupazioneAule&Data="+today+"&Edificio=EST_EXZUCC1";
// const myUrl = "https://www.unibo.it/UniboWeb/Utils/OrarioLezioni/RestService.aspx?SearchType=OccupazioneAule&Data=29/11/2019&Edificio=EST_EXZUCC1";

// qua mi salvo il file JSON
var myJson = JSON.parse(fs.readFileSync('./cartellaProvvisoria/InformationPoint/models/it-IT.json').toString());

const pathDestinationsSlots = myJson.interactionModel.languageModel.types[0].values;
const timeTableDestinations = [];
const timeTableDestinationsSlots = [];

var scriptText = fs.readFileSync('./daily_script.sh').toString();
if (scriptText.split("# additionalDailyDestinations: ")[1] != undefined) {
    scriptText.split("# additionalDailyDestinations: ")[1].split(",").forEach(p => {
        const index = pathDestinationsSlots.indexOf(`{\"name\": {\"value\": \"${p}\"}}`);
        if (index > -1) {
            // partendo dalla posizione index, tolgo 1 elemento (lo faccio perché era un elemento relativo al giorno scorso - ieri - e quindi non mi serve più)
            pathDestinationsSlots.splice(index, 1);
        }
    });
    scriptText = scriptText.substring(0, scriptText.lastIndexOf("\n"));
}

// const res = Request('GET', myUrl);
// const body = res.getBody().toString('utf8');
const body = urlConn.getBody();

body.split("<Evento>").forEach(item => {
    if (!item.includes("?xml")) {
        var elemDesc = item.split("<Descrizione>")[1].split("<")[0].toLowerCase();
        if (elemDesc.includes("lm")) {
            // /.../gi -> Perform a global (g) and case-insensitive (i) replacement (altrimenti sarebbe solo g)
            elemDesc = elemDesc.replace(/lm/gi,'');
        }
        if (elemDesc.includes("ii")) {
            elemDesc = elemDesc.replace(/ii/gi,'');
        }
        // nel caso in cui ci fossero le virgolette, voglio salvarmi anche il nome all'interno delle virgolette da solo
        if (elemDesc.includes("\"")) {
            const justName = elemDesc.split("\"")[1].split("\"")[0];
            addElement(justName);
            elemDesc = elemDesc.replace(/\"/gi,'');
        }
        addElement(elemDesc);
        // oltre all'elemento completo, inserisco anche: solo la prima parte di "-" o di "("
        if (elemDesc.includes("-") && !(elemDesc.endsWith("-"))) {
            elemDesc = elemDesc.split("-")[0];
            addElement(elemDesc);
        }
        if (elemDesc.includes("(")) {
            elemDesc = elemDesc.split("(")[0];
            addElement(elemDesc);
        }
        if (item.split("<Docente ")[1] != undefined) {
            const elemDoc = item.split("<Docente ")[1].split(">")[1].split("<")[0].toLowerCase();
            addElement(elemDoc);
            const arr = elemDoc.split(" ");
            addElement(arr[arr.length - 1]);
        }
    }
});

function addElement(element) {
    element = removeSpaces(element);
    // if -> per evitare che ci siano doppioni
    if (timeTableDestinations.indexOf(element) === -1) {
        timeTableDestinations.push(element);
        timeTableDestinationsSlots.push(JSON.parse(`{\"name\": {\"value\": \"${element}\"}}`));
    }
    if (pathDestinationsSlots.indexOf(`{\"name\": {\"value\": \"${element}\"}}`) === -1) {
        pathDestinationsSlots.push(JSON.parse(`{\"name\": {\"value\": \"${element}\"}}`));
    }
}

function removeSpaces(element) {
    if (element.startsWith(" ") || element.startsWith("-")) {
        element = removeSpaces(element.substring(1));
    }
    if (element.endsWith(" ") || element.endsWith("-")) {
        element = removeSpaces(element.substring(0, element.length - 1));
    }
    return element;
}

// salvo i nuovi valori nel JSON scaricato
myJson.interactionModel.languageModel.types[0].values = pathDestinationsSlots;
myJson.interactionModel.languageModel.types[2].values = timeTableDestinationsSlots;

//qua riscrivo il file JSON con il nuovo file JSON (quello con i nuovi valori)
fs.writeFile('./cartellaProvvisoria/InformationPoint/models/it-IT.json', JSON.stringify(myJson, false, 2), function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The JSON of Alexa developer conole has been saved from daily script!");
});

scriptText = scriptText + `\n# additionalDailyDestinations: ${timeTableDestinations}`;
fs.writeFile('./daily_script.sh', scriptText , function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The daily script has been updated for the next time!");
});

//dopo di che, lo script carica il nuovo file JSON sull'Alexa Developer Console e rimuove la cartella provvisoria 
