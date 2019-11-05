/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');

/*
const Location = require('./model/location');
const Activity = require('./model/activity');

const aula2_1 = new Location('aula 2.1', 'aula 2.1', 'stanza 1009', 1, 2, 'A');
const mirriLab = new Location('laboratorio della mirri', '', 'stanza 4136', 3, 4, 'C');
const locations = new Array(aula2_1.name(), mirriLab.name());

const ricevimentoMirri = new Activity('ricevimento', aula2_1, 'mirri');
const esameMirri = new Activity('esame', mirriLab, 'mirri');
const activities = new Array(ricevimentoMirri, esameMirri);
*/

const locations = ['aula 2.1', 'stanza 4136', 'biblioteca'];
const activities = ['ricevimento', 'esame', 'linux day'];
const professors = ['mirri', 'viroli', 'ricci'];

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
    var speechOutput = `mi dispiace ma non capisco: ${destination}`;
    var isLocation = false;
    locations.forEach(item => {
      if(destination.includes(item)) {
        isLocation = true;
        if (disability.includes('no') || disability.includes('nesssuna')) {
          speechOutput = `per raggiungere ${item} devi ...`;
        } else {
          speechOutput = `per raggiungere ${item} con disabilità ${disability}, devi ...`;
        }
      }
    });
    if(!isLocation) {
      activities.forEach(actItem => {
        if(destination.includes(actItem)) {
          speechOutput = `mi hai chiesto dove si trova ${actItem}`;
          professors.forEach(profItem => {
            if(destination.includes(profItem)) {
              speechOutput = speechOutput + ` del prof ${profItem}`;
            }
          });
        }
      });
    }
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .getResponse();
  }
}
/*
function checkLocations(speechOutput, destination, disability) {
  speechOutput = `provaaaaaaaaaaaaaaaaaaaa`;
  locations.forEach(item => {
    if(destination.includes(item)) {
      if (disability.includes('no') || disability.includes('nesssuna')) {
        speechOutput = `per raggiungere ${item} devi ...`;
      } else {
        speechOutput = `per raggiungere ${item} con disabilità ${disability}, devi ...`;
      }
      return true;
    }
  });
  return false;
}
*/
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
    //PathFinderWithDestinationHandler,
    StartedPathFinderHandler,
    CompletedPathFinderHandler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
