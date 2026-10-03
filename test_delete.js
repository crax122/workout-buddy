const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Accept dialogs automatically
  page.on('dialog', async dialog => {
    console.log("Dialog appeared:", dialog.message());
    await dialog.accept();
  });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  await page.goto('http://localhost:8081/workout-buddy', { waitUntil: 'networkidle0' });
  
  console.log("Navigated to app");
  
  // Assuming login is required
  // Let's just create an account or login
  await page.waitForSelector('input[placeholder="Email"]');
  await page.type('input[placeholder="Email"]', 'test@test.com');
  await page.type('input[placeholder="Password"]', 'password123');
  
  const buttons = await page.$$('div[role="button"]');
  for (let btn of buttons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text.includes('LOGIN') || text.includes('REGISTER')) {
          await btn.click();
          break;
      }
  }
  
  await page.waitForTimeout(3000);
  console.log("Logged in");
  
  // Let's see if history exists
  let historyText = await page.evaluate(() => document.body.innerText);
  if (!historyText.includes('History')) {
      console.log("No history found, let's create a workout");
      // Create a workout...
  }

  const deleteButtons = await page.$$('div[role="button"]');
  let deleted = false;
  for (let btn of deleteButtons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text.includes('❌')) {
          console.log("Found delete button, clicking...");
          await btn.click();
          deleted = true;
          break;
      }
  }

  await page.waitForTimeout(2000);
  console.log("Testing complete");
  await browser.close();
})();
