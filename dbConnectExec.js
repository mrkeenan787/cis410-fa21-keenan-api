const sql = require("mssql");
const keenanConfig = require("./config.js");

const config = {
  user: keenanConfig.DB.user,
  password: keenanConfig.DB.password,
  server: keenanConfig.DB.server, // You can use 'localhost\\instance' to connect to named instance
  database: keenanConfig.DB.database,
};

async function executeQuery(aQuery) {
  let connection = await sql.connect(config);
  let result = await connection.query(aQuery);

  console.log(result);
  return result.recordset;
}

// executeQuery(`SELECT *
// FROM Ski
// LEFT JOIN Category
// ON Category.CategoryPK = ski.CategoryFK`);

module.exports = { executeQuery: executeQuery };
