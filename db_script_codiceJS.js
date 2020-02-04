// dopo aver scaricato (nell script) InformationPoint da Alexa Developer Console, richiedo (require) il file JSON
fs = require('fs');
const MySyncModule = require('./syncConnectionToDB');
// const Location = require('./model/location');

// queste variabili e costanti servono solo per settare jsonOfTheMap
var needToUpdateJsonOfTheMap = true;
var mapJson;
const mapNodes = [];
const mapBeacons = [];
const mapEdges = [];
var nodeIndex = 1;
var beaconIndex = 1;
var edgeIndex = 1;
var previousBeaconLevel;
if (needToUpdateJsonOfTheMap) {
    mapJson = JSON.parse(fs.readFileSync('./jsonOfTheMap.json').toString());

    // per prima cosa aggiungo il nodo e il beacon relativi all'ingresso (e quindi alla torretta di Alexa), che purtroppo non è presente nel DB
    var destination = [];
    destination.push(`[\"ingresso principale\"]`);
    mapNodes.push(JSON.parse(`{\"id\": \"${nodeIndex}\",\"beacon\": \"${beaconIndex}\",\"type\": \"room\",\"name\": ${destination},\"degrees\": "0",\"info\": \"\"}`));
    mapBeacons.push(JSON.parse(`{\"id\": \"${beaconIndex}\", \"major\": \"3\"}`));
    nodeIndex = nodeIndex + 1;
    beaconIndex = beaconIndex +1;
    // poi ne aggiungo un altro per non avere come prima cosa le scale (percorso a destra)
    destination = [];
    destination.push(`[\"segreteria architettura\"]`);
    mapNodes.push(JSON.parse(`{\"id\": \"${nodeIndex}\",\"beacon\": \"${beaconIndex}\",\"type\": \"room\",\"name\": ${destination},\"degrees\": "90",\"info\": \"\"}`));
    mapBeacons.push(JSON.parse(`{\"id\": \"${beaconIndex}\", \"major\": \"3\"}`));
    // creo l'arco tra questi 2 nodi
    mapEdges.push(JSON.parse(`{\"id\": \"${edgeIndex}\",\"start\": \"${beaconIndex - 1}\",\"end\": \"${beaconIndex}\",\"type\": \"\",\"accessible\": \"true\",\"degrees\": \"90\"}`));
    previousBeaconLevel = 3;
    nodeIndex = nodeIndex + 1;
    beaconIndex = beaconIndex +1;
    edgeIndex = edgeIndex + 1;
}

// qua mi salvo il file JSON
var myJson = JSON.parse(fs.readFileSync('./cartellaProvvisoria/InformationPoint/models/it-IT.json').toString());

// qua setto i nuovi valori nel file JSON
const destinations = MySyncModule.executeSyncQuery("SELECT Nome, Descrizione, Posti FROM informazioni", (error, result) => {
    if (error) {
        throw error;
    }
    const locations = [];
    result.forEach(item => {
        var name = item.Nome;
        var description = item.Descrizione;
        var roomNumeber = null;
        var level;
        var floor;
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
        // locs.push(new Location(name, description, roomNumeber, level, floor, seats));
        // la riga sopra diventa:
        // new Location(name, description, roomNumeber, level, floor, seats);
        // tolgo gli spazi prima di un nome
        
        if (name.startsWith(" ")) {
            name = name.substring(1);
        }

        // se è un professore (allora nella descrizione è presente la parola "Ufficio")
        if (description.includes("Ufficio")) {
            // se sono più nomi di professori, li divido per salvarli singolarmente e poi salvo il cognome da solo
            if(name.includes(",")) {
                name.split(",").forEach(n => {
                    addName(n, locations, "");
                });
            } else {
                // se invece è un unico professore, salvo anche il cognome
                addName(name, locations, "");
            }
        } else if (name.includes("laboratorio") && name.includes(".")) {
            // se è il nome di un Laboratorio che contiene anche un numero (=> contiene "."), salvo anche "laboratorio numero"
            addName(name, locations, "laboratorio ");
        } else {
            // tutti gli altri nomi vengno salvati così come sono
            locations.push(name);
        }

        // salvo anche i numeri delle stanze
        if (roomNumeber != null) {
            locations.push(`stanza ${roomNumeber}`);
            if (needToUpdateJsonOfTheMap) {
                const destination = [];
                // destination.push(JSON.parse(`{\"${name}\"}`));
                // destination.push(JSON.parse(`{\"stanza ${roomNumeber}\"}`));
                destination.push(`[\"${name}\"`);
                // destination.push(`\"prova\"]`);
                destination.push(`\"stanza ${roomNumeber}\"]`);
                addNodeAndBeacon(destination, level);
            }
        } else {
            if (needToUpdateJsonOfTheMap) {
                const destination = [];
                destination.push(`[\"${name}\"]`);
                // destination.push(name);
                addNodeAndBeacon(destination, level);
            }
        }
    });
    return locations;
});

function addName(name, loc, partOfTheName) {
    if (name.startsWith(" ")) {
        name = name.substring(1);
    }
    loc.push(name);
    const arr = name.split(" ");
    loc.push(partOfTheName + "" + arr[arr.length - 1]);
}

function addNodeAndBeacon(destination, level) {
    const random = Math.floor(Math.random() * 4);
    const degrees = (random === 0) ? 0 : (random === 1) ? 90 : (random === 2) ? 180 : 270;
    mapNodes.push(JSON.parse(`{\"id\": \"${nodeIndex}\",\"beacon\": \"${beaconIndex}\",\"type\": \"room\",\"name\": ${destination},\"degrees\": "${degrees}",\"info\": \"\"}`));
    mapBeacons.push(JSON.parse(`{\"id\": \"${beaconIndex}\", \"major\": \"${level}\"}`));
    // se i beacons sono a livelli diversi, metto una scala e un ascensore
    if (previousBeaconLevel != level && previousBeaconLevel != null && level != null) {
        mapEdges.push(JSON.parse(`{\"id\": \"${edgeIndex}\",\"start\": \"${beaconIndex - 1}\",\"end\": \"${beaconIndex}\",\"type\": \"elevator\",\"accessible\": \"true\",\"degrees\": \"${degrees}\"}`));
        edgeIndex = edgeIndex + 1;
        mapEdges.push(JSON.parse(`{\"id\": \"${edgeIndex}\",\"start\": \"${beaconIndex - 1}\",\"end\": \"${beaconIndex}\",\"type\": \"stairs\",\"accessible\": \"false\",\"degrees\": \"${degrees}\"}`));
    } else {
        mapEdges.push(JSON.parse(`{\"id\": \"${edgeIndex}\",\"start\": \"${beaconIndex - 1}\",\"end\": \"${beaconIndex}\",\"type\": \"\",\"accessible\": \"true\",\"degrees\": \"${degrees}\"}`));
    }
    edgeIndex = edgeIndex + 1;
    previousBeaconLevel = level;
    nodeIndex = nodeIndex + 1;
    beaconIndex = beaconIndex +1;
}

// salvo i nuovi valori nel JSON scaricato
myJson.interactionModel.dialog.intents[0].slots[1].validations[0].values = destinations;

//qua riscrivo il file JSON con il nuovo file JSON (quello con i nuovi valori)
fs.writeFile('./cartellaProvvisoria/InformationPoint/models/it-IT.json', JSON.stringify(myJson, false, 2), function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
});

if (needToUpdateJsonOfTheMap) {
    mapJson.buildings[0].beacons = mapBeacons;
    mapJson.buildings[0].nodes = mapNodes;
    mapJson.buildings[0].arcs = mapEdges;
    fs.writeFile('./jsonOfTheMap.json', JSON.stringify(mapJson, false, 2), function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file has been saved!");
    });
}

//dopo di che, lo script carica il nuovo file JSON sull'Alexa Developer Console e rimuove la cartella provvisoria 
