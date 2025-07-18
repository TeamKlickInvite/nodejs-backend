// utils/generatePdfOrPng.js
import puppeteer from "puppeteer";

export const generateFromHtml = async (html, type = 'pdf') => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Set content and wait for all images/fonts to load
  await page.setContent(html, { waitUntil: 'networkidle0' });

  let buffer;
  if (type === 'pdf') {
    buffer = await page.pdf({
      format: 'A4',
      printBackground: true
    });
  } else if (type === 'png') {
    buffer = await page.screenshot({
      fullPage: true
    });
  }

  await browser.close();
  return buffer;
};
