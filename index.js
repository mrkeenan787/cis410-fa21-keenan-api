const express = require("express");

const db = require("./dbConnectExec.js");

const app = express();

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
