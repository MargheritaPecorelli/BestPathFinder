/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
const Location = require('./model/location');
const aula2_1 = new Location('aula 2.1', 'aula 2.1', 'stanza 1009', 1, 2, 'A');
const mirriLab = new Location('laboratorio della mirri', '', 'stanza 4136', 3, 4, 'C');
const locations = new Array(aula2_1.name(), mirriLab.name());

const GetNewFactHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechOutput = 'Benvenuto nel Campus di Cesena! Cosa posso fare per te?';
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .getResponse();
  },
};


//questo viene richiamato quando non è presente il valore di "disabilita"
const StartedPathFinderIntentHandler = {
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

//questo viene richiamato quando non sono presenti né il valore di "destinazione", né quello di "nomeProfessore", né quello di "attivita"
//dalmomento che può essere messo un unico .addElicitSlotDirective('...'), ho deciso che nel caso in cui uno dica semplicemente la propria disabilità,
//gli verrà chiesto dove vuole andare (non quali attività vuole fare o altro)
const PathFinderInProgressHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === "IntentRequest"
      && request.intent.name === "PathFinderIntent"
      && !request.intent.slots.destinazione.value
      && !request.intent.slots.nomeProfessore.value
      && !request.intent.slots.attivita.value
      && request.intent.slots.disabilita.value
      && request.dialogState === 'COMPLETED';
  },
  handle(handlerInput) {
    //const destination = handlerInput.requestEnvelope.request.intent.slots.destinazione.value; //undefined
    //const speechText = `valore di destinazione: ${destination}`;
    //const speechText = `valore di disabilita ${handlerInput.requestEnvelope.request.intent.slots.disabilita.value}`
    const speechText = 'Dimmi dove devi andare, così ti dirò come arrivarci';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .addElicitSlotDirective('destinazione')
      .getResponse();
  }
}

//questo viene richiamato quando è presente il valore di "destinazione"
const PathFinderWithDestinationHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === "IntentRequest"
      && request.intent.name === "PathFinderIntent"
      && request.intent.slots.destinazione.value
      && request.dialogState === 'COMPLETED';
  },
  handle(handlerInput) {
    const locationName = handlerInput.requestEnvelope.request.intent.slots.destinazione.value;
    const disability = handlerInput.requestEnvelope.request.intent.slots.disabilita.value;
    var speechOutput = `mi dispiace ma non conosco ${locationName}`;
    //var isDestinationPresent = false;
    locations.forEach(item => {
      if(locationName.includes(item)) {
        //isDestinationPresent = true;
        if (disability.includes('no') || disability.includes('nesssuna')) {
          speechOutput = `per raggiungere ${item} devi ...`;
        } else {
          speechOutput = `per raggiungere ${item} con disabilità ${disability}, devi ...`;
        }
      }
    });
    /*if (!isDestinationPresent) {
      speechOutput = `mi dispiace ma non conosco ${locationName}`;
    }*/
    return handlerInput.responseBuilder
        .speak(speechOutput)
        .getResponse();
  },
};

//questo viene richiamato quando è presente il valore di "attivita"
/*const PathFinderWithActivityHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === "IntentRequest"
      && request.intent.name === "PathFinderIntent"
      && request.intent.slots.attività.value
  },
  handle(handlerInput) {
    const activityName = handlerInput.requestEnvelope.request.intent.slots.attivita.value;
    const disability = handlerInput.requestEnvelope.request.intent.slots.disabilita.value;
    var speechOutput = `mi dispiace ma non conosco ${activityName}`;
    activities.forEach(item => {
      if(activityName.includes(item)) {
        //if (disability.includes('no') || disability.includes('nesssuna')) {
          const activityLocation = item.location();
          speechOutput = `${item} si tiene presso  ${activityLocation}. Vuoi sapere come raggiungerla?`;
        //} else {
          //speechOutput = `per raggiungere ${item} con disabilità ${disability}, devi ...`;
        //}
      }
    });
    return handlerInput.responseBuilder
        .speak(speechOutput)
        .getResponse();
  },
};*/

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
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    return handlerInput.responseBuilder
      .speak(`Sorry, an error occurred: ${error.message}`)
      .reprompt(`Sorry, an error occurred: ${error.message}`)
      .getResponse();
  },
};

// const SKILL_NAME = 'Space Facts';
// const GET_FACT_MESSAGE = 'Here\'s your fact: ';
const HELP_MESSAGE = 'You can say tell me a space fact, or, you can say exit... What can I help you with?';
const HELP_REPROMPT = 'What can I help you with?';
// const STOP_MESSAGE = 'Goodbye!';

// const data = [];

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    GetNewFactHandler,
    PathFinderWithDestinationHandler,
    StartedPathFinderIntentHandler,
    PathFinderInProgressHandler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
