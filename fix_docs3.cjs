const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/Documents.tsx', 'utf8');

content = content.replace(
  '<button \n                      onClick={() => setQrModalDoc(doc)}\n                      className="text-slate-400 hover:text-slate-700 transition"\n                      title="View Label"\n                    >\n                      <QRIcon size={18} />\n                    </button>',
  '<button \n                      onClick={() => setQrModalDoc(doc)}\n                      className="flex items-center text-[#800000] hover:text-[#600000] font-bold text-[11px] bg-[#800000]/10 px-2 py-1 rounded transition"\n                      title="View Label"\n                    >\n                      <QRIcon size={14} className="mr-1" /> Print QR\n                    </button>'
);

fs.writeFileSync('src/pages/admin/Documents.tsx', content);
