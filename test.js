const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  // Forward console logs
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));

  // Set mock auth cookie
  await page.setCookie({
    name: 'kyl-mock-auth',
    value: 'true',
    domain: 'localhost',
    path: '/',
  });

  console.log("Navigating to /dashboard");
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
  
  console.log("Page title:", await page.title());
  
  await browser.close();
})();
