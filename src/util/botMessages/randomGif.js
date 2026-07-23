require("dotenv").config();
const _ = require("lodash");

const GIPHY_API_KEY = process.env.GIPHY_API_KEY;

async function getRandomGif(searchTerm) {
  if (!GIPHY_API_KEY) return null;
  if (!searchTerm) return null;

  try {
    const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchTerm)}&limit=20&rating=g`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.data?.length) return null;

    const gif = _.sample(data.data);
    return gif.images?.original?.url ?? null;
  } catch (err) {
    console.error("Failed to fetch GIF from GIPHY:", err);
    return null;
  }
}

module.exports = { getRandomGif };