var MySql = require('sync-mysql');
 
var connection = new MySql({
  host     : 'sql2.freemysqlhosting.net',
  user     : 'sql2328429',
  password : 'vE6!pZ2*',
  database : 'sql2328429'
});
 
exports.executeSyncQuery = (query, callback) => {
  return callback(null, connection.query(query));
}

