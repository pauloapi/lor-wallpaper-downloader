const Crawler = require('crawler');
const { LOR_DEVELOPER_URL, LOR_DEVELOPER_BUNDLE_SECTION_ID } = require('../config.json')
const axios = require('axios')

module.exports.getAllLinks = function () {
  return new Promise(resolve => {
    new Crawler().direct({
      url: LOR_DEVELOPER_URL,
      callback: (error, res) => {
        if (error) {
          console.log(error);
        } else {
          const $ = res.$;
          let links = [];
          $(LOR_DEVELOPER_BUNDLE_SECTION_ID) // Go to the Set Bundles ID https://developer.riotgames.com/docs/lor#data-dragon_set-bundles 
            .nextUntil('h3:contains("Versioned")') // Get all elements until the Versioned bundles
            .children('a:not(:contains("lite"))') // Filter all link elements by removing all lite bundles
            .each((_, el) => links.push(el.attribs.href)) // Push all links to the array
          resolve(links)
        }
      }
    });
  });
}

module.exports.getWikiImageLink = async function (champName, skinName, cardCode) {
  // All skins are based on https://leagueoflegends.fandom.com/wiki/List_of_champion_skins_(Legends_of_Runeterra)

  let res = await axios.get(
    `https://leagueoflegends.fandom.com/api.php?format=json&action=parse&disablelimitreport=true&prop=text&title=List_of_champion_skins_(Legends_of_Runeterra)&maxage=600&smaxage=600&text=%7B%7BTooltip%2FSkin%7Cchampion%3D`
    + `${champName}%7Cskin%3D${skinName}%7Cvariant%3D${cardCode}%7Cgame%3Dlor%7D%7D`
  ) // Get card full art by using wiki api
  let html = res.data.parse.text['*'];

  // Get full art image from html
  return new Promise(resolve => {
    new Crawler().queue({
      html,
      callback: (error, res) => {
        if (error) {
          console.log(error);
        } else {
          const $ = res.$;
          let url = $('.image').first().attr('href');
          resolve(url)
        }
      }
    });
  });
}

