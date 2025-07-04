import puppeteer from 'puppeteer';
import path from 'path';
import os from 'os';

export const renderAndExport = async ({ htmlContent, data = {}, format = 'pdf', fileName }) => {
  if (typeof htmlContent !== 'string') {
    throw new Error('Invalid HTML content: must be a string.');
  }

  const compiledHtml = Object.keys(data).reduce((html, key) => {
    const value = data[key];
    return html.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
  }, htmlContent);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(compiledHtml, { waitUntil: 'networkidle0' });

  const outputPath = path.join(os.tmpdir(), `${fileName}.${format}`);

  if (format === 'pdf') {
    await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
  } else {
    await page.screenshot({ path: outputPath, fullPage: true });
  }

  await browser.close();
  return outputPath;
};
