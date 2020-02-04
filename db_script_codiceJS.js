// dopo aver scaricato (nell script) InformationPoint da Alexa Developer Console, richiedo (require) il file JSON
fs = require('fs');
const MySyncModule = require('./syncConnectionToDB');
const Location = require('./model/location');
const JsonMap = require('./jsonMap');

const locations = [];

// qua mi salvo il file JSON
var myJson = JSON.parse(fs.readFileSync('./cartellaProvvisoria/InformationPoint/models/it-IT.json').toString());

// qua setto i nuovi valori nel file JSON
const destinations = MySyncModule.executeSyncQuery("SELECT Nome, Descrizione, Posti FROM informazioni", (error, result) => {
    if (error) {
        throw error;
    }
    const dests = [];
    result.forEach(item => {
        var name = item.Nome;
        var description = item.Descrizione;
        var roomNumeber = null;
        var level;
        var floor;
        var random = Math.floor(Math.random() * 4);
        const block = (random === 0) ? 'A' : (random === 1) ? 'B' : (random === 2) ? 'C' : 'D';
        var seats = item.Posti;
        if (item.Nome.includes("-")) {
            name = item.Nome.split("-")[1];
            if (item.Nome.startsWith("Stanza")) {
                roomNumeber = item.Nome.split(" ")[1];
            } else {
                roomNumeber = item.Nome.split("-")[0].split(" ")[0];
            }
            switch(roomNumeber.substring(0, 1)) {
                case '1':
                    level = 1;
                    floor = 'piano interrato';
                    break;
                case '2':
                    level = 2;
                    floor = 'piano terra';
                    break;
                case '3':
                    level = 3;
                    floor = 'primo piano';
                    break;
                case '4':
                    level = 4;
                    floor = 'secondo piano';
                    break;
            }
        }
        if (typeof level === "undefined") {
            if (description.includes("piano interrato")) {
                level = 1;
                floor = 'piano interrato';
            } else if (description.includes("piano terra")) {
                level = 2;
                floor = 'piano terra';
            } else if (description.includes("primo piano")) {
                level = 3;
                floor = 'primo piano';
            } else if (description.includes("secondo piano")) {
                level = 4;
                floor = 'secondo piano';
            } else {
                level = null;
                floor = null;
            }
        }
        name = name.toLowerCase();
        // tolgo gli spazi prima di un nome
        if (name.startsWith(" ")) {
            name = name.substring(1);
        }
        locations.push(new Location(name, description, roomNumeber, level, floor, block, seats));


        // se è un professore (allora nella descrizione è presente la parola "Ufficio")
        if (description.includes("Ufficio")) {
            // se sono più nomi di professori, li divido per salvarli singolarmente e poi salvo il cognome da solo
            if(name.includes(",")) {
                name.split(",").forEach(n => {
                    addName(n, dests, "");
                });
            } else {
                // se invece è un unico professore, salvo anche il cognome
                addName(name, dests, "");
            }
        } else if (name.includes("laboratorio") && name.includes(".")) {
            // se è il nome di un Laboratorio che contiene anche un numero (=> contiene "."), salvo anche "laboratorio numero"
            addName(name, dests, "laboratorio ");
        } else {
            // tutti gli altri nomi vengno salvati così come sono
            dests.push(name);
        }

        // salvo anche i numeri delle stanze
        if (roomNumeber != null) {
            dests.push(`stanza ${roomNumeber}`);
        }
    });
    return dests;
});

function addName(name, loc, partOfTheName) {
    if (name.startsWith(" ")) {
        name = name.substring(1);
    }
    loc.push(name);
    const arr = name.split(" ");
    loc.push(partOfTheName + "" + arr[arr.length - 1]);
}

// salvo i nuovi valori nel JSON scaricato
myJson.interactionModel.dialog.intents[0].slots[1].validations[0].values = destinations;
// lo faccio qui in quanto destinations deve essere "pronta"
new JsonMap(locations).build();


//qua riscrivo il file JSON con il nuovo file JSON (quello con i nuovi valori)
fs.writeFile('./cartellaProvvisoria/InformationPoint/models/it-IT.json', JSON.stringify(myJson, false, 2), function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file has been saved!");
});

//dopo di che, lo script carica il nuovo file JSON sull'Alexa Developer Console e rimuove la cartella provvisoria 
