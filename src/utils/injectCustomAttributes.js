// File: utils/injectCustomAttributes.js
import * as cheerio from 'cheerio';

export const injectCustomAttributes = (html, data) => {
  const $ = cheerio.load(html);

  Object.entries(data).forEach(([key, value]) => {
    $(`[${key}]`).each((_, el) => {
      $(el).text(value);
    });
  });

  return $.html();
};
