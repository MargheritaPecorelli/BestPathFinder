// var MySql = require('sync-mysql');
const Request = require('sync-request');

// var connection = new MySql({
//   host     : 'sql2.freemysqlhosting.net',
//   user     : 'sql2324857',
//   password : 'sX1!eG8*',
//   database : 'sql2324857'
// });
 
// exports.executeSyncQuery = (query, callback) => {
//   return callback(null, connection.query(query));
// }


// const today = new Date().toLocaleDateString();
// const myUrl = "https://www.unibo.it/UniboWeb/Utils/OrarioLezioni/RestService.aspx?SearchType=OccupazioneAule&Data="+today+"&Edificio=EST_EXZUCC1";
const myUrl = "https://www.unibo.it/UniboWeb/Utils/OrarioLezioni/RestService.aspx?SearchType=OccupazioneAule&Data=29/11/2019&Edificio=EST_EXZUCC1";

const res = Request('GET', myUrl);
const body = res.getBody().toString('utf8');

exports.getBody = () => {
    return body;
}