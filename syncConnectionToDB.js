var MySql = require('sync-mysql');
 
var connection = new MySql({
  host     : 'sql2.freemysqlhosting.net',
  user     : 'sql2324857',
  password : 'sX1!eG8*',
  database : 'sql2324857'
});
 
exports.executeSyncQuery = (query, callback) => {
  return callback(null, connection.query(query));
}

