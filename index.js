const decompress = require("decompress");
const fs = require('fs')
const path = require('path')
const { getAllLinks, getWikiImageLink } = require('./utils/webcrawler')
const { getFileHash, downloadFile } = require('./utils/fileHelper')
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
const cardSkins = require('./skins.json')

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
        wallpaperList.push(card.cardCode)
      }
    });
  })

  // Remove duplicate images
  let unique = {}
  wallpaperList.forEach(async card => {
    let filename = card + '-full.png'
    let filenameFull = path.join(TEMP_IMAGE_PATH, filename);
    const hex = getFileHash(filenameFull)
    unique[hex] = filename
  });
  let uniqueCards = Object.values(unique)

  // Move all unique wallpaper to output folder
  uniqueCards.forEach(card => {
    let cardFilename = path.join(TEMP_IMAGE_PATH, card);
    let outputDestination = path.join(OUTPUT_DESTINATION, card);
    fs.renameSync(cardFilename, outputDestination)
  })

  // Download skins from LOR fandom wiki
  for (card of cardSkins) {
    let link = await getWikiImageLink(card.champName, card.skinName, card.cardCode);
    if (link) {
      console.log('Downloading', card.champName, card.skinName, card.cardCode)
      await downloadFile(link, OUTPUT_DESTINATION);
    } else {
      console.log('Not Found', card)
    }
  }
  
  // Output total wallpaper
  let total = fs.readdirSync(OUTPUT_DESTINATION).length;
  console.log('Total Wallpaper Count:', total)
}

main()