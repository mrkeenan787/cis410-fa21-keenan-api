const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("./dbConnectExec.js");
// const { executeQuery } = require("./dbConnectExec.js");
const keenanConfig = require("./config.js");

const app = express();
app.use(express.json());

app.listen(5000, () => {
  console.log(`app is running on port 5000`);
});

app.get("/hi", (req, res) => {
  res.send("Hello World");
});

app.get("/", (req, res) => {
  res.send("API is running");
});

// app.post();
// app.put();

// const auth = async (req, res, next) => {
//   console.log("in the middleware", req.header("Authorization"));
// };

// app.post("/post", auth, async (req, res) => {
//   try {
//     let price = req.body.price;
//     let location = req.body.location;
//     let contactFK = req.body.contactFK;
//     let skiFK = req.body.skiFK;

//     if (!price || !location || !contactFK || !skiFK) {
//       return res.status(400).send("Bad request");
//     }

//     // summary = summary.replace("'", "''");
//     // console.log("summary", location);
//   } catch (err) {
//     console.log("Error in Post /post", err);
//     res.status(500).send();
//   }
// });

app.post("/contacts/login", async (req, res) => {
  // console.log("/contacts/login called", req.body);

  //1. DATA Validation
  let email = req.body.email;
  let password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("Bad Request");
  }

  //2. User exists in Database

  let query = `SELECT *
  FROM Customer
  WHERE email = '${email}'`;

  let result;
  try {
    result = await db.executeQuery(query);
  } catch (myError) {
    console.log("error in /contacts/login", myError);
    return res.status(500).send();
  }

  if (!result[0]) {
    return res.status(401).send("Invalid user credentials");
  }

  //3. Check Password
  let user = result[0];

  if (!bcrypt.compareSync(password, user.Password)) {
    console.log("invalid password");
    return res.status(401).send("Invalid User credentials");
  }

  //4. Generate Token
  let token = jwt.sign({ pk: user.ContactPK }, keenanConfig.JWT, {
    expiresIn: "60 minutes",
  });
  console.log("token", token);

  //5. Save Token in DB and send response
  let setTokenQuery = `UPDATE Customer
  SET token = '${token}'
  WHERE ContactPK = ${user.ContactPK}`;

  try {
    await db.executeQuery(setTokenQuery);

    res.status(200).send({
      token: token,
      user: {
        FirstName: user.FirstName,
        LastName: user.LastName,
        Email: user.Email,
        Address: user.Address,
        ContactPK: user.ContactPK,
      },
    });
  } catch (myError) {
    console.log("Error in setting user token", myError);
    res.status(500).send();
  }
});

app.post("/contacts", async (req, res) => {
  //   res.send("/contacts called");

  //   console.log("request body", req.body);

  let nameFirst = req.body.nameFirst;
  let nameLast = req.body.nameLast;
  let email = req.body.email;
  let address = req.body.address;
  let password = req.body.password;

  if (!nameFirst || !nameLast || !email || !address || !password) {
    return res.status(400).send("Bad Request");
  }

  nameFirst = nameFirst.replace("'", "''");
  nameLast = nameLast.replace("'", "''");

  let emailCheckQuery = `SELECT Email 
    FROM Customer
    WHERE Email = '${email}'`;

  let existingUser = await db.executeQuery(emailCheckQuery);

  //   console.log("existing user", existingUser);

  if (existingUser[0]) {
    return res.status(409).send("Duplicate email");
  }

  let hashedPassword = bcrypt.hashSync(password);

  let insertQuery = `INSERT INTO Customer(FirstName, LastName, Email, Address, Password)
VALUES ('${nameFirst}' , '${nameLast}', '${email}', '${address}', '${hashedPassword}')`;

  db.executeQuery(insertQuery)
    .then(() => {
      res.status(201).send();
    })
    .catch((err) => {
      console.log("error in POST /contact", err);
      res.status(500).send();
    });
});

app.get("/skis", (req, res) => {
  db.executeQuery(
    `SELECT *
    FROM Ski
    LEFT JOIN Category
    ON Category.CategoryPK = ski.CategoryFK`
  )
    .then((theResults) => {
      res.status(200).send(theResults);
    })
    .catch((myError) => {
      console.log(myError);
      res.status(500).send();
    });
});

app.get("/skis/:pk", (req, res) => {
  let pk = req.params.pk;
  //   console.log(pk);
  let myQuery = `SELECT * 
FROM Ski
LEFT JOIN Category
ON Category.CategoryPK = ski.CategoryFK
WHERE SkiPK = ${pk}`;

  db.executeQuery(myQuery)
    .then((result) => {
      // console.log("result", result );
      if (result[0]) {
        res.send(result[0]);
      } else {
        res.status(404).send(`bad request`);
      }
    })
    .catch((err) => {
      console.log("Error in /skis/:pk", err);
      res.status(500).send();
    });
});
