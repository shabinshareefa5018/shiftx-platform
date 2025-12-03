const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send("Service A running successfully on OpenShift!");
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Service A started on port ${port}`);
});
