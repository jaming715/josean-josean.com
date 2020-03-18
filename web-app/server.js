const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const schedule = require('node-schedule');
const caseBot = require('./data-bots/case-bot.js');
const allDataBot = require('./data-bots/all-data-bot.js');
const johnBot = require('./data-bots/john-bot.js');
const helper = require('./data-bots/helper-bot.js');

const app = express();
const apiUrl = '/api';
const port = process.env.PORT || '3000';
const johnHopEndpoint = 'http://localhost:3000/api/johnHopData';

app.set('views', './views');
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(apiUrl + '/caseCounts', async (req, res) => {
  const cases = await caseBot.getJSON();
  res.send(cases);
});

app.use(apiUrl + '/whoData', async (req, res) => {
  const data = await allDataBot.getJSON();
  console.log(data.length);
  res.send(data);
});

app.use(apiUrl + '/johnHopData', async (req, res) => {
  res.sendFile(path.join(__dirname, './data/john-data.json'));
});

const johnUpdateJob = schedule.scheduleJob('0 0 */1 * * *', async function() {
  await johnBot.getJSON();
});

async function setup() {
  try {
    const countries = await helper.getJohnDataFile();
    if (countries) {
      countries.forEach(country => {
        if (country.code != '--') {
          app.get(`/${country.code}`, function(req, res) {
            res.render('country', {
              name: country.location,
              totCases: country.totCases,
              totDeaths: country.totDeaths,
              totRecovered: country.totRecovered,
            });
          });
        }
      });
    }
  } catch (err) {
    console.log('Error retrieving countries', err);
  }

  app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
  });
}
setup();