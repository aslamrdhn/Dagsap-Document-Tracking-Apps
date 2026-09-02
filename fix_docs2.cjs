const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/Documents.tsx', 'utf8');

content = content.replace(
  '<button onClick={() => { setTimeout(() => window.print(), 100); }} className="bg-slate-800',
  '<button onClick={() => { setTimeout(() => window.print(), 100); }} className="print:hidden bg-slate-800'
);

fs.writeFileSync('src/pages/admin/Documents.tsx', content);
