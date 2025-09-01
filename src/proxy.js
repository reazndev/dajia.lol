const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

app.get('/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('URL parameter is required');
  }
  
  try {
    const response = await fetch(url);
    const buffer = await response.buffer();
    
    // Set the correct content type
    res.set('Content-Type', response.headers.get('content-type'));
    res.send(buffer);
  } catch (error) {
    res.status(500).send('Error fetching the image');
  }
});

app.listen(3002, () => {
  console.log('Proxy server running on port 3002');
}); 