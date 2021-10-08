const axios = require("axios");
const JSZip = require("jszip");
const { Storage } = require("@google-cloud/storage");

// HOW TO DOWNLOAD FILE
// https://firebasestorage.googleapis.com/v0/b/xtract-bf4dd.appspot.com/o/FILENAME?alt=media

function getPath() {
  const path = __dirname.split("/");
  path.splice(path.length - 1, 1);
  return path.join("/");
}

const storage = new Storage({
  projectId: "xtract-bf4dd",
  keyFilename: getPath() + "/service-account-key.json",
});
const bucket = storage.bucket("gs://xtract-bf4dd.appspot.com/");

async function getBase64ImagesFromArray(images) {
  const base64Images = [];
  for (const image of images) {
    const imageBase64 = await downloadImageAsBase64(image);
    base64Images.push(imageBase64);
  }
  return base64Images;
}

function uploadFileToStorage(file, fileName) {
  return new Promise((resolve, reject) => {
    const fileStorage = bucket.file(fileName + ".zip");

    const writeStream = fileStorage.createWriteStream({
      public: true,
      predefinedAcl: "publicRead",
    });

    file
      .generateNodeStream({ streamFiles: true })
      .pipe(writeStream)
      .on("finish", function () {
        console.log("FILE WAS WRITTEN");
        resolve();
      });
  });
}

function get_url_extension(url) {
  return url.split(/[#?]/)[0].split(".").pop().trim();
}

async function zipBase64Images(images, imageUrls) {
  const zip = new JSZip();
  for (let i = 0; i < images.length; i++) {
    const url = imageUrls[i];

    let extension = get_url_extension(url);
    if (!extension) {
      extension = "png";
    }

    zip.file("image" + i + "." + extension, images[i], { base64: true });
  }

  return zip;
}

async function downloadImageAsBase64(url) {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });
    const base64 = response.data.toString("base64");
    return base64;
  } catch (e) {
    console.log("error: ", e.response.status);
  }
}

module.exports = {
  getBase64ImagesFromArray,
  uploadFileToStorage,
  zipBase64Images,
};
