const fs = require('fs');
const path = require('path');

const apiRoutePaths = [
  'src/app/api/clocking/history/route.ts',
  'src/app/api/clocking/history/admin/route.ts',
  'src/app/api/points/all/route.ts',
  'src/app/api/points/filtered/route.ts',
  'src/app/api/points/history/route.ts',
  'src/app/api/points/weekly/route.ts',
  'src/app/api/student/points/route.ts',
  'src/app/api/user/course/route.ts',
  'src/app/api/user/subjects/route.ts',
  'src/app/api/users/route.ts'
];

const addDynamicConfig = (filePath) => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes('export const dynamic')) {
      content = `export const dynamic = 'force-dynamic';\n\n${content}`;
      fs.writeFileSync(fullPath, content);
      console.log(`Added dynamic config to ${filePath}`);
    } else {
      console.log(`Dynamic config already exists in ${filePath}`);
    }
  } else {
    console.error(`File not found: ${filePath}`);
  }
};

apiRoutePaths.forEach(addDynamicConfig);
