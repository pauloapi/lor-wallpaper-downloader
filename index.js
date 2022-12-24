const { getAllLinks } = require('./webcrawler')
const { downloadFile } = require('./downloader')
const { getFileHash } = require('./filehash')
const decompress = require("decompress");
const {
  TEMP_DESTINATION,
  OUTPUT_DESTINATION,
  LOR_DEVELOPER_URL,
  LOR_IMAGE_PATH,
  LOR_DATA_PATH,
  LOR_WALLPAPER_TYPE,
  TEMP_ZIP_DESTINATION,
  TEMP_RAW_DESTINATION
} = require('./config.json')
const fs = require('fs')
const path = require('path')

async function main() {

  // Set variables
  const TEMP_ZIP_DESTINATION_FULL = path.join(TEMP_DESTINATION, TEMP_ZIP_DESTINATION)
  const TEMP_RAW_DESTINATION_FULL = path.join(TEMP_DESTINATION, TEMP_RAW_DESTINATION)
  const TEMP_IMAGE_PATH = path.join(TEMP_RAW_DESTINATION_FULL, LOR_IMAGE_PATH)

  // Crawl on LOR set bundles links
  let links = await getAllLinks();
  console.log(links.length, 'Set Bundles Found from', LOR_DEVELOPER_URL);

  // Download all set bundless
  let setBundles = []
  for (link of links) {
    console.log('Downloading', link);
    let filename = await downloadFile(link, TEMP_ZIP_DESTINATION_FULL);
    setBundles.push(filename);
  }

  // Clean raw data and output folder
  if (!fs.existsSync(TEMP_DESTINATION)) {
    fs.mkdirSync(TEMP_DESTINATION);
  }
  fs.rmSync(TEMP_RAW_DESTINATION_FULL, { force: true, recursive: true });
  fs.rmSync(OUTPUT_DESTINATION, { force: true, recursive: true });
  fs.mkdirSync(OUTPUT_DESTINATION);

  // Decompress all sets
  for (filename of setBundles) {
    console.log('Decompressing', filename)
    await decompress(filename, TEMP_RAW_DESTINATION_FULL)
  }

  // Remove other card type that has no full art
  let wallpaperList = []
  let setList = fs.readdirSync(path.join(TEMP_RAW_DESTINATION_FULL, LOR_DATA_PATH))
  setList.forEach(set => {
    let setDataFilename = path.join(TEMP_RAW_DESTINATION_FULL, LOR_DATA_PATH, set);
    let cardList = JSON.parse(fs.readFileSync(setDataFilename));
    cardList.forEach(card => {
      if (LOR_WALLPAPER_TYPE.includes(card.type)) {
        wallpaperList.push(card.cardCode + '-full.png')
      }
    });
  })
  console.log('Wallpaper Count:', wallpaperList.length)

  // Remove duplicate images
  let unique = {}
  wallpaperList.forEach(async card => {
    let cardFilename = path.join(TEMP_IMAGE_PATH, card);
    const hex = getFileHash(cardFilename)
    unique[hex] = card
  });
  let uniqueCards = Object.values(unique)
  console.log('Unique Wallpaper Count:', uniqueCards.length)

  // Move all unique to output folder
  uniqueCards.forEach(card => {
    let cardFilename = path.join(TEMP_IMAGE_PATH, card);
    let outputDestination = path.join(OUTPUT_DESTINATION, card);
    fs.renameSync(cardFilename, outputDestination)
  })
}

main()