const express = require('express');
const request = require('request');
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');

const client_id = '6a5e5be67162481fb6aa380129021898';
const client_secret = 'da49278fa798444a9ca5a9b4cce73ffc';
const redirect_uri = 'http://localhost:8888/callback';

let access_token; // Variable to store the access token

const app = express();

app.use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {
  const scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri
    }));
});

app.get('/callback', function(req, res) {
  const code = req.query.code || null;
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    access_token = body.access_token; // Store the access token
    const refresh_token = body.refresh_token;

    res.redirect('/#' +
      querystring.stringify({
        access_token: access_token,
        refresh_token: refresh_token
      }));
  });
});

app.get('/getAccessToken', function(req, res) {
  res.json({ access_token: access_token });
});

app.listen(8888, () => {
  console.log('Server running on http://localhost:8888');
});
