const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;

const sinon = require('sinon');

const proxyquire = require('proxyquire');

const { ValidationError } = require('../error');
const {
  queryCovid19Cases,
  listCountryCodes,
  listSubregion1Codes,
  listSubregion2Names,
} = require('../queryCovid19');

describe('smoke test', function () {
  it('checks equality', function () {
    expect(true).to.be.true;
  });
});

describe('verify async/await', () => {
  it('should work well with async/await', async function () {
    expect(await Promise.resolve(42)).to.be.equal(42);
  });
  it('error should work well with async/await', async function () {
    // expect(await Promise.reject(new Error())).to.be.rejected;
    try {
      await Promise.reject(new Error('Argument must be a number'));
      throw new Error('This will not run');
    } catch (e) {
      expect(e).to.be.instanceOf(Error);
      expect(e.message).to.eql('Argument must be a number');
    }
  });
});

describe('queryCovid19 from parameters validation', function () {
  it('if "from" present to "must" be present too.', async () => {
    await expect(
      queryCovid19Cases('CA', 'QC', 'Bas-Saint-Laurent', '2020-10-01', null)
    ).rejectedWith(
      ValidationError,
      `from and to date must be both present or absent.`
    );
  });

  it('from must be a valid YYYY-MM-DD date, test rejection with an invalid date', async () => {
    const invalidDate = '2020-11-31';
    await expect(
      queryCovid19Cases('CA', 'QC', 'Bas-Saint-Laurent', invalidDate, null)
    ).rejectedWith(
      ValidationError,
      `from: must be a valid date formated YYYY-MM-DD but is :${invalidDate}`
    );
  });

  it('to must be a valid YYYY-MM-DD date, test rejetion with an invalid date', async () => {
    const invalidDate = '2020-11-31';
    await expect(
      queryCovid19Cases(
        'CA',
        'QC',
        'Bas-Saint-Laurent',
        '2020-11-01',
        invalidDate
      )
    ).rejectedWith(
      ValidationError,
      `to: must be a valid date formated YYYY-MM-DD but is :${invalidDate}`
    );
  });
});

describe('queryCovid19 valid request', function () {
  let queryStub;
  let BQ;
  beforeEach(() => {
    rows = [{ id: 1 }, { id: 2 }];
    queryStub = sinon.stub().returns([rows]);

    BQ = proxyquire('../queryCovid19', {
      '@google-cloud/bigquery': {
        BigQuery: sinon.stub().callsFake(() => {
          return {
            query: queryStub,
          };
        }),
      },
    });
  });
  afterEach(() => {
    sinon.restore();
  });

  it('Check call with countryCode parameter.', async () => {
    try {
      const res = await BQ.queryCovid19Cases('CA', null, null, null, null);
      console.log(res);
      expect(res).to.be.an('array');
    } catch (e) {
      console.log('Country Should not come here.', e);
      throw e;
    }
  });

  it('Check call with countryCode and regionCode parameters.', async () => {
    try {
      const res = await BQ.queryCovid19Cases('CA', 'QC', null, null, null);
      console.log(res);
      expect(res).to.be.an('array');
    } catch (e) {
      console.log('Country, Region Should not come here.', e);
      throw e;
    }
  });

  it('Check call with countryCode, regionCode and subregionName parameters.', async () => {
    try {
      const res = await BQ.queryCovid19Cases(
        'CA',
        'QC',
        'Bas-Saint-Laurent',
        null,
        null
      );
      console.log(res);
      expect(res).to.be.an('array');
    } catch (e) {
      console.log('Country, Region, SubRegion Name Should not come here.', e);
      throw e;
    }
  });

  it('Check call with countryCode, regionCode, subregionName, from and to parameters.', async () => {
    const fakeCountryCode = 'CA';
    const fakeRegionCode = 'QC';
    const fakeSubregionName = 'Bas-Saint-Laurent';
    const fakeFrom = '2020-10-01';
    const fakeTo = '2020-10-31';

    //    try {
    const res = await BQ.queryCovid19Cases(
      fakeCountryCode,
      fakeRegionCode,
      fakeSubregionName,
      fakeFrom,
      fakeTo
    );
    console.log(res);
    expect(res).to.be.an('array');
    const queryArgs = queryStub.firstCall.args;
    expect(queryArgs[0].params).to.have.property(
      'country_code',
      fakeCountryCode
    );
    expect(queryArgs[0].params).to.have.property('region_code', fakeRegionCode);
    expect(queryArgs[0].params).to.have.property(
      'subregion_name',
      fakeSubregionName
    );
    expect(queryArgs[0].params).to.have.property('to', fakeTo);
    expect(queryArgs[0].params).to.have.property('from', fakeFrom);
  });
});

// listCountryCodes call

describe('listCountryCodes from parameters validation', function () {
  it('if "from" present to "must" be present too.', async () => {
    await expect(listCountryCodes('2020-10-01', null)).rejectedWith(
      ValidationError,
      `from and to date must be both present or absent.`
    );
  });

  it('from must be a valid YYYY-MM-DD date, test rejection with an invalid date', async () => {
    const invalidDate = '2020-11-31';
    await expect(listCountryCodes(invalidDate, null)).rejectedWith(
      ValidationError,
      `from: must be a valid date formated YYYY-MM-DD but is :${invalidDate}`
    );
  });

  it('to must be a valid YYYY-MM-DD date, test rejetion with an invalid date', async () => {
    const invalidDate = '2020-11-31';
    await expect(listCountryCodes('2020-11-01', invalidDate)).rejectedWith(
      ValidationError,
      `to: must be a valid date formated YYYY-MM-DD but is :${invalidDate}`
    );
  });
});

describe('listCountryCodes valid request', function () {
  let queryStub;
  let BQ;
  beforeEach(() => {
    rows = [{ id: 1 }, { id: 2 }];
    queryStub = sinon.stub().returns([rows]);

    BQ = proxyquire('../queryCovid19', {
      '@google-cloud/bigquery': {
        BigQuery: sinon.stub().callsFake(() => {
          return {
            query: queryStub,
          };
        }),
      },
    });
  });
  afterEach(() => {
    sinon.restore();
  });

  it('Check call with no parameter.', async () => {
    try {
      const res = await BQ.listCountryCodes(null, null);
      console.log(res);
      expect(res).to.be.an('array');
    } catch (e) {
      console.log('Country Should not come here.', e);
      throw e;
    }
  });

  it('Check call from and to parameters.', async () => {
    const fakeFrom = '2020-10-01';
    const fakeTo = '2020-10-31';

    //    try {
    const res = await BQ.listCountryCodes(fakeFrom, fakeTo);
    console.log(res);
    expect(res).to.be.an('array');
    const queryArgs = queryStub.firstCall.args;
    expect(queryArgs[0].params).to.have.property('to', fakeTo);
    expect(queryArgs[0].params).to.have.property('from', fakeFrom);
  });
});

// listSubregion1Codes call

describe('listSubregion1Codes from parameters validation', function () {
  it('if "from" present to "must" be present too.', async () => {
    await expect(listSubregion1Codes('CA', '2020-10-01', null)).rejectedWith(
      ValidationError,
      `from and to date must be both present or absent.`
    );
  });

  it('from must be a valid YYYY-MM-DD date, test rejection with an invalid date', async () => {
    const invalidDate = '2020-11-31';
    await expect(listSubregion1Codes('CA', invalidDate, null)).rejectedWith(
      ValidationError,
      `from: must be a valid date formated YYYY-MM-DD but is :${invalidDate}`
    );
  });

  it('to must be a valid YYYY-MM-DD date, test rejetion with an invalid date', async () => {
    const invalidDate = '2020-11-31';
    await expect(
      listSubregion1Codes('CA', '2020-11-01', invalidDate)
    ).rejectedWith(
      ValidationError,
      `to: must be a valid date formated YYYY-MM-DD but is :${invalidDate}`
    );
  });
});

describe('listSubregion1 valid request', function () {
  let queryStub;
  let BQ;
  beforeEach(() => {
    rows = [{ id: 1 }, { id: 2 }];
    queryStub = sinon.stub().returns([rows]);

    BQ = proxyquire('../queryCovid19', {
      '@google-cloud/bigquery': {
        BigQuery: sinon.stub().callsFake(() => {
          return {
            query: queryStub,
          };
        }),
      },
    });
  });
  afterEach(() => {
    sinon.restore();
  });

  it('Check call with no parameter.', async () => {
    try {
      const res = await BQ.listSubregion1Codes('CA', null, null);
      console.log(res);
      expect(res).to.be.an('array');
    } catch (e) {
      console.log('Country Should not come here.', e);
      throw e;
    }
  });

  it('Check call from and to parameters.', async () => {
    const fakeCountryCode = 'CA';
    const fakeFrom = '2020-10-01';
    const fakeTo = '2020-10-31';

    //    try {
    const res = await BQ.listSubregion1Codes(fakeCountryCode, fakeFrom, fakeTo);
    console.log(res);
    expect(res).to.be.an('array');
    const queryArgs = queryStub.firstCall.args;
    expect(queryArgs[0].params).to.have.property(
      'country_code',
      fakeCountryCode
    );
    expect(queryArgs[0].params).to.have.property('to', fakeTo);
    expect(queryArgs[0].params).to.have.property('from', fakeFrom);
  });
});

// listSubregion2Name call

describe('listSubregion2Names from parameters validation', function () {
  it('if "from" present to "must" be present too.', async () => {
    await expect(
      listSubregion2Names('CA', 'QC', '2020-10-01', null)
    ).rejectedWith(
      ValidationError,
      `from and to date must be both present or absent.`
    );
  });

  it('from must be a valid YYYY-MM-DD date, test rejection with an invalid date', async () => {
    const invalidDate = '2020-11-31';
    await expect(
      listSubregion2Names('CA', 'QC', invalidDate, null)
    ).rejectedWith(
      ValidationError,
      `from: must be a valid date formated YYYY-MM-DD but is :${invalidDate}`
    );
  });

  it('to must be a valid YYYY-MM-DD date, test rejetion with an invalid date', async () => {
    const invalidDate = '2020-11-31';
    await expect(
      listSubregion2Names('CA', 'QC', '2020-11-01', invalidDate)
    ).rejectedWith(
      ValidationError,
      `to: must be a valid date formated YYYY-MM-DD but is :${invalidDate}`
    );
  });
});

describe('listSubregion2Names valid request', function () {
  let queryStub;
  let BQ;
  beforeEach(() => {
    rows = [{ id: 1 }, { id: 2 }];
    queryStub = sinon.stub().returns([rows]);

    BQ = proxyquire('../queryCovid19', {
      '@google-cloud/bigquery': {
        BigQuery: sinon.stub().callsFake(() => {
          return {
            query: queryStub,
          };
        }),
      },
    });
  });
  afterEach(() => {
    sinon.restore();
  });

  it('Check call with no parameter.', async () => {
    try {
      const res = await BQ.listSubregion2Names('CA', 'QC', null, null);
      console.log(res);
      expect(res).to.be.an('array');
    } catch (e) {
      console.log('listSubRegion2Names Should not come here.', e);
      throw e;
    }
  });

  it('Check call from and to parameters.', async () => {
    const fakeCountryCode = 'CA';
    const fakeSubregion1Code = 'QC';
    const fakeFrom = '2020-10-01';
    const fakeTo = '2020-10-31';

    //    try {
    const res = await BQ.listSubregion2Names(
      fakeCountryCode,
      fakeSubregion1Code,
      fakeFrom,
      fakeTo
    );
    console.log(res);
    expect(res).to.be.an('array');
    const queryArgs = queryStub.firstCall.args;
    expect(queryArgs[0].params).to.have.property(
      'country_code',
      fakeCountryCode
    );
    expect(queryArgs[0].params).to.have.property(
      'subregion1_code',
      fakeSubregion1Code
    );
    expect(queryArgs[0].params).to.have.property('to', fakeTo);
    expect(queryArgs[0].params).to.have.property('from', fakeFrom);
  });
});
