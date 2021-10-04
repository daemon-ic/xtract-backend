const express = require("express");
const puppeteer = require("puppeteer");
const router = express.Router();

// NOTES: browser close, get adrians help to not implode my server
// puppeteer bug
router.get("/scrape", async (req, res) => {
  console.log("backend reached...");
  const { url, target } = req.query;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      devtools: true,
      args: [
        "--disable-web-security",
        "--disable-features=IsolateOrigins",
        " --disable-site-isolation-trials",
        "--no-sandbox",
      ],
    });
    console.log("CREATING PAGE");
    const browserPage = await browser.newPage();
    let startTime = Date.now();
    console.log("NAVIGATING PAGE");
    await browserPage.goto(url, {
      timeout: 90 * 1000,
      waitUntil: "networkidle2",
    });
    console.log("NAVIGATION COMPLETE: ", Date.now() - startTime);

    const result = await quizletScrape(browserPage, target);
    await browser.close();
    console.log("puppeteer retrieval success! ✅ ");
    res.json({ result: result });
  } catch (error) {
    console.log("puppeteer failed... ❌", error);
  }
});

module.exports = router;

const getAllOfElement = async (page, targetBeingPassed) => {
  return await page.evaluate((passedTarget) => {
    let scrapedElements = document.querySelectorAll(`${passedTarget}`);
    const elements = [...scrapedElements];
    return elements.map((element) => element.innerText);
  }, targetBeingPassed);
};

const quizletScrape = async (page, targetBeingPassed) => {
  return await page.evaluate((passedTarget) => {
    const cleanArray = [];
    const scrapedArray = document.querySelectorAll(`${passedTarget}`);
    const array = [...scrapedArray];
    for (let i = 0; i < array.length; i++) {
      cleanArray.push(array[i].textContent);
    }
    return cleanArray;
  }, targetBeingPassed);
};
