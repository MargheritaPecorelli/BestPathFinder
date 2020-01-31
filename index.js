/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
const Request = require('sync-request');
const stringSimilarity = require('string-similarity');
const fs = require('fs');
const BeaconMap = require('./BeaconMap');

// const MySyncModule = require('./syncConnectionToDB');
// const Location = require('./model/location');

// const today = new Date().toLocaleDateString();
// const myUrl = "https://www.unibo.it/UniboWeb/Utils/OrarioLezioni/RestService.aspx?SearchType=OccupazioneAule&Data="+today+"&Edificio=EST_EXZUCC1";
const myUrl = "https://www.unibo.it/UniboWeb/Utils/OrarioLezioni/RestService.aspx?SearchType=OccupazioneAule&Data=29/11/2019&Edificio=EST_EXZUCC1";

const right = "gira a destra";
const left = "gira a sinistra";
const straight = "vai dritto";
const back = "torna indietro";

// const locations = MySyncModule.executeSyncQuery("SELECT Nome, Descrizione, Posti FROM informazioni", (error, result) => {
//   if (error) {
//     throw error;
//   }
//   const locs = [];
//   result.forEach(item => {
//     // new Location(locName, locDescription, locRoomNumber, locLevel, locFloor, locSeats)
//     var name = item.Nome;
//     var description = item.Descrizione;
//     var roomNumeber = null;
//     var level;
//     var floor;
//     var seats = item.Posti;
//     if (item.Nome.includes("-")) {
//       name = item.Nome.split("-")[1];
//       if (item.Nome.startsWith("S")) {
//         roomNumeber = item.Nome.split(" ")[1];
//       } else {
//         roomNumeber = item.Nome.split("-")[0].split(" ")[0];
//       }
//       switch(roomNumeber.substring(0, 1)) {
//         case '1':
//           level = 1;
//           floor = 'piano interrato';
//           break;
//         case '2':
//           level = 2;
//           floor = 'piano terra';
//           break;
//         case '3':
//           level = 3;
//           floor = 'primo piano';
//           break;
//         case '4':
//           level = 4;
//           floor = 'secondo piano';
//           break;
//       }
//     }
//     if (typeof level === "undefined") {
//       if (description.includes("piano interrato")) {
//         level = 1;
//         floor = 'piano interrato';
//       } else if (description.includes("piano terra")) {
//         level = 2;
//         floor = 'piano terra';
//       } else if (description.includes("primo piano")) {
//         level = 3;
//         floor = 'primo piano';
//       } else if (description.includes("secondo piano")) {
//         level = 4;
//         floor = 'secondo piano';
//       } else {
//         level = null;
//         floor = null;
//       }
//     }
//     locs.push(new Location(name, description, roomNumeber, level, floor, seats));
//   });
//   return locs;
// });
// console.log(locations[83]);

// const professors = [];
// locations.forEach(item => {
//   if (item.description().includes("Ufficio")) {
//     if (item.name().includes(",")) {
//       var names = item.name().split(",");
//       names.forEach(name => {
//         professors.push(name);
//       });
//     } else {
//       professors.push(item.name());
//     }
//   }
// });
// console.log(professors);

// const activities = [];
// var res = Request('GET', myUrl);
// const body = res.getBody().toString('utf8');
// body.split("<Evento>").forEach(item => {
//   if (!item.includes("?xml")) {
//     activities.push(item.split("<Descrizione>")[1].split("<")[0]);
//   }
// });
// console.log(activities);

// ==============================================================================================================================================================

tempor();

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

    


    // VECCHIA VERSIONE
    // var speechOutput = `mi dispiace ma non capisco: ${destination}`;
    // var speechOutput;
    // var isLocation = false;
    // locations.forEach(item => {
    //   const locaName = item.name();
    //   if(destination.includes(locaName)) {
    //     isLocation = true;
    //     if (disability.includes('no') || disability.includes('nesssuna')) {
    //       speechOutput = `per raggiungere ${locaName} devi ...`;
    //     } else {
    //       speechOutput = `per raggiungere ${locaName} con disabilità ${disability}, devi ...`;
    //     }
    //   }
    // });
    
    // if(!isLocation) {
    //   var professorName;
    //   var thereIsProf = false;
    //   professors.forEach(prof => {
    //     if(destination.includes(prof)) {
    //       professorName = `${prof}`;
    //       thereIsProf = true;
    //       speechOutput = `mi hai chiesto dove si trova il prof ${professorName}`;
    //     }
    //   });
      
    //   activities.forEach(activity => {
    //     if(destination.includes(activity)) {
    //       speechOutput = `mi hai chiesto dove si trova ${activity}`;
    //       if(thereIsProf) {
    //         speechOutput = speechOutput + ` del prof ${professorName}`;
    //       }
    //     }
    //   });
    //   /*
    //   // l'ho messo direttamente dentro a: if(!isLocation)
    //   if(!isAnActivity && thereIsProf) {
    //     speechOutput = `mi hai chiesto dove si trova il prof ${professorName}`
    //   }
    //   */
    // }
    
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .getResponse();
  }
}

function tempor() {
  var mapJson = JSON.parse(fs.readFileSync('./jsonOfTheMap.json').toString());
  const beaconsList = mapJson.buildings[0].beacons;
  const edges = mapJson.buildings[0].arcs;
  // beaconsList.forEach(beacon => console.log("beaconsID: " + beacon.id));
  const beaconMap = new BeaconMap(beaconsList, edges);
  const path = beaconMap.getPath(beaconsList[3], beaconsList[9]);
  path.beacons.forEach(beacon => console.log("beacon ID: " + beacon.id));
  path.edges.forEach(edge => {
    console.log("edge id: " + edge.id);
    // console.log("edge start: " + edge.start);
    // console.log("edge end: " + edge.end);
    // console.log("edge accessible: " + edge.accessible);
    // console.log("edge degrees: " + edge.degrees);
    // console.log("edge type: " + edge.type);
  });
  const indications = getRemainingDirections(path.edges);
  indications.forEach(indication => console.log(indication + " poi "));
}

// funzione simile a quella di Giacomo Mambelli (mandata per email)
function getRemainingDirections(edges) {
  var previousEdge;
  const indications = [];
  edges.forEach(edge => {
    if (previousEdge === undefined) {
      console.log("il primo è undefined");
      // sto ipotizzando che la torretta di Alexa sia sotto gli schermi che ci sono all'ingresso di via dell'università 50,
      // quindi se si guarda verso la torretta, si sta guardando a nord (circa) secondo Google Maps
      if (edge.degrees >= 0 && edge.degrees < 90) {
        indications.push(`dirigiti verso est, ovvero ${right}`);
      } else if (edge.degrees >= 90 && edge.degrees < 180) {
        indications.push(`dirigiti verso sud, ovvero ${back}`);
      } else if (edge.degrees >= 180 && edge.degrees < 270) {
        indications.push(`dirigiti verso ovest, ovvero ${left}`);
      } else if (edge.degrees >= 270 && edge.degrees < 360) {
        indications.push(`dirigiti verso nord, ovvero supera la torretta e ${straight}`);
      }
    } else if(previousEdge.degrees === edge.degrees) {
      // hanno gli stessi gradi rispetto al nord => sono nella stessa direzione
      indications.push(straight);
    } else if(((previousEdge.degrees + 90) % 360) === edge.degrees) {
      // se c'è una differenza di esattamente 90° (non mi piace che debba essere esattamente 90, avrei preferito una range es tra 80 e 100), allora devo girare a destra
      indications.push(right);
    } else if(((previousEdge.degrees + 270) % 360) === edge.degrees) {
      // se c'è una differenza di esattamente 270°, allora devo girare a sinistra
      indications.push(left);
    } else if(((previousEdge.degrees + 180) % 360) === edge.degrees) {
      // se c'è una differenza di esattamente 180°, allora devo tornare indietro (altrimenti devo finire le scale => non dico nulla)
      if(!(previousEdge.type == "stairs" && edge.type == "stairs")) {
        indications.push(back);
      }
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
