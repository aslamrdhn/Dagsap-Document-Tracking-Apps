const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/Documents.tsx', 'utf8');

content = content.replace(
  '<div className="flex flex-col items-center p-6 space-y-6 text-center">',
  '<div id="printable-label" className="flex flex-col items-center p-6 space-y-6 text-center bg-white">'
);

content = content.replace(
  '<button onClick={() => window.print()}',
  '<button onClick={() => { setTimeout(() => window.print(), 100); }}'
);

fs.writeFileSync('src/pages/admin/Documents.tsx', content);
