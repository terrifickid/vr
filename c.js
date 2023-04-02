const axios = require("axios");
const fs = require("fs");
const path = require("path");

const MYVR_API_KEY = "LIVE_421e08df2c8e07c263b10dbeb14fdfa2";
const JSON_FILE_NAME = "myvr_properties_import.js";
const PHOTOS_FOLDER = "property_photos";

const baseurl = "https://api.myvr.com/v1/properties/";

const myvrApi = axios.create({
  baseURL: baseurl,
  headers: { Authorization: `Bearer ${MYVR_API_KEY}` },
});

async function getAllProperties() {
  let properties = [];
  let url = baseurl;

  while (url) {
    const response = await myvrApi.get(url);
    console.log(response.data);
    properties = properties.concat(response.data.results);
    url = response.data.next ? response.data.next.slice(baseurl.length) : null;
  }

  return properties;
}

async function downloadImage(url, outputPath) {
  const response = await axios.get(url, { responseType: "stream" });
  const writer = fs.createWriteStream(outputPath);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function downloadPropertyPhotos(property) {
  const propertyId = property.id;
  const photos = property.photos;
  const propertyFolder = path.join(PHOTOS_FOLDER, propertyId);

  if (!fs.existsSync(propertyFolder)) {
    fs.mkdirSync(propertyFolder, { recursive: true });
  }

  await Promise.all(
    photos.map(async (photo, index) => {
      const imageUrl = photo.url_large;
      const outputPath = path.join(propertyFolder, `photo_${index + 1}.jpg`);
      await downloadImage(imageUrl, outputPath);
      console.log(`Downloaded photo ${index + 1} for property ${propertyId}`);
    })
  );
}

async function writePropertiesToJson(properties) {
  const data = properties;
  const moduleContent = `module.exports = ${JSON.stringify(data, null, 2)};`;
  fs.writeFileSync(JSON_FILE_NAME, moduleContent);
  console.log(`Exported ${properties.length} properties to ${JSON_FILE_NAME}`);
}

(async () => {
  try {
    const properties = await getAllProperties();
    await writePropertiesToJson(properties);

    if (!fs.existsSync(PHOTOS_FOLDER)) {
      fs.mkdirSync(PHOTOS_FOLDER);
    }

    for (const property of properties) {
      await downloadPropertyPhotos(property);
    }

    console.log("Downloaded all property photos.");
  } catch (error) {
    console.error("Error processing properties:", error);
  }
})();
