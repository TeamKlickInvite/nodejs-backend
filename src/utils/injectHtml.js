// utils/injectHtml.js

export const injectHtml = (baseHtml, layoutData, blockDefs) => {
  // ✅ 1. Inject global placeholders into baseHtml
  if (layoutData.data) {
    for (const key in layoutData.data) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      baseHtml = baseHtml.replace(regex, layoutData.data[key]);
    }
  }

  // ✅ 2. Construct all block HTML and inject into {{blocks}}
  let blocksHtml = '';
  if (Array.isArray(layoutData.blocks)) {
    layoutData.blocks.forEach(block => {
      const blockDef = blockDefs.find(b => b._id.toString() === block.blockId);
      if (blockDef) {
        let html = blockDef.html;
          
        // Replace placeholders inside block HTML
        for (const key in block.content) {
          const regex = new RegExp(`{{${key}}}`, 'g'); 
          html = html.replace(regex, block.content[key]);
        }

        // Wrap block inside a positioned div
        blocksHtml += `
          <div style="position:absolute; left:${block.position.x}px; top:${block.position.y}px; width:${block.size?.width}px; height:${block.size?.height}px;">
            ${html}
          </div>
        `;
      }
    });
  }

  // ✅ 3. Inject blocks into the base HTML
  baseHtml = baseHtml.replace('{{blocks}}', blocksHtml);

  return baseHtml;
};
