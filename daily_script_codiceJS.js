// dopo aver scaricato (nell script) InformationPoint da Alexa Developer Console, richiedo (require) il file JSON
fs = require('fs');
const Request = require('sync-request');
// const today = new Date().toLocaleDateString();
// const myUrl = "https://www.unibo.it/UniboWeb/Utils/OrarioLezioni/RestService.aspx?SearchType=OccupazioneAule&Data="+today+"&Edificio=EST_EXZUCC1";
const myUrl = "https://www.unibo.it/UniboWeb/Utils/OrarioLezioni/RestService.aspx?SearchType=OccupazioneAule&Data=29/11/2019&Edificio=EST_EXZUCC1";

// qua mi salvo il file JSON
var myJson = JSON.parse(fs.readFileSync('./cartellaProvvisoria/InformationPoint/models/it-IT.json').toString());

const pathDestinations = myJson.interactionModel.dialog.intents[0].slots[1].validations[0].values;
const timeTableDestinations = [];
var timeTableDestinationsSlots = [];
const additionalDailyDestinations = [];

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

// [
//     {
//       "name": {
//         "value": "disabilità motoria"
//       }
//     },
//     {
//       "name": {
//         "value": "disabilità visiva"
//       }
//     }
// ]

const res = Request('GET', myUrl);
const body = res.getBody().toString('utf8');
body.split("<Evento>").forEach(item => {
    if (!item.includes("?xml")) {
        const elemDesc = item.split("<Descrizione>")[1].split("<")[0].toLowerCase();
        if (!elemDesc.includes("\"")) {
            addElement(elemDesc);
        }
        if (item.split("<Docente ")[1] != undefined) {
            const elemDoc = item.split("<Docente ")[1].split(">")[1].split("<")[0].toLowerCase();
            var arr = [];
            // pathDestinations.indexOf(elemDoc) === -1 ? (
                addElement(elemDoc),
                arr = elemDoc.split(" "),
                addElement(arr[arr.length - 1])
            // ): null;
        }
    }
});

function addElement(element) {
    pathDestinations.push(element);
    timeTableDestinations.push(element);
    if (additionalDailyDestinations.indexOf(element) === -1) {
        additionalDailyDestinations.push(element);
        timeTableDestinationsSlots.push(JSON.parse(`{\"name\": {\"value\": \"${element}\"}}`));
    }
}

// const lastElem = timeTableDestinationsSlots[timeTableDestinationsSlots.length - 1];
// lastElem = lastElem.substring(0, lastElem.length - 1);

// salvo i nuovi valori nel JSON scaricato
myJson.interactionModel.dialog.intents[0].slots[1].validations[0].values = pathDestinations;
myJson.interactionModel.dialog.intents[1].slots[0].validations[0].values = timeTableDestinations;
myJson.interactionModel.languageModel.types[2].values = timeTableDestinationsSlots; //.substring(0,(timeTableDestinationsSlots.length - 2)));

//qua riscrivo il file JSON con il nuovo file JSON (quello con i nuovi valori)
fs.writeFile('./cartellaProvvisoria/InformationPoint/models/it-IT.json', JSON.stringify(myJson, false, 2), function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
});

scriptText = scriptText + `\n# additionalDailyDestinations: ${additionalDailyDestinations}`;
fs.writeFile('./daily_script.txt', scriptText , function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
});

//dopo di che, lo script carica il nuovo file JSON sull'Alexa Developer Console e rimuove la cartella provvisoria 
