require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = 3000;

const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.OAUTH_REFRESH_TOKEN;

const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/client-id', (req, res) => {
  res.json({ clientId: CLIENT_ID });
});

app.post('/send-email', async (req, res) => {
  const token = req.body.token;
  console.log('Received token:', token);

  try {
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (payload) {
      console.log('Payload:', payload);

      if (!oAuth2Client.credentials.refresh_token) {
        oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
      }

      const { credentials } = await oAuth2Client.refreshAccessToken();
      console.log('New access token:', credentials.access_token);

      oAuth2Client.setCredentials({
        access_token: credentials.access_token,
        refresh_token: REFRESH_TOKEN
      });

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.MAIL_USERNAME,
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          refreshToken: REFRESH_TOKEN,
          accessToken: credentials.access_token,
        },
      });

      const mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: 'ethansroka2@gmail.com',
        subject: 'Test Email from Nodemailer',
        text: 'Hello, this is a test email sent using Nodemailer with OAuth2!',
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent result:', result);
      res.status(200).send('Email sent successfully: ' + result.response);
    } else {
      res.status(400).send('Invalid token payload');
    }
  } catch (error) {
    console.error('Error verifying token or sending email:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
