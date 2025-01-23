// Helper function to add dynamic config to route files
export const addDynamicConfig = (filePath: string) => {
  const fs = require('fs');
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('export const dynamic')) {
    const newContent = `export const dynamic = 'force-dynamic';\n\n${content}`;
    fs.writeFileSync(filePath, newContent);
  }
};
