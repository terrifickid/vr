const axios = require("axios");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = "downloaded_photos";
const API_KEY = "LIVE_421e08df2c8e07c263b10dbeb14fdfa2";
const baseurl = "https://api.myvr.com/v1/photos/";

const fetchPhotos = async () => {
  var url = baseurl;
  while (url) {
    try {
      const response = await axios.get("https://api.myvr.com/v1/photos/", {
        headers: {
          Authorization: `Basic ${Buffer.from(`${API_KEY}:`).toString(
            "base64"
          )}`,
        },
      });

      var photos = response.data.results;
      await download(photos);

      url = response.data.next
        ? response.data.next.slice(baseurl.length)
        : null;
    } catch (error) {
      console.error(`Error fetching photos: ${error.message}`);
    }
  }
};

const download = async (photos) => {
  // Ensure the output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }
  // Download and save photos
  const downloadPromises = photos.map(async (photo, index) => {
    console.log("downloading...");
    const imageUrl = photo.downloadUrl;

    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });

    const outputDirPath = path.join(OUTPUT_DIR, photo.property.id);
    const outputFilePath = path.join(outputDirPath, `${photo.id}.jpg`);
    try {
      if (!fs.existsSync(outputDirPath)) {
        fs.mkdirSync(outputDirPath, { recursive: true });
      }
      fs.writeFileSync(outputFilePath, imageResponse.data);
      console.log(`Downloaded ${photo.id}.jpg`);
    } catch (error) {
      console.error(`Error writing file ${outputFilePath}: ${error.message}`);
    }
  });
  await Promise.all(downloadPromises);
  console.log("All photos have been downloaded successfully!");
};

fetchPhotos();
