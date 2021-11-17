const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("./dbConnectExec.js");
const { executeQuery } = require("./dbConnectExec.js");
const keenanConfig = require("./config.js");
const auth = require("./middleware/authenticate");

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

app.post("/Post", auth, async (req, res) => {
  try {
    let Price = req.body.Price;
    let Location = req.body.Location;
    let ContactFK = req.body.ContactFK;
    let SkiFK = req.body.SkiFK;

    if (!Price || !Location || !ContactFK || !SkiFK) {
      return res.status(400).send("Bad request");
    }

    Location = Location.replace("'", "''");
    // console.log("Price", Price)
    // console.log("here is the contact", req.contact);

    let insertQuery = `INSERT INTO Post(Price, Location, ContactFK, SkiFK)
    OUTPUT inserted.PostPK, inserted.Price, inserted.Location, inserted.ContactFK, inserted.SkiFK
    VALUES ('${Price}','${Location}', '${ContactFK}', '${SkiFK}')`;

    let insertedPost = await db.executeQuery(insertQuery);
    // console.log("inserted post", insertedPost);
    //  res.send("here is the response");
    res.status(201).send(insertedPost[0]);
  } catch (err) {
    console.log("Error in Post /post", err);
    res.status(500).send();
  }
});

app.get("/contacts/me", auth, (req, res) => {
  res.send(req.contact);
});

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
