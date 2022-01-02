const util = require('util')
util.inspect.defaultOptions.depth = null;
const crypto = require('crypto')
const puppeteer = require('puppeteer')
const axios = require('axios')

const TESLA_CLIENT_ID = '81527cff06843c8634fdc09e8ac0abefb46ac849f38fe1e431c2ef2106796384';
const TESLA_CLIENT_SECRET = 'c7257eb71a564034f9419ee651c7d0e5f7aa6bfbd18bafb5c5c033b093bb2fa3';

const teslaLogin = async function (email, password) {
  // this seems to be how Tesla serializes params
  const paramsSerializer = (params) => {
    return Object.keys(params).map(key => {
      return `${key}=${encodeURIComponent(params[key]).replace(/%20/g, '+').replace(/%3A/g, ':')}`;
    }).join('&');
  };

  // set up variables for initial login page
  const redirect_uri = 'https://auth.tesla.com/void/callback';
  const state = '123';
  const code_verifier = crypto.randomBytes(64).toString('base64').replace(/[+/=]/g, m => ({ '+': '-', '/': '_' }[m] || ''));
  const code_challenge = crypto.createHash('sha256')
    .update(code_verifier)
    .digest('base64')
    .replace(/[+/=]/g, m => ({ '+': '-', '/': '_' }[m] || ''));
  const queryParams = {
    client_id: 'ownerapi',
    code_challenge,
    code_challenge_method: 'S256',
    redirect_uri,
    response_type: 'code',
    scope: 'openid email offline_access',
    state,
    login_hint: email,
  };
  const queryString = paramsSerializer(queryParams);
  const url = `https://auth.tesla.com/oauth2/v3/authorize?${queryString}`;

  // launch a browser (does not work in headless mode and I haven't figured out why yet)
  const browser = await puppeteer.launch({ headless: false });
  let page

  // navigate to login page with a good user agent and caching disabled
  const setUpPage = async () => {
    const p = await browser.newPage();
    // constantly changing part of the version string seems to help
    await p.setUserAgent(`ZornCoTeslaIntegration/1.0.${+new Date()}`);
    await p.setCacheEnabled(false);
    await p.goto(url, { waitUntil: 'networkidle0' });
    await p.waitForTimeout(1000);
    // clicking on the page a few times seems to help
    await p.click('#main-content');
    await p.click('#form-input-credential');
    await p.click('#main-content');
    return p;
  };
  page = await setUpPage();

  const handleCaptcha = async () => {
    const hasCaptcha = await page.evaluate(() => document.querySelector('iframe[title="reCAPTCHA"]') !== null);
    if (hasCaptcha) {
      const captchaIframe = (await page.waitForSelector('iframe[title="reCAPTCHA"]'));
      const frame = (await captchaIframe.contentFrame());
      await frame.evaluate(() => {
        (document.querySelector('.recaptcha-checkbox')).click();
      });
      let imagePicker
      try {
        imagePicker = await page.waitForSelector('iframe[title="recaptcha challenge expires in two minutes"]', { timeout: 1000 });
      } catch (e) {
        console.log(e);
      }
      if (imagePicker) {
        throw new Error('Cannot automatically solve image picker!');
      }
    }
  };

  const submitForm = async () => {
    await handleCaptcha();
    const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
    await page.type('.sign-in-form input[name="credential"]', password);
    await page.click('#form-submit-continue');
    await navigationPromise;
  };

  try {
    // fill out password and submit form
    await submitForm();

    // keep trying until we get a successful redirect
    let retryCount = 0;
    while (retryCount < 10 && !page.url().startsWith('https://auth.tesla.com/void/callback')) {
      console.log('retry');
      retryCount++;
      if (await page.title() === 'Challenge Validation') {
        console.log('Challenge Validation');
        // unfortunately, this takes upwards of 30 seconds
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 32000 });
        } catch (e) {
          // reload if no navigation after 32 seconds
          await page.reload();
        }
        await submitForm();
      } else if (await page.title() === 'Access Denied') {
        console.log('Access Denied');
        await page.goto(url, { waitUntil: 'networkidle0' });
        await page.close();
        page = await setUpPage();
        // adding a reload seems to help
        await page.reload({ waitUntil: 'networkidle0' });
        await submitForm();
      } else {
        console.log('else');
        await submitForm();
      }
    }
    if (!page.url().startsWith('https://auth.tesla.com/void/callback')) {
      console.log('failed, start over');
      await browser.close();
      return teslaLogin(email, password);
    }
    console.log('success');
  } catch (e) {
    if (e.message === 'Cannot automatically solve image picker!') {
      console.log('CAPTCHA image picker, starting over');
      await browser.close();
      return teslaLogin(email, password);
    } else {
      throw e;
    }
  }
  // grab the latest cookies
  const cookies = await page.cookies();
  // grab the callback URL for the code
  const callbackUrl = page.url();
  // close the browser to free up resources
  await browser.close();

  // set up code and cookie string for next requests
  const code = new URL(callbackUrl).searchParams.get('code');
  const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

  try {
    // get initial access token
    const accessTokenRes = await axios.post('https://auth.tesla.com/oauth2/v3/token', {
      grant_type: 'authorization_code',
      client_id: 'ownerapi',
      code,
      code_verifier,
      redirect_uri,
    }, {
      headers: {
        Cookie: cookieString,
      },
    });
    // upgrade access token and get refresh token
    const tokenRes = await axios.post('https://owner-api.teslamotors.com/oauth/token', {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      client_id: TESLA_CLIENT_ID,
      client_secret: TESLA_CLIENT_SECRET,
    }, {
      headers: {
        Authorization: `Bearer ${accessTokenRes.data.access_token}`,
        Cookie: cookieString,
      },
    });
    // this is what we want!
    console.log(tokenRes.data);
    return tokenRes.data;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      if (e.response) {
        console.log({
          status: e.response.status,
          responseHeaders: e.response.headers,
          responseData: e.response.data,
        });
      }
    } else {
      console.error(e);
    }
    throw e;
  }
}

module.exports = { teslaLogin }