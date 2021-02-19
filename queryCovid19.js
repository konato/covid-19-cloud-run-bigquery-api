const { BigQuery } = require('@google-cloud/bigquery');
const moment = require('moment');
const { ValidationError } = require('./error');

/**
 * Validate from and to date to be passed to queries
 * @param {string=} from format YYYY-MM-DD i.e. 2020-11-30
 * @param {string=} to format YYYY-MM-DD i.e. 2020-12-31
 * @return {Object}
 */
function validateFromTo(from, to) {
  // if from date present, check if proper format and valid
  if (from !== null) {
    if (!moment(from, 'YYYY-MM-DD', true).isValid()) {
      throw new ValidationError(
        `from: must be a valid date formated YYYY-MM-DD but is :${from}`
      );
    }
  }

  // if from date present, check if proper format and valid
  if (to !== null) {
    console.log('to validation');
    if (!moment(to, 'YYYY-MM-DD', true).isValid()) {
      console.log('not valid throw');
      throw new ValidationError(
        `to: must be a valid date formated YYYY-MM-DD but is :${to}`
      );
    }
  }

  if ((to !== null && from !== null) || (to === null && from === null)) {
    // to and from must be both present or both absent
  } else {
    console.log(
      'Throwing error 400 from and to data must be both present or absent...'
    );
    throw new ValidationError(
      `from and to date must be both present or absent.`
    );
  }

  // If from or to is null return only 10 last days
  const DEFAULTDAYFROM = 10;
  const fromParam = from
    ? from
    : moment().subtract(DEFAULTDAYFROM, 'days').format('YYYY-MM-DD');
  const toParam = to ? to : moment().format('YYYY-MM-DD');

  if (fromParam > toParam) {
    throw new Error({
      code: 400,
      msg: `parameter from : ${from} 
        must be less than or equal to parameter to : ${to}`,
    });
  }

  return { fromParam: fromParam, toParam: toParam };
}

/**
 * Validate and use Big Query API to get Covid19 from public dataset
 * @param {string} countryCode international country code i.e CA for Canada
 * @param {string=} regionCode region code i.e. QC for province of Quebec
 * @param {string=} subregionName subregion name  i.e. Bas-Saint-Laurent
 * @param {string=} from format YYYY-MM-DD i.e. 2020-11-30
 * @param {string=} to format YYYY-MM-DD i.e. 2020-12-31
 * @return {Object[]} Returns the query result as an objects array.
 */
async function queryCovid19Cases(
  countryCode,
  regionCode,
  subregionName,
  from,
  to
) {
  // make sure from and to date are valid if passed
  const { fromParam, toParam } = validateFromTo(from, to);

  // Queries a public Stack Overflow dataset.

  // Create a client
  const bigqueryClient = new BigQuery();

  let options = null;

  const queryCovid19Start = `SELECT
    date, country_code, country_name, subregion1_code, subregion1_name, 
    subregion2_name, cumulative_confirmed, cumulative_recovered, 
    cumulative_deceased, cumulative_tested, new_confirmed,
    AVG(new_confirmed) OVER (PARTITION BY subregion2_name ORDER BY date ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING) AS avg_new_confirmed_7days
    FROM \`bigquery-public-data.covid19_open_data.covid19_open_data\``;

  if (countryCode != null && regionCode != null && subregionName != null) {
    // case country code, region code and subregion name present
    const sqlQuery =
      queryCovid19Start +
      ` 
      WHERE country_code = @country_code 
      AND subregion1_code = @region_code 
      AND subregion2_name = @subregion_name 
      AND date >= @from AND date <= @to
      LIMIT 1000 `;

    options = {
      query: sqlQuery,
      // Location must match that of the dataset(s) referenced in the query.
      location: 'US',
      params: {
        from: fromParam,
        to: toParam,
        country_code: countryCode,
        region_code: regionCode,
        subregion_name: subregionName,
      },
    };
  } else if (countryCode != null && regionCode != null) {
    // case country code, region code
    const sqlQuery =
      queryCovid19Start +
      ` 
      WHERE country_code = @country_code 
      AND subregion1_code = @region_code 
      AND subregion2_name IS NULL
      AND date >= @from AND date <= @to
      LIMIT 1000 `;

    options = {
      query: sqlQuery,
      // Location must match that of the dataset(s) referenced in the query.
      location: 'US',
      params: {
        from: fromParam,
        to: toParam,
        country_code: countryCode,
        region_code: regionCode,
      },
    };
  } else if (countryCode != null) {
    // case country code only
    const sqlQuery =
      queryCovid19Start +
      ` 
      WHERE country_code = @country_code 
      AND subregion1_code IS NULL 
      AND date >= @from AND date <= @to
      LIMIT 1000 `;

    options = {
      query: sqlQuery,
      // Location must match that of the dataset(s) referenced in the query.
      location: 'US',
      params: {
        from: fromParam,
        to: toParam,
        country_code: countryCode,
      },
    };
  } else {
    // error parameters not valids : require country_code
    //    or country_code and region_code or
    //    or country_code and region_code and subregion_name
    throw new Error({
      code: 400,
      msg: 'You must at least specify a country_code to get results.',
    });
  }

  console.log('Processing query: ', options);
  // Run the query
  const [rows] = await bigqueryClient.query(options);

  console.log('Return rows: ', rows);

  return rows;
}

/**
 * Validate and use Big Query API to get valid Country Codes from data present into public dataset
 * @param {string=} from format YYYY-MM-DD i.e. 2020-11-30
 * @param {string=} to format YYYY-MM-DD i.e. 2020-12-31
 * @return {Object[]} Returns the list of country code and name where there is data available.
 */
async function listCountryCodes(from, to) {
  console.log('Enter listCountryCodes');
  // make sure from and to date are valid if passed
  const { fromParam, toParam } = validateFromTo(from, to);
  // Queries a public Stack Overflow dataset.

  // Create a client
  const bigqueryClient = new BigQuery();

  let options = null;

  const sqlQuery = `SELECT DISTINCT 
  country_code, country_name, 
  FROM \`bigquery-public-data.covid19_open_data.covid19_open_data\` 
  WHERE  date >= @from AND date <= @to
  ORDER BY country_code ASC
  LIMIT 1000 `;

  options = {
    query: sqlQuery,
    // Location must match that of the dataset(s) referenced in the query.
    location: 'US',
    params: {
      from: fromParam,
      to: toParam,
    },
  };

  // console.log('Processing listCountries query: ', options);
  // Run the query
  const [rows] = await bigqueryClient.query(options);

  console.log('Return rows: ', rows);

  return rows;
}

/**
 * Validate and use Big Query API to get valid subregion1 code from data present into public dataset
 * @param {string=} countryCodeParam two letter code ie: 'CA' for Canada
 * @param {string=} from format YYYY-MM-DD i.e. 2020-11-30
 * @param {string=} to format YYYY-MM-DD i.e. 2020-12-31
 * @return {Object[]} Returns the list of subregion1 code and name where there is data available.
 */
async function listSubregion1Codes(countryCodeParam, from, to) {
  console.log('Enter listRegion1Codes');
  // make sure from and to date are valid if passed
  const { fromParam, toParam } = validateFromTo(from, to);
  // Queries a public Stack Overflow dataset.

  // Create a client
  const bigqueryClient = new BigQuery();

  let options = null;

  const sqlQuery = `SELECT DISTINCT 
  country_code, country_name, subregion1_code, subregion1_name
  FROM \`bigquery-public-data.covid19_open_data.covid19_open_data\` 
  WHERE  date >= @from AND date <= @to
  AND country_code = @country_code
  AND subregion1_code IS NOT NULL
  ORDER BY subregion1_code ASC
  LIMIT 1000 `;

  options = {
    query: sqlQuery,
    // Location must match that of the dataset(s) referenced in the query.
    location: 'US',
    params: {
      from: fromParam,
      to: toParam,
      country_code: countryCodeParam,
    },
  };

  // console.log('Processing listCountries query: ', options);
  // Run the query
  const [rows] = await bigqueryClient.query(options);

  console.log('Return rows: ', rows);

  return rows;
}

/**
 * Validate and use Big Query API to get valid subregion1 code from data present into public dataset
 * @param {string=} countryCodeParam two letter code ie: 'CA' for Canada
 * @param {string=} subregion1CodeParam two letter code ie: 'QC' for Quebec
 * @param {string=} from format YYYY-MM-DD i.e. 2020-11-30
 * @param {string=} to format YYYY-MM-DD i.e. 2020-12-31
 * @return {Object[]} Returns the list of subregion2 name where there is data available.
 */
async function listSubregion2Names(
  countryCodeParam,
  subregion1CodeParam,
  from,
  to
) {
  console.log('Enter listSubregion2Names');
  // make sure from and to date are valid if passed
  const { fromParam, toParam } = validateFromTo(from, to);
  // Queries a public Stack Overflow dataset.

  // Create a client
  const bigqueryClient = new BigQuery();

  let options = null;

  const sqlQuery = `SELECT DISTINCT 
  country_code, country_name, subregion1_code, subregion1_name, subregion2_name
  FROM \`bigquery-public-data.covid19_open_data.covid19_open_data\` 
  WHERE  date >= @from AND date <= @to
  AND country_code = @country_code
  AND subregion1_code = @subregion1_code
  AND subregion2_name IS NOT NULL
  ORDER BY subregion2_name ASC
  LIMIT 1000 `;

  options = {
    query: sqlQuery,
    // Location must match that of the dataset(s) referenced in the query.
    location: 'US',
    params: {
      from: fromParam,
      to: toParam,
      country_code: countryCodeParam,
      subregion1_code: subregion1CodeParam,
    },
  };

  // console.log('Processing listCountries query: ', options);
  // Run the query
  const [rows] = await bigqueryClient.query(options);

  console.log('Return rows: ', rows);

  return rows;
}

module.exports = {
  queryCovid19Cases,
  listCountryCodes,
  listSubregion1Codes,
  listSubregion2Names,
};
