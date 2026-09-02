const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/Dashboard.tsx', 'utf8');

// Fix 1: grid-cols-4 -> grid-cols-1 md:grid-cols-2 lg:grid-cols-4
content = content.replace('grid-cols-4 gap-6', 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6');

// Fix 2: p-8 -> p-4 lg:p-8
content = content.replace('section className="p-8 grid', 'section className="p-4 lg:p-8 grid');

// Fix 3: px-8 pb-8 -> px-4 pb-4 lg:px-8 lg:pb-8
content = content.replace('flex-1 px-8 pb-8', 'flex-1 px-4 pb-4 lg:px-8 lg:pb-8');

// Fix 4: grid-cols-12 -> grid-cols-1 lg:grid-cols-12
content = content.replace('grid-cols-12 gap-6', 'grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6');

// Fix 5: col-span-8 -> col-span-1 lg:col-span-8
content = content.replace('className="col-span-8 flex flex-col', 'className="col-span-1 lg:col-span-8 flex flex-col');

// Fix 6: col-span-4 -> col-span-1 lg:col-span-4
content = content.replace('className="col-span-4 flex flex-col', 'className="col-span-1 lg:col-span-4 flex flex-col');

fs.writeFileSync('src/pages/admin/Dashboard.tsx', content);
