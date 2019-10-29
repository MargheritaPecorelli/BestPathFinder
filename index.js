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
    const speechOutput = 'Welcome to Unibo path finder! What can I do for you?';
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .getResponse();
  },
};

const PathFinderWithDestinationHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' 
    && request.intent.name === 'PathFinderIntent'
    && handlerInput.requestEnvelope.request.intent.slots.destinazione.value;
  },
  handle(handlerInput) {
    const locationName = handlerInput.requestEnvelope.request.intent.slots.destinazione.value;
    var speechOutput = '';
    var isDestinationPresent = false;
    locations.forEach(item=>{
      if(locationName.includes(item)) {
        isDestinationPresent = true;
        speechOutput = item;
      }
    });
    if (!isDestinationPresent) {
      speechOutput = `mi dispiace ma non conosco ${locationName}`;
    }
    return handlerInput.responseBuilder
        .speak(speechOutput)
        .getResponse();
  },
};

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
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
