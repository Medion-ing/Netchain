const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 4000;

app.use(cors());

app.get('/api/transactions', (req, res) => {
  try {
    if (!fs.existsSync('netchain.log')) {
      return res.status(200).json([]);
    }
    
    const logs = fs.readFileSync('netchain.log', 'utf-8')
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
      
    res.json(logs.reverse()); // Les plus récents en premier
  } catch (error) {
    console.error('Error reading logs:', error);
    res.status(500).json({ error: "Erreur de lecture des logs" });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur API sur http://localhost:${PORT}`);
});
