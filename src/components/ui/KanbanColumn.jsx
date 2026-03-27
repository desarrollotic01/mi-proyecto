import { Box } from "lucide-react";

export default function KanbanColumn({ 
  title, 
  icon: Icon, 
  color = "blue", 
  items = [], 
  renderItem,
  emptyMessage = "Sin elementos",
  showCount = true,
  className = ""
}) {
  const colorStyles = {
    blue: "bg-blue-50 border-b border-blue-200 text-blue-800",
    orange: "bg-amber-50 border-b border-amber-200 text-amber-800",
    purple: "bg-purple-50 border-b border-purple-200 text-purple-800",
    green: "bg-emerald-50 border-b border-emerald-200 text-emerald-800",
    slate: "bg-slate-50 border-b border-slate-200 text-slate-800",
    red: "bg-rose-50 border-b border-rose-200 text-rose-800",
    indigo: "bg-indigo-50 border-b border-indigo-200 text-indigo-800",
    yellow: "bg-yellow-50 border-b border-yellow-200 text-yellow-800"
  };

  const bgHeader = colorStyles[color] || colorStyles.blue;
  
  // Protección contra arrays rotos
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className={`flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shrink-0 w-[85vw] md:w-[320px] lg:flex-1 lg:w-auto lg:min-w-0 snap-center ${className}`}>
      {/* Header */}
        <div className={`${bgHeader} rounded-t-[1rem] p-3.5 flex items-center justify-between shadow-sm`}>
          <div className="flex items-center gap-2.5">
            <div className="text-current">
              <Icon size={20} strokeWidth={2} />
            </div>
            <h3 className="font-black text-sm uppercase tracking-wide truncate text-current">
              {title}
            </h3>
          </div>
        {showCount && (
            <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center text-current text-[11px] font-black shadow-inner shrink-0">
            {safeItems.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-slate-50 border-x border-b border-slate-200 p-3 min-h-[450px] space-y-3 rounded-b-[1rem] shadow-sm">
        {safeItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 opacity-30">
            <Box size={48} className="text-slate-400 mb-3" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {emptyMessage}
            </p>
          </div>
        ) : (
          safeItems.map((item, index) => (
            <div key={item?.id || index}>
              {renderItem(item, index)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
