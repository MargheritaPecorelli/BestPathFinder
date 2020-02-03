/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
const Request = require('sync-request');
const stringSimilarity = require('string-similarity');
const fs = require('fs');
const BeaconMap = require('./BeaconMap');

// const today = new Date().toLocaleDateString();
// const myUrl = "https://www.unibo.it/UniboWeb/Utils/OrarioLezioni/RestService.aspx?SearchType=OccupazioneAule&Data="+today+"&Edificio=EST_EXZUCC1";
const myUrl = "https://www.unibo.it/UniboWeb/Utils/OrarioLezioni/RestService.aspx?SearchType=OccupazioneAule&Data=29/11/2019&Edificio=EST_EXZUCC1";

// startBeaconID è sempre quello della torretta di Alexa
var startBeaconID;
const mapJson = JSON.parse(fs.readFileSync('./jsonOfTheMap.json').toString());
mapJson.buildings[0].nodes.forEach(node => {
  if (node.name[0] === "ingresso principale") {
    startBeaconID = node.beacon; 
  }
});

const right = "gira a destra";
const left = "gira a sinistra";
const straight = "vai dritto";
const back = "torna indietro";
const stairs = "sali le scale";

// =======================================================================================================================================================================

// tempor("laboratorio 2.2");
// tempor("stanza 2003");

const GetNewFactHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechOutput = 'Benvenuto nel Campus di Cesena! Cosa posso fare per te?';
    console.log(speechOutput);    
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .getResponse();
  },
};

const StartedPathFinderHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === "IntentRequest"
      && request.intent.name === "PathFinderIntent"
      && request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .addDelegateDirective()
      .getResponse();
  }
}

const CompletedPathFinderHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === "IntentRequest"
      && request.intent.name === "PathFinderIntent"
      && request.dialogState === 'COMPLETED';
  },
  handle(handlerInput) {
    const destination = handlerInput.requestEnvelope.request.intent.slots.destination.value;
    const disability = handlerInput.requestEnvelope.request.intent.slots.disability.value;
    var speechOutput = `Mi dispiace, ma non capisco`;

    const beaconsList = mapJson.buildings[0].beacons;
    const edges = mapJson.buildings[0].arcs;
  
    const beaconMap = new BeaconMap(beaconsList, edges);
    
    var finishBeacon;
    mapJson.buildings[0].nodes.forEach(node => {
      if ((destination.includes("laboratorio")) && (destination.includes("."))) {
        const labNumber = destination.split(" ")[1];
        if ((node.name[0].includes("laboratorio")) && (node.name[0].includes(labNumber))) {
          finishBeacon = node.beacon;
        }
      } else if ((node.name[0] === destination) || (node.name[1] === destination) || (node.name[0].includes(destination))) {
        finishBeacon = node.beacon;
      }
    });
    if (finishBeacon != undefined) {
      speechOutput = "";
      
      const path = beaconMap.getPath(startBeaconID, finishBeacon);  
      const indications = getRemainingDirections(path.edges);
  
      var previousIndication;
      indications.forEach(indication => {
        // if (previousIndication === undefined || indication === stairs) {
        if (previousIndication === undefined) {
          speechOutput = speechOutput + indication;
        } else if (!(indication === straight && previousIndication === straight)) {
          speechOutput = speechOutput + " poi " + indication;
        }
        previousIndication = indication;
      });
    }
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .getResponse();
  }
}

// function tempor(destination) {
//   var speechOutput = `Mi dispiace, ma non capisco`;
//   const beaconsList = mapJson.buildings[0].beacons;
//   const edges = mapJson.buildings[0].arcs;

//   const beaconMap = new BeaconMap(beaconsList, edges);
  
//   var finishBeacon;
//   mapJson.buildings[0].nodes.forEach(node => {
//     if ((destination.includes("laboratorio")) && (destination.includes("."))) {
//       const labNumber = destination.split(" ")[1];
//       if ((node.name[0].includes("laboratorio")) && (node.name[0].includes(labNumber))) {
//         finishBeacon = node.beacon;
//       }
//     } else if ((node.name[0] === destination) || (node.name[1] === destination) || (node.name[0].includes(destination))) {
//       finishBeacon = node.beacon;
//     }
//   });

//   if (finishBeacon != undefined) {
//     speechOutput = "";
    
//     const path = beaconMap.getPath(startBeaconID, finishBeacon);
//     // path.beacons.forEach(beacon => speechOutput = speechOutput + "beacon: " + beacon.id + "\n");
//     // path.edges.forEach(edge => speechOutput = speechOutput + "edge: " + edge.id + "\n");
//     // speechOutput = speechOutput + "length (3*edges): " + path.length + "\n";

//     const indications = getRemainingDirections(path.edges);

//     var previousIndication;
//     indications.forEach(indication => {
//       // if (previousIndication === undefined || indication === stairs) {
//       if (previousIndication === undefined) {
//         speechOutput = speechOutput + indication;
//       } else if (!(indication === straight && previousIndication === straight)) {
//         speechOutput = speechOutput + " poi " + indication;
//       }
//       previousIndication = indication;
//     });
//   }
//   console.log(speechOutput);
// }

// funzione simile a quella di Giacomo Mambelli (mandata per email)
function getRemainingDirections(edges) {
  var previousEdge;
  const indications = [];
  edges.forEach(edge => {
    if (previousEdge === undefined) {
      // il primo è undefined
      // sto ipotizzando che la torretta di Alexa sia sotto gli schermi che ci sono all'ingresso di via dell'università 50,
      // quindi se si guarda verso la torretta, si sta guardando a nord (circa) secondo Google Maps
      // if (edge.degrees >= 0 && edge.degrees < 90) {
      //   indications.push(`dirigiti verso est, ovvero ${right},`);
      // } else if (edge.degrees >= 90 && edge.degrees < 180) {
      //   indications.push(`dirigiti verso sud, ovvero ${back},`);
      // } else if (edge.degrees >= 180 && edge.degrees < 270) {
      //   indications.push(`dirigiti verso ovest, ovvero ${left},`);
      // } else if (edge.degrees >= 270 && edge.degrees < 360) {
      //   indications.push(`dirigiti verso nord, ovvero supera la torretta e ${straight},`);
      // }
      if (edge.degrees === '0') {
        indications.push(`dirigiti verso nord, ovvero supera la torretta e ${straight},`);
      } else if (edge.degrees === '90') {        
        indications.push(`dirigiti verso est, ovvero ${right},`);
      } else if (edge.degrees === '180') {
        indications.push(`dirigiti verso sud, ovvero ${back},`);
      } else if (edge.degrees === '270') {
        indications.push(`dirigiti verso ovest, ovvero ${left},`);
      } 
    } else if(previousEdge.degrees === edge.degrees) {
      // hanno gli stessi gradi rispetto al nord => sono nella stessa direzione
      indications.push(straight);
    } else if(((parseInt(previousEdge.degrees) + 90) % 360) === parseInt(edge.degrees)) {
      // se c'è una differenza di esattamente 90°, allora devo girare a destra
      indications.push(right);
    } else if(((parseInt(previousEdge.degrees) + 270) % 360) === parseInt(edge.degrees)) {
      // se c'è una differenza di esattamente 270°, allora devo girare a sinistra
      indications.push(left);
    } else if(((parseInt(previousEdge.degrees) + 180) % 360) === parseInt(edge.degrees)) {
      // se c'è una differenza di esattamente 180°, allora devo tornare indietro (altrimenti devo finire le scale => non dico nulla)
      if(!(previousEdge.type == "stairs" && edge.type == "stairs")) {
        indications.push(back);
      }
    }
    // se sono delle scale, glielo dico (così l'informazione è più precisa)
    if (edge.type == "stairs") {
      indications.push(stairs);
    }

    previousEdge = edge;
  });

  indications.push("sei arrivato!")
  return indications;
}

const TimeTableHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === "IntentRequest"
      && request.intent.name === "TimeTableIntent";
  },
  handle(handlerInput) {
    const placeOrEvent = handlerInput.requestEnvelope.request.intent.slots.placeOrEvent.value.toLowerCase();
    
    if (placeOrEvent != undefined) {
      var speechOutput = "Non capisco, mi dispiace!";
      const res = Request('GET', myUrl);
      const body = res.getBody().toString('utf8');
      var informations = [];
      
      informations = getInformations(body, placeOrEvent);
  
      if (!informations[0]) {
        const similarDest = [];
        body.split("<Evento>").forEach(item => {
          if (!item.includes("?xml")) {
            var dest = item.split("<Descrizione>")[1].split("<")[0].toLowerCase();
            if(dest.includes(placeOrEvent)) {
              similarDest.push(dest);
            }
          }
        });

        if (similarDest.length != 0) {
          var indexOfBestMatch = 0;
          if (similarDest.length > 1) {
            const matches = stringSimilarity.findBestMatch(placeOrEvent, similarDest);
            indexOfBestMatch = matches.bestMatchIndex;
          }
          informations = getInformations(body, similarDest[indexOfBestMatch]);
        }
      }    
  
      if (informations[0]) {
        speechOutput = `${placeOrEvent} si trova a ${informations[3]}, inizia alle ${informations[1]} e finisce alle ${informations[2]}`;
      }
    }

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .getResponse();
  }
}

function getInformations(body, destination) {
  const informations = [];
  var start;
  var finish;
  var place;
  var found = false;

  body.split("<Evento>").forEach(item => {
    if (!item.includes("?xml")) {
      const dest = item.split("<Descrizione>")[1].split("<")[0].toLowerCase();
      if (destination === dest) {
        found = true;
        informations.push(found);
        start = item.split("<OraInizio>")[1].split("<")[0];
        informations.push(start);
        finish = item.split("<OraFine>")[1].split("<")[0];
        informations.push(finish);
        place = item.split("<Descrizione>")[2].split("<")[0].toLowerCase();
        informations.push(place);
      } else if (item.split("<Docente ")[1] != undefined) {
        const prof = item.split("<Docente ")[1].split(">")[1].split("<")[0].toLowerCase();
        const arr = prof.split(" ");
        const profSurname = arr[arr.length - 1];
        if (destination === prof || destination === profSurname) {
          found = true;
          informations.push(found);
          start = item.split("<OraInizio>")[1].split("<")[0];
          informations.push(start);
          finish = item.split("<OraFine>")[1].split("<")[0];
          informations.push(finish);
          place = item.split("<Descrizione>")[2].split("<")[0].toLowerCase();
          informations.push(place);
        }
      }        
    }
  });
  return informations;
}

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Goodbye!')
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder
    .speak(`Sorry, an error occurred (Session ended): ${handlerInput.requestEnvelope.request.reason}`)
    .reprompt(`Sorry, an error occurred (Session ended): ${handlerInput.requestEnvelope.request.reason}`)
    .getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    return handlerInput.responseBuilder
      // .speak(`Sorry, an error occurred: ${error.message}`)
      .reprompt(`Sorry, an error occurred (Error handled): ${error.message}`)
      .speak(`Sorry, an error occurred (Error handled): ${handlerInput.requestEnvelope.request.intent}`)
      // .reprompt(`Sorry, an error occurred: ${handlerInput.requestEnvelope.request.intent.slots.destination.value}`)
      .getResponse();
  },
};

const HELP_MESSAGE = 'You can say tell me a space fact, or, you can say exit... What can I help you with?';
const HELP_REPROMPT = 'What can I help you with?';

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    GetNewFactHandler,
    StartedPathFinderHandler,
    CompletedPathFinderHandler,
    TimeTableHandler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
