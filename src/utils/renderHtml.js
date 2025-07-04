export default function renderHtml(templateHtml, fields) {
  let renderedHtml = templateHtml;
  for (const key in fields) {
    const value = fields[key];
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    renderedHtml = renderedHtml.replace(regex, value);
  }
  return renderedHtml;
}
