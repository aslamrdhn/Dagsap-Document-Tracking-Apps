const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/Dashboard.tsx', 'utf8');

content = content.replace(
  'const [activeDocs, setActiveDocs] = useState<any[]>([]);',
  'const [activeDocs, setActiveDocs] = useState<any[]>([]);\n  const [recentEvents, setRecentEvents] = useState<any[]>([]);'
);

content = content.replace(
  'if (data.activeDocs) setActiveDocs(data.activeDocs);',
  'if (data.activeDocs) setActiveDocs(data.activeDocs);\n        if (data.recentEvents) setRecentEvents(data.recentEvents);'
);

const timelineReplacement = `{recentEvents.length === 0 ? (
                <div className="text-sm text-slate-400">No recent events.</div>
              ) : (
                recentEvents.map((evt: any, idx: number) => {
                  const isFirst = idx === 0;
                  return (
                    <div key={evt.id} className="relative">
                      <div className={\`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm \${isFirst ? 'bg-green-500' : 'bg-slate-300'}\`}></div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        {new Date(evt.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})} — {evt.eventType.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm font-semibold text-slate-700">Doc: {evt.document?.documentNumber}</div>
                      <div className="text-xs text-slate-500">
                        By: {evt.user?.name} at {evt.location?.name || 'Unknown'}
                      </div>
                    </div>
                  );
                })
              )}`;

content = content.replace(
  /<div className="space-y-6 relative border-l-2 border-slate-100 ml-2 pl-6">[\s\S]*?<\/div>\s*<\/div>\s*<div className="bg-\[#1a1c23\]/m,
  `<div className="space-y-6 relative border-l-2 border-slate-100 ml-2 pl-6">\n              ${timelineReplacement}\n            </div>\n          </div>\n          <div className="bg-[#1a1c23]`
);

fs.writeFileSync('src/pages/admin/Dashboard.tsx', content);
