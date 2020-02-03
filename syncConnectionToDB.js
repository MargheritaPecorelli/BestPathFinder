var MySql = require('sync-mysql');
 
var connection = new MySql({
  host     : 'sql7.freesqldatabase.com',
  user     : 'sql7321187',
  password : 'zWrrb24EmC',
  database : 'sql7321187'
});
 
exports.executeSyncQuery = (query, callback) => {
  return callback(null, connection.query(query));
}

