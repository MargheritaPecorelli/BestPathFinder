var MySql = require('sync-mysql');
 
var connection = new MySql({
  host     : 'sql2.freemysqlhosting.net',
  user     : 'sql2313391',
  password : 'iM7!eM6!',
  database : 'sql2313391'
});
 
exports.executeSyncQuery = (callback) => {
  return callback(null, connection.query("SELECT Nome FROM datacategory WHERE IdDataCategory=1")); // Aule
}