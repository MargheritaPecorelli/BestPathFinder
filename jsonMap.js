class JsonMap {

    mapJson = JSON.parse(fs.readFileSync('./jsonOfTheMap.json').toString());

    mapNodes = [];
    mapBeacons = [];
    mapEdges = [];
    nodeIndex = 1;
    beaconIndex = 1;
    edgeIndex = 1;
    previousBeaconLevel;
        
    constructor(locations) {
        this.myLocations = locations;
    }

    build() {
        // per prima cosa aggiungo il nodo e il beacon relativi all'ingresso (e quindi alla torretta di Alexa), che purtroppo non è presente nel DB
        var destination = [];
        const alexaLevel = 3;
        destination.push(`[\"ingresso principale\"]`);
        this.mapNodes.push(JSON.parse(`{\"id\": \"${this.nodeIndex}\",\"beacon\": \"${this.beaconIndex}\",\"type\": \"room\",\"name\": ${destination},\"degrees\": "0",\"info\": \"\"}`));
        this.mapBeacons.push(JSON.parse(`{\"id\": \"${this.beaconIndex}\", \"level\": \"${alexaLevel}\", \"floor\": \"primo piano\", \"block\": \"A\", \"information\": \"si trova all'ingresso di via università\"}`));
        this.nodeIndex = this.nodeIndex + 1;
        this.beaconIndex = this.beaconIndex +1;

        // poi ne aggiungo un altro per non avere come prima cosa le scale (percorso a destra) -> non necessario quando ci sarà il vero DB
        destination = [];
        destination.push(`[\"segreteria architettura\"]`);
        this.mapNodes.push(JSON.parse(`{\"id\": \"${this.nodeIndex}\",\"beacon\": \"${this.beaconIndex}\",\"type\": \"room\",\"name\": ${destination},\"degrees\": "90",\"info\": \"\"}`));
        this.mapBeacons.push(JSON.parse(`{\"id\": \"${this.beaconIndex}\", \"level\": \"${alexaLevel}\", \"floor\": \"primo piano\", \"block\": \"A\", \"information\": \"\"}`));

        // creo l'arco tra questi 2 nodi -> non necessario quando non farà il secondo nodo
        this.mapEdges.push(JSON.parse(`{\"id\": \"${this.edgeIndex}\",\"start\": \"${this.beaconIndex - 1}\",\"end\": \"${this.beaconIndex}\",\"type\": \"\",\"accessible\": \"true\",\"degrees\": \"90\"}`));
        this.previousBeaconLevel = alexaLevel;
        this.nodeIndex = this.nodeIndex + 1;
        this.beaconIndex = this.beaconIndex +1;
        this.edgeIndex = this.edgeIndex + 1;

        // this.myLocations.array.forEach(element => {
        this.myLocations.forEach(location => {
            const nodeName = [];
            var start = `[\"${location.name()}\"]`;
            var ufficio;
            var room;

            if (location.roomNumber() != null) {
                room = `\"stanza ${location.roomNumber()}\"`;
            }

            if (location.description().includes("Ufficio")) {
                ufficio = `\"ufficio di ${location.name()}\"]`;
            }

            if (ufficio === undefined && room === undefined) {
                nodeName.push(start);
            } else {
                start = start.substring(0, start.length - 1);
                nodeName.push(start);
                if (room === undefined) {
                    nodeName.push(ufficio);
                } else if (ufficio === undefined) {
                    room = room + `]`;
                    nodeName.push(room);
                } else {
                    nodeName.push(room);
                    nodeName.push(ufficio);
                }
            }

            this.addNodeAndBeacon(nodeName, location.level(), location.floor(), location.block());
        });

        this.mapJson.buildings[0].beacons = this.mapBeacons;
        this.mapJson.buildings[0].nodes = this.mapNodes;
        this.mapJson.buildings[0].arcs = this.mapEdges;

        fs.writeFile('./jsonOfTheMap.json', JSON.stringify(this.mapJson, false, 2), function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The jsonOfTheMap.json has been saved!");
        });
    }

    addNodeAndBeacon(destination, level, floor, block) {
        var random = Math.floor(Math.random() * 4);
        var degrees = (random === 0) ? 0 : (random === 1) ? 90 : (random === 2) ? 180 : 270;
        this.mapNodes.push(JSON.parse(`{\"id\": \"${this.nodeIndex}\",\"beacon\": \"${this.beaconIndex}\",\"type\": \"room\",\"name\": ${destination},\"degrees\": \"${degrees}\",\"info\": \"\"}`));
        this.mapBeacons.push(JSON.parse(`{\"id\": \"${this.beaconIndex}\", \"level\": \"${level}\", \"floor\": \"${floor}\", \"block\": \"${block}\", \"information\": \"\"}`));

        // se i beacons sono a livelli diversi, metto una scala e un ascensore
        if (this.previousBeaconLevel != level && this.previousBeaconLevel != null && level != null) {
            this.mapEdges.push(JSON.parse(`{\"id\": \"${this.edgeIndex}\",\"start\": \"${this.beaconIndex - 1}\",\"end\": \"${this.beaconIndex}\",\"type\": \"elevator\",\"accessible\": \"true\",\"degrees\": \"${degrees}\"}`));
            this.edgeIndex = this.edgeIndex + 1;
            this.mapEdges.push(JSON.parse(`{\"id\": \"${this.edgeIndex}\",\"start\": \"${this.beaconIndex - 1}\",\"end\": \"${this.beaconIndex}\",\"type\": \"stairs\",\"accessible\": \"false\",\"degrees\": \"${degrees}\"}`));
        } else {
            this.mapEdges.push(JSON.parse(`{\"id\": \"${this.edgeIndex}\",\"start\": \"${this.beaconIndex - 1}\",\"end\": \"${this.beaconIndex}\",\"type\": \"\",\"accessible\": \"true\",\"degrees\": \"${degrees}\"}`));
        }

        this.previousBeaconLevel = level;
        this.edgeIndex = this.edgeIndex + 1;
        this.nodeIndex = this.nodeIndex + 1;
        this.beaconIndex = this.beaconIndex +1;
    }

    static getLocations() {
        return this.myLocations;
    }
}

 module.exports = JsonMap;
