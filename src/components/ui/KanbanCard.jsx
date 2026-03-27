import { ChevronRight, MoreHorizontal } from "lucide-react";
import { useState } from "react";

export default function KanbanCard({ 
  item,
  title,
  subtitle,
  description,
  badges = [],
  metadata = [],
  actions = [],
  color = "slate",
  onClick,
  className = ""
}) {
  const [showActions, setShowActions] = useState(false);

  const colorStyles = {
    blue: "border-blue-200 hover:border-blue-300 hover:shadow-blue-100",
    orange: "border-orange-200 hover:border-orange-300 hover:shadow-orange-100", 
    purple: "border-purple-200 hover:border-purple-300 hover:shadow-purple-100",
    green: "border-green-200 hover:border-green-300 hover:shadow-green-100",
    slate: "border-slate-200 hover:border-slate-300 hover:shadow-slate-100",
    red: "border-red-200 hover:border-red-300 hover:shadow-red-100",
    indigo: "border-indigo-200 hover:border-indigo-300 hover:shadow-indigo-100",
    yellow: "border-yellow-200 hover:border-yellow-300 hover:shadow-yellow-100"
  };

  const borderClasses = colorStyles[color] || colorStyles.slate;

  const handleClick = () => {
    if (onClick) {
      onClick(item);
    }
  };

  return (
    <div
      className={`rounded-xl border ${borderClasses} bg-white p-4 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg group ${className}`}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2 mb-1">
              {title}
            </h4>
          )}
          {subtitle && (
            <p className="text-xs text-slate-500 font-mono truncate">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          {actions.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-1 hover:bg-slate-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal size={14} className="text-slate-500" />
            </button>
          )}
          <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600 transition" />
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-slate-600 line-clamp-2 mb-3">
          {description}
        </p>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {badges.map((badge, index) => (
            <span
              key={index}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${badge.className}`}
            >
              {badge.icon && <badge.icon size={10} />}
              {badge.label}
            </span>
          ))}
        </div>
      )}

      {/* Metadata */}
      {metadata.length > 0 && (
        <div className="space-y-1.5">
          {metadata.map((meta, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-slate-500">
              {meta.icon && <meta.icon size={12} className="shrink-0" />}
              <span className="truncate">{meta.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions Dropdown */}
      {showActions && actions.length > 0 && (
        <div 
          className="absolute right-4 top-12 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]"
          onClick={(e) => e.stopPropagation()}
        >
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick(item);
                setShowActions(false);
              }}
              className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              {action.icon && <action.icon size={12} />}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
