const express = require('express');
const request = require('request');
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');

const client_id = '6a5e5be67162481fb6aa380129021898'; // Your client ID
const client_secret = 'da49278fa798444a9ca5a9b4cce73ffc'; // Your client secret
const redirect_uri = 'http://localhost:8881/callback'; // Your redirect uri

let tokenData = {};

const app = express();

app.use(cors())
   .use(cookieParser())
   .use(express.static('public'));

app.get('/login', function(req, res) {
  const scope = 'streaming user-read-private user-read-email user-modify-playback-state app-remote-control';
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
    if (error) {
      console.error("Failed to get access token: ", error);
      return;
    }

    tokenData.access_token = body.access_token;
    tokenData.refresh_token = body.refresh_token;
    tokenData.expires_in = Date.now() + (body.expires_in * 1000);

    res.redirect('/#' +
      querystring.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token
      }));
  });
});

// Endpoint to get the current access token
app.get('/getAccessToken', function(req, res) {
  // Check if token has expired and refresh if necessary
  if (Date.now() > tokenData.expires_in) {
    const refreshOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(refreshOptions, function(error, response, body) {
      if (error) {
        console.error("Failed to refresh token: ", error);
        return;
      }

      tokenData.access_token = body.access_token;
      tokenData.expires_in = Date.now() + (body.expires_in * 1000);

      res.json({ access_token: tokenData.access_token });
    });
  } else {
    res.json({ access_token: tokenData.access_token });
  }
});

app.listen(8881, () => {
  console.log('Server running on http://localhost:8888');
});
