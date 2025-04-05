import dotenv from "dotenv";
dotenv.config();
// import path from "path";
import { chromium } from "playwright";

const UPDATE_LOCATION_URL =
  " https://www.netflix.com/account/update-primary-location?nftoken=BgiQlevcAxKkAR17E9Et7ScfD50OQpeD4AhalB1KcicF280veVuIbIRE4sI32+PTK4XfZlfrwJKXXNnKGCvaUebxGxg8erAhSApzY7bVFaa3WeT1iIKo7FawELfBSJuH/mSdDkDN/hX8TYhXvcDGpL7PSrkhkTvT1CV/DVuIl3F/YHAJc02Ym1YfkxwLzLtAxlKPnsblCOrlSdcfUE0tZLnOG388yoZSVK9W037xGAYiDgoMIqF5AXzLYEdStkY4&g=ea347790-91db-40c2-af99-194794624de4&lnktrk=EVO&operation=update&lkid=UPDATE_HOUSEHOLD_REQUESTED_OTP_CTA";
const USER_EMAIL = process.env.USER_EMAIL;
const USER_PASSWORD = process.env.USER_PASSWORD;
export async function automateNetflixConfirmation(url = UPDATE_LOCATION_URL) {
  const browser = await chromium.launch({ headless: false }); // Set to true for headless mode
  const page = await browser.newPage();

  try {
    // await page.goto(url || UPDATE_LOCATION_URL);
    console.log("Navigated to Netflix authentication URL.");
    // Step 1: Wait 5 seconds
    console.log("Waiting for 5 seconds...");
    await page.waitForTimeout(5000);
    // // Step 1: Log in to Netflix
    console.log("Logging into Netflix...");
    await page.goto("https://www.netflix.com/login");
    await page.fill('input[name="userLoginId"]', USER_EMAIL); // Replace with your Netflix email
    await page.fill('input[name="password"]', USER_PASSWORD); // Replace with your Netflix password
    await page.click('button[type="submit"]');
    await page.waitForURL("https://www.netflix.com/*", { timeout: 30000 }); // Wait for dashboard
    //     // // Step 2: Trigger device location confirmation (adjust based on Netflix UI)
    // console.log("Triggering device location confirmation...");
    // await page.goto("https://www.netflix.com/youraccount"); // Or wherever the confirmation is triggered
    // await page.click("text=Manage Netflix Household"); // Adjust selector based on actual button text
    // await page.click("text=Send Email"); // Adjust selector based on actual button text
    // // Step 3: Check Gmail for confirmation email
    // const auth = await authorize();
    // console.log("Waiting for confirmation email...");
    // const { link, sentTime } = await checkGmail(auth);
    // console.log(`Found confirmation link: ${link}`);
    // console.log(`Email sent/received at: ${sentTime}`);
    // // Step 4: Confirm the link
    // console.log("Confirming the link...");
    await page.goto(url);
    await page.waitForTimeout(5000);
    await page.click(
      'button[data-uia="set-primary-location-action"][role="button"]'
    ); // Adjust selector based on actual button
    // console.log("Confirmation completed.");
  } catch (err) {
    console.error("Error during automation:", err.message);
  } finally {
    await browser.close();
  }
}

// automateNetflixConfirmation(UPDATE_LOCATION_URL).catch(console.error);
