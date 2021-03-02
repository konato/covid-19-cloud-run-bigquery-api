const express = require('express');
const app = express();
const { ValidationError } = require('./error');
const {
  queryCovid19Cases,
  listCountryCodes,
  listSubregion1Codes,
  listSubregion2Names,
} = require('./queryCovid19');

app.get('/', async (req, res, next) => {
  // extract query parameters if present
  console.log(req.query);
  const list = req.query.list ? req.query.list : false;
  console.log('list value: ' + list);
  const from = req.query.from ? req.query.from : null;
  const to = req.query.to ? req.query.to : null;

  if (list === 'true') {
    try {
      const data = await listCountryCodes(from, to);
      res.json(data);
    } catch (error) {
      return next(error);
    }
  } else {
    try {
      err = new ValidationError(
        'You must at least specify a country_code to get results i.e. /US or /CA or ...'
      );
      throw err;
    } catch (error) {
      return next(error);
    }
  }
});

app.get('/version', async (req, res) => {
  res.send({
    version_tag: process.env.VERSION_TAG,
    version_hash: process.env.VERSION_HASH,
    build_datetime: process.env.BUILD_DATETIME,
  });
});

app.get('/:countryCode', async (req, res, next) => {
  const countryCode = req.params.countryCode;
  const from = req.query.from ? req.query.from : null;
  const to = req.query.to ? req.query.to : null;
  const list = req.query.list ? req.query.list : false;
  console.log('list value: ' + list);

  if (list === 'true') {
    try {
      const data = await listSubregion1Codes(countryCode, from, to);
      res.json(data);
    } catch (error) {
      return next(error);
    }
  } else {
    try {
      const data = await queryCovid19Cases(countryCode, null, null, from, to);
      res.json(data);
    } catch (error) {
      return next(error);
    }
  }
});

app.get('/:countryCode/:regionCode', async (req, res, next) => {
  const countryCode = req.params.countryCode;
  const regionCode = req.params.regionCode;
  const from = req.query.from ? req.query.from : null;
  const to = req.query.to ? req.query.to : null;

  const list = req.query.list ? req.query.list : false;
  console.log('list value: ' + list);

  if (list === 'true') {
    try {
      const data = await listSubregion2Names(countryCode, regionCode, from, to);
      res.json(data);
    } catch (error) {
      return next(error);
    }
  } else {
    try {
      const data = await queryCovid19Cases(
        countryCode,
        regionCode,
        null,
        from,
        to
      );
      res.json(data);
    } catch (error) {
      return next(error);
    }
  }
});

app.get('/:countryCode/:regionCode/:subregionName', async (req, res, next) => {
  const countryCode = req.params.countryCode;
  const regionCode = req.params.regionCode;
  const subregionName = req.params.subregionName;
  const from = req.query.from ? req.query.from : null;
  const to = req.query.to ? req.query.to : null;

  try {
    const data = await queryCovid19Cases(
      countryCode,
      regionCode,
      subregionName,
      from,
      to
    );
    res.json(data);
  } catch (error) {
    return next(error);
  }
});

app.use(function (error, req, res, next) {
  if (error instanceof ValidationError) {
    console.log('Validation Error');
    res.status(400).json({ error: error.message });
  } else {
    res.sendStatus(500);
  }
  console.log(error);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`covid19-api: listening on port ${port}`);
});
