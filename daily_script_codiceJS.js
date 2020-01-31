// dopo aver scaricato (nell script) InformationPoint da Alexa Developer Console, richiedo (require) il file JSON
fs = require('fs');
const Request = require('sync-request');
// const today = new Date().toLocaleDateString();
// const myUrl = "https://www.unibo.it/UniboWeb/Utils/OrarioLezioni/RestService.aspx?SearchType=OccupazioneAule&Data="+today+"&Edificio=EST_EXZUCC1";
const myUrl = "https://www.unibo.it/UniboWeb/Utils/OrarioLezioni/RestService.aspx?SearchType=OccupazioneAule&Data=29/11/2019&Edificio=EST_EXZUCC1";

// qua mi salvo il file JSON
var myJson = JSON.parse(fs.readFileSync('./cartellaProvvisoria/InformationPoint/models/it-IT.json').toString());

const pathDestinations = myJson.interactionModel.dialog.intents[0].slots[1].validations[0].values;
const pathDestinationsSlots = [];
const timeTableDestinations = [];
const timeTableDestinationsSlots = [];

var scriptText = fs.readFileSync('./daily_script.txt').toString();
if (scriptText.split("# additionalDailyDestinations: ")[1] != undefined) {
    scriptText.split("# additionalDailyDestinations: ")[1].split(",").forEach(p => {
        const index = pathDestinations.indexOf(p);
        if (index > -1) {
            pathDestinations.splice(index, 1);
        }
    });
    scriptText = scriptText.substring(0, scriptText.lastIndexOf("\n"));
}

const res = Request('GET', myUrl);
const body = res.getBody().toString('utf8');

body.split("<Evento>").forEach(item => {
    if (!item.includes("?xml")) {
        var elemDesc = item.split("<Descrizione>")[1].split("<")[0].toLowerCase();
        if (elemDesc.includes("lm")) {
            // /.../gi -> Perform a global (g) and case-insensitive (i) replacement (altrimenti sarebbe solo g)
            elemDesc = elemDesc.replace(/lm/gi,'');
            // addElement(elemDesc);
        }
        if (elemDesc.includes("ii")) {
            elemDesc = elemDesc.replace(/ii/gi,'');
            // addElement(elemDesc);
        }
        // nel caso in cui ci fossero le virgolette, voglio salvarmi anche il nome all'interno delle virgolette da solo
        if (elemDesc.includes("\"")) {
            const justName = elemDesc.split("\"")[1].split("\"")[0];
            addElement(justName);
            elemDesc = elemDesc.replace(/\"/gi,'');
            // addElement(elemDesc);
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
    if (timeTableDestinations.indexOf(element) === -1) {
        pathDestinations.push(element);
        timeTableDestinations.push(element);
        timeTableDestinationsSlots.push(JSON.parse(`{\"name\": {\"value\": \"${element}\"}}`));
    }
}

// per avere i cognomi dei prof come sinonimi (nel caso di pathDestinationsSlots dovrei fare:
// pathDestinationsSlots.forEach(e => if (elem.includes(e) {allora aggiungo e come sinonimo de elem}))
// function addElement(element) {
//     element = removeSpaces(element);
//     if (timeTableDestinations.indexOf(element) === -1) {
//         pathDestinations.push(element);
//         timeTableDestinations.push(element);
//         timeTableDestinationsSlots.push(JSON.parse(`{\"name\": {\"value\": \"${element}\"}}`));
//         pathDestinationsSlots.push(JSON.parse(`{\"name\": {\"value\": \"${element}\"}}`));
//     }
// }

// function addElementAndSynonyms(element, synonym) {
//     element = removeSpaces(element);
//     synonym = removeSpaces(synonym);
//     if (timeTableDestinations.indexOf(element) === -1) {
//         pathDestinations.push(element);
//         timeTableDestinations.push(element);
//         timeTableDestinationsSlots.push(JSON.parse(`{\"name\": {\"value\": \"${element}\",\"synonyms\": [\"morigi\"]}}`));
//         pathDestinationsSlots.push(JSON.parse(`{\"name\": {\"value\": \"${element}\",\"synonyms\": [\"morigi\"]}}`));
//     }
// }

function removeSpaces(element) {
    if (element.startsWith(" ") || element.startsWith("-")) {
        element = removeSpaces(element.substring(1));
    }
    if (element.endsWith(" ") || element.endsWith("-")) {
        element = removeSpaces(element.substring(0, element.length - 1));
    }
    return element;
}

// var ff = true;
pathDestinations.forEach(elem => {
    if (pathDestinationsSlots.indexOf(elem) === -1) {
        pathDestinationsSlots.push(JSON.parse(`{\"name\": {\"value\": \"${elem}\"}}`));
    } else {
        console.log("duplicato: " + elem);
    }
    // if (ff) {
    //     console.log(elem);
    //     console.log(pathDestinationsSlots[0]);
    //     console.log(timeTableDestinationsSlots[0]);
    //     ff = false;
    // }
});

// salvo i nuovi valori nel JSON scaricato
myJson.interactionModel.dialog.intents[0].slots[1].validations[0].values = pathDestinations;
// console.log("pathDestinations: " + pathDestinations.length);
myJson.interactionModel.languageModel.types[0].values = pathDestinationsSlots;
// console.log("pathDestinationsSlots: " + pathDestinationsSlots.length);
myJson.interactionModel.dialog.intents[1].slots[0].validations[0].values = timeTableDestinations;
// console.log("timeTableDestinations: " + timeTableDestinations.length);
myJson.interactionModel.languageModel.types[2].values = timeTableDestinationsSlots;
// console.log("timeTableDestinationsSlots: " + timeTableDestinationsSlots.length);

//qua riscrivo il file JSON con il nuovo file JSON (quello con i nuovi valori)
fs.writeFile('./cartellaProvvisoria/InformationPoint/models/it-IT.json', JSON.stringify(myJson, false, 2), function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file has been saved!");
});

scriptText = scriptText + `\n# additionalDailyDestinations: ${timeTableDestinations}`;
fs.writeFile('./daily_script.txt', scriptText , function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file has been saved!");
});

//dopo di che, lo script carica il nuovo file JSON sull'Alexa Developer Console e rimuove la cartella provvisoria 
