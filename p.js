const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API_KEY = "LIVE_421e08df2c8e07c263b10dbeb14fdfa2";
const OUTPUT_DIR = "downloaded_photos";

const downloadPhotos = async () => {
  try {
    // Ensure the output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR);
    }

    // Configure axios instance for MyVR API
    const myVRApi = axios.create({
      baseURL: "https://api.myvr.com/v1",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    // Fetch photos
    const {
      data: { results },
    } = await myVRApi.get("/photos/");

    // Download and save photos
    const downloadPromises = results.map(async (photo, index) => {
      const imageUrl = photo.original;
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });

      const outputFilePath = path.join(OUTPUT_DIR, `photo_${index + 1}.jpg`);
      fs.writeFileSync(outputFilePath, response.data);
      console.log(`Downloaded photo_${index + 1}.jpg`);
    });

    await Promise.all(downloadPromises);
    console.log("All photos have been downloaded successfully!");
  } catch (error) {
    console.error(`Error downloading photos: ${error.message}`);
  }
};

downloadPhotos();
