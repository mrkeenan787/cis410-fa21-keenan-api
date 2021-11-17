const jwt = require("jsonwebtoken");

const db = require("../dbConnectExec.js");
const keenanConfig = require("../config.js");

const auth = async (req, res, next) => {
  //   console.log("in the middleware", req.header("Authorization"));
  //   next();

  try {
    //1. Decode the TOKEN

    let myToken = req.header("Authorization").replace("Bearer ", "");
    console.log("token", myToken);

    let decoded = jwt.verify(myToken, keenanConfig.JWT);
    console.log(decoded);

    let contactPK = decoded.pk;

    //2. Compare Token with Database

    let query = `SELECT ContactPK, FirstName, LastName, Email, Address
    FROM Customer
    WHERE ContactPK=${contactPK} and token = '${myToken}'`;

    let returnedUser = await db.executeQuery(query);
    console.log("returned user", returnedUser);

    //3. Save user Information in the request

    if (returnedUser[0]) {
      req.contact = returnedUser[0];
      next();
    } else {
      return res.status(401).send("Invalid Credentials");
    }
  } catch (err) {
    console.log(err);
    return res.status(401).send("Invalid Credentials");
  }
};

module.exports = auth;
