const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/prompt', (req, res) => {
  const filePath = path.join(__dirname, 'BUNNYX_SYSTEM_PROMPT.md');
  const content = fs.readFileSync(filePath, 'utf-8');
  res.json({ content });
});

app.listen(PORT, () => {
  console.log(`BunnyX app running at http://localhost:${PORT}`);
});
