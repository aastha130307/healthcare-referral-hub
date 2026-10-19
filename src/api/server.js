const express = require("express");

const app = express();
const PORT = process.env.API_PORT || 3000;


app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Healthcare Referral Hub API is running"
  });
});

app.listen(PORT, () => {
  console.log(`Referral API running on http://localhost:${PORT}`);
});
