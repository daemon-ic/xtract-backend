const express = require("express");
const puppeteer = require("puppeteer");
const { v4: uuidv4 } = require("uuid");
const Xtract = require("../models/XtractModel");
const axios = require("axios");
const {
  getBase64ImagesFromArray,
  uploadFileToStorage,
  zipBase64Images,
} = require("../utils/imageUtils");
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
  const { url, target, name } = req.query;
  const uid = uuidv4();
  performPuppetTask(url, target, name, uid);
  res.send(uid);
});

router.get("/detect/:uid", async (req, res) => {
  console.log("BACKEND DETECTION REACHED!");
  const { uid } = req.params;
  console.log("SEARCHING FOR...", uid);
  const xtract = await Xtract.findOne({ uid: uid });

  if (!xtract) {
    console.log("DETECTION STATUS - NO DATA YET... ❌");
    return res.json(undefined);
  }

  try {
    //------------------------------------------------------------------------- FOR IMAGE URL

    // if (xtract && xtract.result) {
    //   console.log("DETECTION STATUS - DATA EXISTS! ✅");
    //   console.log("EXTRACTION IS TEXT TYPE");
    //   return res.json(xtract);
    // }
    //------------------------------------------------------------------------- FOR IMAGE URL
    //------------------------------------------------------------------------- FOR IMAGE ZIP DOWNLOAD
    if (xtract && xtract.result && xtract.result.text) {
      console.log("DETECTION STATUS - DATA EXISTS! ✅");
      console.log("EXTRACTION IS TEXT TYPE");
      return res.json(xtract);
    }
    if (xtract && xtract.result && xtract.result.images) {
      console.log("DETECTION STATUS - DATA EXISTS! ✅");
      console.log("EXTRACTION IS IMAGE TYPE");
      const images = await getImageUrlList(xtract.result.images);
      const base64Images = await getBase64ImagesFromArray(images);
      console.log("CONVERTED IMAGES TO BASE64");
      const zipFile = await zipBase64Images(base64Images, images);
      console.log("ZIP FILE GENEREATED");
      await uploadFileToStorage(zipFile, xtract.name);
      console.log("ZIP UPLOADED");
      return res.json(xtract);
    }
    //------------------------------------------------------------------------- FOR IMAGE ZIP DOWNLOAD
  } catch (error) {
    return res.json({ error: "Error detecting extraction..." });
  }
});

module.exports = router;

//  ------------------------------------------------------------------  HELPERS

const getImageUrlList = async (data) => {
  const images = [];
  const validImageTypes = ["png", "jpg", "jpeg", "gif"];
  for (let i = 0; i < data.length; i++) {
    if (!data[i].includes("http")) continue;
    if (!data[i]) continue;
    const urlSplit = data[i].split(".");
    const imageType = urlSplit[urlSplit.length - 1].toLowerCase();

    // if (!validImageTypes.includes(imageType)) {
    //   continue;
    //}
    images.push(data[i]);
  }

  return images;
};

async function performPuppetTask(url, target, name, uid) {
  console.log("BEGINNING PUPPETTEER TASKS...");
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

    console.log("PUPPETEER RETRIEVAL SUCCESS! ✅ ");
    console.log("result: ", result);

    storeExtractedData(name, uid, result);
  } catch (error) {
    console.log("PUPPETTEER FAILURE... ❌", error);
  }
}

const storeExtractedData = async (name, id, data) => {
  const newXtract = await Xtract.create({ name: name, uid: id, result: data });
  console.log(
    "// NEW EXTRACTED DATA //",
    newXtract,
    "// NEW EXTRACTED DATA //"
  );
};

const quizletScrape = async (page, targetBeingPassed) => {
  return await page.evaluate((passedTarget) => {
    const cleanData = {};
    const cleanArray = [];

    // TODO PASS VIDEO HERE

    if (passedTarget === "img" || passedTarget == "video") {
      console.log("I AM AN IMAGE");
      const scrapedImages = document.getElementsByTagName(`${passedTarget}`);
      // const scrapedImages = document.getElementsByTagName(`video`);
      const images = [...scrapedImages];
      for (var i = 0; i < images.length; i++) {
        cleanArray.push(images[i].src);
        cleanData[passedTarget === "img" ? "images" : "videos"] = cleanArray;
      }
    } else {
      const scrapedArray = document.querySelectorAll(`${passedTarget}`);
      const array = [...scrapedArray];
      for (let i = 0; i < array.length; i++) {
        cleanArray.push(array[i].textContent);
        cleanData["text"] = cleanArray;
      }
    }

    return cleanData;
  }, targetBeingPassed);
};
