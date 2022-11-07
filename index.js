const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

require("./src/app/controllers/index")(app);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
