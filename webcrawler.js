const Crawler = require('crawler');
const { LOR_DEVELOPER_URL, LOR_DEVELOPER_BUNDLE_SECTION_ID } = require('./config.json')

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
            .nextUntil('p:contains("Versioned")') // Get all elements until the Versioned bundles
            .children('a:not(:contains("lite"))') // Filter all link elements by removing all lite bundles
            .each((_, el) => links.push(el.attribs.href)) // Push all links to the array
          resolve(links)
        }
      }
    });
  });
}