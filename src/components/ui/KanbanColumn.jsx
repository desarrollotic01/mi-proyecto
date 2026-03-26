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
    blue: "bg-gradient-to-r from-blue-600 to-blue-700",
    orange: "bg-gradient-to-r from-orange-600 to-orange-700", 
    purple: "bg-gradient-to-r from-purple-600 to-purple-700",
    green: "bg-gradient-to-r from-green-600 to-green-700",
    slate: "bg-gradient-to-r from-slate-600 to-slate-700",
    red: "bg-gradient-to-r from-red-600 to-red-700",
    indigo: "bg-gradient-to-r from-indigo-600 to-indigo-700",
    yellow: "bg-gradient-to-r from-yellow-600 to-yellow-700"
  };

  const bgHeader = colorStyles[color] || colorStyles.blue;
  
  // Protección contra arrays rotos
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className={`flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shrink-0 w-[85vw] md:w-[320px] lg:flex-1 lg:w-auto lg:min-w-0 snap-center ${className}`}>
      {/* Header */}
      <div className={`${bgHeader} rounded-t-[1rem] p-3.5 flex items-center justify-between shadow-sm`}>
        <div className="flex items-center gap-2.5">
          <div className="text-white/90">
            <Icon size={20} strokeWidth={2} />
          </div>
          <h3 className="text-white font-black text-sm uppercase tracking-wide truncate">
            {title}
          </h3>
        </div>
        {showCount && (
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-[11px] font-black shadow-inner shrink-0">
            {safeItems.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-[#f8fafc] border-x border-b border-slate-200 p-3 min-h-[450px] space-y-3 rounded-b-[1rem] shadow-sm">
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
