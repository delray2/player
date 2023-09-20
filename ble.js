const express = require('express');
const noble = require('@abandonware/noble');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

let peripherals = [];

noble.on('stateChange', (state) => {
  if (state === 'poweredOn') {
    noble.startScanning();
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', (peripheral) => {
  const serviceUuids = peripheral.advertisement.serviceUuids;
  
  if (peripheral.advertisement.localName || 
      (serviceUuids && (serviceUuids.includes('110b') || serviceUuids.includes('110d')))) {
    peripherals.push(peripheral);
  }
});

function connectToDevice(peripheral) {
  peripheral.connect((error) => {
    if (error) {
      console.error('Connection error:', error);
      return;
    }

    console.log('Connected to', peripheral.advertisement.localName);
    // ... (discover services and characteristics here)
  });
}

app.get('/devices', (req, res) => {
  const devices = peripherals.map(p => ({ id: p.id, name: p.advertisement.localName }));
  res.json(devices);
});

app.post('/connect', (req, res) => {
  const peripheralId = req.body.peripheralId;
  const peripheral = peripherals.find(p => p.id === peripheralId);

  if (peripheral) {
    connectToDevice(peripheral);
    res.send('Connection initiated');
  } else {
    res.status(400).send('Peripheral not found');
  }
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
