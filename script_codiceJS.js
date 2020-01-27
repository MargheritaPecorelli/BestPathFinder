// dopo aver scaricato (nell script) InformationPoint da Alexa Developer Console, richiedo (require) il file JSON
var myJson = require('./cartellaProvvisoria/InformationPoint/models/it-IT.json');
fs = require('fs');

console.log('valore attuale: ');
console.log(myJson.interactionModel.dialog.intents[0].slots[1].validations[0].values);

// qua mi salvo il file JSON
var m = JSON.parse(fs.readFileSync('./cartellaProvvisoria/InformationPoint/models/it-IT.json').toString());

//qua setto i nuovi valori nel file JSON
m.interactionModel.dialog.intents[0].slots[1].validations[0].values = ['prova7', 'prova9'];

console.log('valore nuovo: ');
console.log(m.interactionModel.dialog.intents[0].slots[1].validations[0].values);

//qua riscrivo il file JSON con il nuovo file JSON (quello con i nuovi valori)
fs.writeFile('./cartellaProvvisoria/InformationPoint/models/it-IT.json', JSON.stringify(m, false, 2), function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
});

//dopo di che, lo script carica il nuovo file JSON sull'Alexa Developer Console e rimuove la cartella provvisoria 
