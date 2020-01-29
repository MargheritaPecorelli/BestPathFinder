var MySql = require('sync-mysql');
 
var connection = new MySql({
  host     : 'sql2.freemysqlhosting.net',
  user     : 'sql2320543',
  password : 'iD9*pE5*',
  database : 'sql2320543'
});
 
exports.executeSyncQuery = (query, callback) => {
  return callback(null, connection.query(query));
}

