const Alexa = require('ask-sdk');
const Request = require('sync-request');
const stringSimilarity = require('string-similarity');
const fs = require('fs');
const BeaconMap = require('./BeaconMap');
const mapJson = JSON.parse(fs.readFileSync('./jsonOfTheMap.json').toString());


// const today = new Date().toLocaleDateString();
// const myUrl = "https://www.unibo.it/UniboWeb/Utils/OrarioLezioni/RestService.aspx?SearchType=OccupazioneAule&Data="+today+"&Edificio=EST_EXZUCC1";
const myUrl = "https://www.unibo.it/UniboWeb/Utils/OrarioLezioni/RestService.aspx?SearchType=OccupazioneAule&Data=29/11/2019&Edificio=EST_EXZUCC1";

// startBeaconID è sempre quello della torretta di Alexa
var startBeaconID;
mapJson.buildings[0].nodes.forEach(node => {
  if (node.name[0] === "ingresso principale") {
    startBeaconID = node.beacon; 
  }
});

const right = "gira a destra, poi";
const left = "gira a sinistra, poi";
const straight = "vai dritto";
const back = "torna indietro";
const stairs = "prendi le scale";
const elevator = "prendi l'ascensore";

// =======================================================================================================================================================================

// tempor("casina dell'acqua", "no", "percorso breve");
// console.log("==================================");
// tempor("laboratorio 2,2", "no", "percorso breve");
// tempor("stanza 2003", "visiva", "");
// tempor("stanza 2003", "no", "");
// tempor("stanza 2003", "motoria", "");
// tempor("viroli", "motoria", "percorso dettagliato");
// tempor("aula 2.11", "no", "");
// tempor("aula 2.1", "motoria", "");
// tempor("aula 2.13", "no", "");

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
      .reprompt(speechOutput)
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
    const pathDetailedOrNot = handlerInput.requestEnvelope.request.intent.slots.pathDetailedOrNot.value;
    var speechOutput = `Mi dispiace, ma non ho trovato nulla`;

    const beaconsList = mapJson.buildings[0].beacons;
    const edges = mapJson.buildings[0].arcs;
    const nodes = mapJson.buildings[0].nodes;

    var finishBeaconID;
    nodes.forEach(node => {
      if ((destination.includes("laboratorio")) && (destination.includes(","))) {
        const labNumber = destination.split(" ")[1];
        if ((node.name[0].includes("laboratorio")) && (node.name[0].includes(labNumber))) {
          finishBeaconID = node.beacon;
        }
      } else if ((node.name[0] === destination) || (node.name[1] === destination)) {
        finishBeaconID = node.beacon;
      }
    });

    // se finishBeacon è undefined, vuol dire che non l'ho trovato, allora provo a vedere se destination è inclusa in qualche nodo.
    // non l'ho fatto prima in quanto con destination = aula 2.1, mi tornava aula 2.13, perché prima di verificare node.name[0] === destination
    // verificava node.name[0].includes(destination).
    if (finishBeaconID === undefined) {
      nodes.forEach(node => {
        if (node.name[0].includes(destination)) {
          finishBeaconID = node.beacon;
        }
      });
    }

    if (finishBeaconID != undefined) {
      if (pathDetailedOrNot.includes("percorso dettagliato") || pathDetailedOrNot.includes("percorso breve")) {
        speechOutput = "";

        var beaconMap;
        if (disability.includes('motoria')) {
          beaconMap = new BeaconMap(beaconsList, edges, true);
        } else {
          if (disability.includes('visiva')) {
            speechOutput = "Forse sarebbe meglio che scaricassi l'app per cellulare. Detto questo, "
          }
          beaconMap = new BeaconMap(beaconsList, edges);
        }
        const path = beaconMap.getPath(startBeaconID, finishBeaconID);

        if (pathDetailedOrNot.includes("percorso breve")) {
          const indications = getShortDirections(path.edges, path.beacons);
          indications.forEach(indication => {
            speechOutput = speechOutput + indication;
          });
        } else {
          const indications = getRemainingDirections(path.edges, path.beacons, nodes);
          var previousIndication;
          indications.forEach(indication => {
            // se l'indicazione precedente era quella di andare dritto e anche quella di adesso è quella di andare dritto, allora voglio solo l'ultima
            if (previousIndication != undefined && !indication.includes(right) && !indication.includes(left) && indication.includes(straight)) {
              const lastElem = speechOutput.split("fino ").pop();
              speechOutput = speechOutput.substring(0,(speechOutput.length - lastElem.length));
              const elemToPush = indication.split("fino ").pop();
              speechOutput = speechOutput + elemToPush;
            } else {
              speechOutput = speechOutput + indication;
            }
            previousIndication = indication;
          });
        }
      } else {
        const level = beaconsList.find(beacon => beacon.id === finishBeaconID).level;
        const floor = beaconsList.find(beacon => beacon.id === finishBeaconID).floor;
        const block = beaconsList.find(beacon => beacon.id === finishBeaconID).block;
        const information = beaconsList.find(beacon => beacon.id === finishBeaconID).information;
        speechOutput = `${destination} si trova al livello ${level}, al ${floor}, nel blocco ${block}.`;
        if (information != undefined) {
          speechOutput = speechOutput + information;
        }
      }
    }
    
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  }
}

// function tempor(destination, disability, pathDetailedOrNot) {
//   var speechOutput = `Mi dispiace, ma non ho trovato nulla`;
  
//   const beaconsList = mapJson.buildings[0].beacons;
//   const edges = mapJson.buildings[0].arcs;
//   const nodes = mapJson.buildings[0].nodes;

//   var finishBeaconID;
//   nodes.forEach(node => {
//     if ((destination.includes("laboratorio")) && (destination.includes(","))) {
//       const labNumber = destination.split(" ")[1];
//       if ((node.name[0].includes("laboratorio")) && (node.name[0].includes(labNumber))) {
//         finishBeaconID = node.beacon;
//       }
//     } else if ((node.name[0] === destination) || (node.name[1] === destination)) {
//       finishBeaconID = node.beacon;
//     }
//   });

//   // se finishBeacon è undefined, vuol dire che non l'ho trovato, allora provo a vedere se destination è inclusa in qualche nodo.
//   // non l'ho fatto prima in quanto con destination = aula 2.1, mi tornava aula 2.13, perché prima di verificare node.name[0] === destination
//   // verificava node.name[0].includes(destination).
//   if (finishBeaconID === undefined) {
//     nodes.forEach(node => {
//       if (node.name[0].includes(destination)) {
//         finishBeaconID = node.beacon;
//       }
//     });
//   }

//   if (finishBeaconID != undefined) {
//     if (pathDetailedOrNot.includes("percorso dettagliato") || pathDetailedOrNot.includes("percorso breve")) {
//       speechOutput = "";

//       var beaconMap;
//       if (disability.includes('motoria')) {
//         beaconMap = new BeaconMap(beaconsList, edges, true);
//       } else {
//         if (disability.includes('visiva')) {
//           speechOutput = "Forse sarebbe meglio che scaricassi l'app per cellulare. Detto questo, "
//         }
//         beaconMap = new BeaconMap(beaconsList, edges);
//       }
//       const path = beaconMap.getPath(startBeaconID, finishBeaconID);

//       if (pathDetailedOrNot.includes("percorso breve")) {
//         const indications = getShortDirections(path.edges, path.beacons);
//         indications.forEach(indication => {
//           speechOutput = speechOutput + indication;
//         });
//       } else {
//         const indications = getRemainingDirections(path.edges, path.beacons, nodes);
//         var previousIndication;
//         indications.forEach(indication => {
//           // se l'indicazione precedente era quella di andare dritto e anche quella di adesso è quella di andare dritto, allora voglio solo l'ultima
//           if (previousIndication != undefined && !indication.includes(right) && !indication.includes(left) && indication.includes(straight)) {
//             const lastElem = speechOutput.split("fino ").pop();
//             speechOutput = speechOutput.substring(0,(speechOutput.length - lastElem.length));
//             const elemToPush = indication.split("fino ").pop();
//             speechOutput = speechOutput + elemToPush;
//           } else {
//             speechOutput = speechOutput + indication;
//           }
//           previousIndication = indication;
//         });
//       }
//     } else {
//       const level = beaconsList.find(beacon => beacon.id === finishBeaconID).level;
//       const floor = beaconsList.find(beacon => beacon.id === finishBeaconID).floor;
//       const block = beaconsList.find(beacon => beacon.id === finishBeaconID).block;
//       const information = beaconsList.find(beacon => beacon.id === finishBeaconID).information;
//       speechOutput = `${destination} si trova al livello ${level}, al ${floor}, nel blocco ${block}.`;
//       if (information != undefined) {
//         speechOutput = speechOutput + information;
//       }
//     }
//   }

//   console.log(speechOutput);
// }

// funzione simile a quella di Giacomo Mambelli (mandata per email)
function getRemainingDirections(edges, beacons, nodes) {
  var previousEdge;
  const indications = [];
  edges.forEach(edge => {
    const names = nodes.find(node => node.beacon === edge.end).name;
    const goal = (names.length === 3) ? names[2] : names[0];
    if (previousEdge === undefined) {
      if (edge.degrees === '0') {
        indications.push(`dirigiti verso nord, ovvero supera la torretta e ${straight} fino ${goal} e `);
      } else if (edge.degrees === '90') {
        // c'è ${right} ${straight} in quanto questo è un arco, quindi parte dal punto A e arriva al punto B. L'arco è a destra rispetto alla nostra posizione
        // (ovvero: noi = freccia in su, mentre arco = ->), ma per arrivare poi al punto B dobbiamo andare dritti => al punto A gira a destra e poi vai dritto fino al punto B
        indications.push(`dirigiti verso est, ovvero ${right} ${straight} fino ${goal} e `);
      } else if (edge.degrees === '180') {
        indications.push(`dirigiti verso sud, ovvero ${back} fino ${goal} e `);
      } else if (edge.degrees === '270') {
        indications.push(`dirigiti verso ovest, ovvero ${left} ${straight} fino ${goal} e `);
      } 
    } else {
      getDegrees(previousEdge, edge, indications, goal)

      if (edge.type === "stairs") {
        indications.push(stairs);
        indications.push(" fino al livello numero " + beacons.find(item => item.id === edge.end).level + " e ");
      } else if (edge.type === "elevator") {
        indications.push(elevator);
        indications.push(" fino al livello numero " + beacons.find(item => item.id === edge.end).level + " e ");
      }
    }
    previousEdge = edge;
  });

  indications.push("sei arrivato!")
  return indications;
}

function getDegrees(previousEdge, edge, indications, goal) {
  if(previousEdge.degrees === edge.degrees) {
    // hanno gli stessi gradi rispetto al nord => sono nella stessa direzione
    indications.push(`${straight} fino ${goal} e `);
  } else if(((parseInt(previousEdge.degrees) + 90) % 360) === parseInt(edge.degrees)) {
    // se c'è una differenza di esattamente 90°, allora devo girare a destra
    indications.push(`${right} ${straight} fino ${goal} e `);
  } else if(((parseInt(previousEdge.degrees) + 270) % 360) === parseInt(edge.degrees)) {
    // se c'è una differenza di esattamente 270°, allora devo girare a sinistra
    indications.push(`${left} ${straight} fino ${goal} e `);
  } else if(((parseInt(previousEdge.degrees) + 180) % 360) === parseInt(edge.degrees)) {
    // se c'è una differenza di esattamente 180°, allora devo tornare indietro (altrimenti devo finire le scale => non dico nulla)
    // if(!(previousEdge.type === "stairs" && edge.type === "stairs")) {
    //   indications.push(`${back} fino ${goal} e `);
    // }
    // in questa simulzione non voglio che mi dica "torna indietro", quindi gli faccio dire "gira a destra (ma nel caso vero è da sistemare)"
    indications.push(`${right} ${straight} fino ${goal} e `);
  }
}

function getShortDirections(edges, beacons, needElevator) {
  // var previousEdge;
  // previousWasStairsOrElevator = false;
  const indications = [];
  const first = edges[0];
  const last = edges[edges.length - 1];
  if (first.degrees === '0') {
    indications.push(`dirigiti verso nord, ovvero supera la torretta e ${straight}, poi `);
  } else if (first.degrees === '90') {
    indications.push(`dirigiti verso est, ovvero ${right} `);
  } else if (first.degrees === '180') {
    indications.push(`dirigiti verso sud, ovvero ${back}, poi `);
  } else if (first.degrees === '270') {
    indications.push(`dirigiti verso ovest, ovvero ${left} `);
  } 

  const startLevel = beacons.find(item => item.id === first.start).level;
  const endLevel = beacons.find(item => item.id === last.end).level
  if (startLevel != endLevel) {
    if(needElevator) {
      indications.push(elevator);
    } else {
      indications.push(stairs);
    }
    indications.push(" fino al livello numero " + endLevel + " e poi ");
  }
  indications.push("sei arrivato!")



  // edges.forEach(edge => {
  //   if (previousEdge === undefined) {
  //     if (edge.degrees === '0') {
  //       indications.push(`dirigiti verso nord, ovvero supera la torretta e ${straight}, poi `);
  //     } else if (edge.degrees === '90') {
  //       indications.push(`dirigiti verso est, ovvero ${right} `);
  //     } else if (edge.degrees === '180') {
  //       indications.push(`dirigiti verso sud, ovvero ${back}, poi `);
  //     } else if (edge.degrees === '270') {
  //       indications.push(`dirigiti verso ovest, ovvero ${left} `);
  //     } 
  //     previousEdge = edge;
  //   } else {
  //     if (previousWasStairsOrElevator) {
  //       getDegrees(previousEdge, edge, indications, "");
  //       console.log("1");
  //       console.log(indications[indications.length - 1]);
  //       indications[indications.length - 1] = indications[indications.length - 1].split("fino ")[0];
  //       console.log("2");
  //       console.log(indications[indications.length - 1]);
  //       previousWasStairsOrElevator = false;
  //     }

  //     if (edge.type === "stairs" || edge.type === "elevator") {
  //       if (edge.type === "stairs") {
  //         indications.push(stairs);
  //       } else {
  //         indications.push(elevator);
  //       }
  //       indications.push(" fino al livello numero " + beacons.find(item => item.id === edge.end).level + " e ");
  //       previousEdge = edge;
  //       previousWasStairsOrElevator = true;
  //     }
  //   }
  // });

  // indications.push("poi sei arrivato!")
  return indications;
}

const DailyInformationIntent = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === "IntentRequest"
      && request.intent.name === "DailyInformationIntent";
  },
  handle(handlerInput) {
    const target = handlerInput.requestEnvelope.request.intent.slots.target.value.toLowerCase();
    // const dish = handlerInput.requestEnvelope.request.intent.slots.dish.value.toLowerCase();
    var speechOutput = "Mi dispiacema non ho capito!";

    if (target != undefined) {
      speechOutput = "Non ho trovato nulla, mi dispiace!";
      const res = Request('GET', myUrl);
      const body = res.getBody().toString('utf8');
      var informations = [];
      
      informations = getInformations(body, target);
  
      // se non ho trovato quello che cercavo => mi salvo tutte le dest che contengono quello che mi ha questo l'utente, così ... (continua dopo)
      if (!informations[0]) {
        const similarDest = [];
        body.split("<Evento>").forEach(item => {
          if (!item.includes("?xml")) {
            var dest = item.split("<Descrizione>")[1].split("<")[0].toLowerCase();
            if(dest.includes(target)) {
              similarDest.push(dest);
            }
          }
        });

        // ... posso confrontarli tutti e prendere quello che ci si avvicina di più
        if (similarDest.length != 0) {
          var indexOfBestMatch = 0;
          if (similarDest.length > 1) {
            const matches = stringSimilarity.findBestMatch(target, similarDest);
            indexOfBestMatch = matches.bestMatchIndex;
          }
          informations = getInformations(body, similarDest[indexOfBestMatch]);
        }
      }    
  
      if (informations[0]) {
        speechOutput = `${target} si trova a ${informations[3]}, inizia alle ${informations[1]} e finisce alle ${informations[2]}`;
      }
    }
    // if (dish != undefined) {
    //   speechOutput = `CE L'HO FATTAAAAAAAAAAAAA`;
    // }

    // if (request.includes("mangiare") || request.includes("caffè") || request.includes("bere") || request.includes("pranzare") || target.includes("mangiare") || target.includes("caffè") || target.includes("bere") || target.includes("pranzare")) {
    //   // speechOutput = `puoi andare alle macchinette oppure al bar.`;
    //   speechOutput = `CE L'HO FATTAAAAAAAAAAAAA`;
    // }

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
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

const EatingAndDrinkingIntent = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === "IntentRequest"
      && request.intent.name === "EatingAndDrinkingIntent";
  },
  handle(handlerInput) {
    const dish = handlerInput.requestEnvelope.request.intent.slots.dish.value.toLowerCase();
    var speechOutput = "Mi dispiacema non ho capito!";

    if (dish != undefined) {
      if (dish.includes("acqua")) {
        speechOutput = `Se vuoi rimpire la tua borraccia, puoi andare alla casina dell'acqua, altrimenti puoi andare al bar o alle macchinette.`;
      } else {
        speechOutput = `Puoi andare al bar o alle macchinette.`;
      }
    }

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  }
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
      .reprompt(`Sorry, an error occurred (Error handled): ${error.message}`)
      .speak(`Sorry, an error occurred (Error handled): ${handlerInput.requestEnvelope.request.intent}`)
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
    DailyInformationIntent,
    EatingAndDrinkingIntent,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
