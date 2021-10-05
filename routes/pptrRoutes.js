const express = require("express");
const puppeteer = require("puppeteer");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const Xtract = require("../models/XtractModel");

const router = express.Router();

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36";

const pptrConfig = {
  headless: true,
  devtools: true,
  args: [
    "--disable-web-security",
    "--disable-features=IsolateOrigins",
    " --disable-site-isolation-trials",
    "--no-sandbox",
  ],
};

// TODO: fix puppeteer browser close bug
router.get("/scrape", async (req, res) => {
  const { url, target } = req.query;
  const uid = uuidv4();
  performPuppetTask(url, target, uid);
  res.send(uid);
});

router.get("/detect/:uid", async (req, res) => {
  const { uid } = req.params;
  console.log("SEARCHING FOR...", uid);
  const xtract = await Xtract.findOne({ uid: uid });
  if (!xtract) {
    console.log("No data available yet...");
  }
  try {
    return res.json(xtract);
  } catch (error) {
    return res.json({ error: "Error detecting extraction..." });
  }
});

module.exports = router;

// helper functions //

async function performPuppetTask(url, target, uid) {
  console.log("backend reached...");
  try {
    const browser = await puppeteer.launch(pptrConfig);
    console.log("CREATING PAGE");

    const browserPage = await browser.newPage();
    browserPage.setUserAgent(USER_AGENT);

    let startTime = Date.now();
    console.log("NAVIGATING PAGE");

    await browserPage.goto(url, {
      timeout: 90 * 1000,
      waitUntil: "networkidle2",
    });
    console.log("NAVIGATION COMPLETE: ", Date.now() - startTime);
    console.log("TARGET: ", target);

    const result = await quizletScrape(browserPage, target);
    await browser.close();

    console.log("puppeteer retrieval success! ✅ ");
    console.log("result: ", result);

    storeExtractedData(uid, result);
  } catch (error) {
    console.log("puppeteer failed... ❌", error);
  }
}

const storeExtractedData = async (id, data) => {
  const newXtract = await Xtract.create({ uid: id, result: data });
  console.log(
    "// NEW EXTRACTED DATA //",
    newXtract,
    "// NEW EXTRACTED DATA //"
  );
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
