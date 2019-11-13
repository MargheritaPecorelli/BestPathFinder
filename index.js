/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
const mariadb = require('mariadb');

var prova;
/*
mariadb.createConnection({user: 'margherita', password: 'pippo', database: 'db_unibo_simplified'})
        .then(conn => {
          conn.query("SELECT NomeTabellaOpenData FROM toopendata WHERE IdInfo=1")
              .then(res => {
                prova = res[0].NomeTabellaOpenData;
                console.log('prova dentro: ' + prova);
                conn.end();
              })
            .catch(err => { 
              console.log(err);
            });
        })
        .catch(err => {
          console.log(err);
        });

console.log('prova fuori: ' + prova);
*/
async function asyncFunction() {
  let conn;
  try {
    conn = await mariadb.createConnection({user: 'margherita', password: 'pippo', database: 'db_unibo_simplified'});
    const rows = await conn.query("SELECT NomeTabellaOpenData FROM toopendata WHERE IdInfo=1");
    prova = rows[0].NomeTabellaOpenData;
    if(prova === 'AULA 2.8') {
      console.log('questa è aula 2.8');  
    }
    console.log('prova dentro: ' + prova);
    return prova;
  } catch (err) {
    throw err;
  } finally {
    if (conn) {
      return conn.end();
    }
  }
}

//asyncFunction();

/*
const pool = mariadb.createPool({
  host: 'localhost', 
  user: "margherita",
  password: "pippo",
  connectionLimit: 5
});
async function asyncFunction() {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT 1 as val");
    console.log(rows); //[ {val: 1}, meta: ... ]
    const res = await conn.query("INSERT INTO myTable value (?, ?)", [1, "mariadb"]);
    console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
  } catch (err) {
    throw err;
  } finally {
    if (conn) {
      return conn.end();
    }
  }
}
*/

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
const activities = ['ricevimento', 'esame', 'linux day', 'programmazione concorrente e distribuita', 'applicazioni e servizi web'];
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
    asyncFunction();
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
          speechOutput = `per raggiungere ${item} devi + prova: ${prova} ...`;
        } else {
          speechOutput = `per raggiungere ${item} con disabilità ${disability}, devi ...`;
        }
      }
    });
    
    if(!isLocation) {
      var professorName;
      var thereIsProf = false;
      professors.forEach(profItem => {
        if(destination.includes(profItem)) {
          professorName = `${profItem}`;
          thereIsProf = true;
        }
      });
      
      var isAnActivity = false;
      activities.forEach(actItem => {
        if(destination.includes(actItem)) {
          isAnActivity = true;
          speechOutput = `mi hai chiesto dove si trova ${actItem}`;
          if(thereIsProf) {
            speechOutput = speechOutput + ` del prof ${professorName}`
          }
        }
      });
      
      if(!isAnActivity && thereIsProf) {
        speechOutput = `mi hai chiesto dove si trova il prof ${professorName}`
      }
    }
    
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .getResponse();
  }
}

const TimeTableHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === "IntentRequest"
      && request.intent.name === "TimeTableIntent";
  },
  handle(handlerInput) {
    const destination = handlerInput.requestEnvelope.request.intent.slots.destination.value;
    //const speechOutput = `mi hai chiesto l'orario per: ${destination}`;
    var speechOutput = `mi dispiace ma non capisco: ${destination}`;
    
    var isLocation = false;
    locations.forEach(item => {
      if(destination.includes(item)) {
        isLocation = true;
        speechOutput = `mi hai chiesto l'orario per: ${item}`;
      }
    });
    
    if(!isLocation) {
      var professorName;
      var thereIsProf = false;
      professors.forEach(profItem => {
        if(destination.includes(profItem)) {
          professorName = `${profItem}`;
          thereIsProf = true;
        }
      });
      
      var isAnActivity = false;
      activities.forEach(actItem => {
        if(destination.includes(actItem)) {
          isAnActivity = true;
          speechOutput = `mi hai chiesto l'orario per: ${actItem}`;
          if(thereIsProf) {
            speechOutput = speechOutput + ` del prof ${professorName}`
          }
        }
      });
      
      if(!isAnActivity && thereIsProf) {
        speechOutput = `mi hai chiesto l'orario per il prof: ${professorName}`
      }
    }
    
    return handlerInput.responseBuilder
      .speak(speechOutput)
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
