import { useState } from "react";
import { 
  ShoppingCart, Building2, Wrench, Package, CreditCard, 
  Truck, Box, Eye, Edit2, Trash2, User, RefreshCw, 
  Globe, Shield, FileText, ChevronDown 
} from "lucide-react";

export default function EquipoCard({ equipo, onEdit, onDelete, onView, onMove, onCreatePlan, moveCategory }) {
  // ESCUDO PROTECTOR: Evita pantalla en blanco si el equipo viene nulo
  if (!equipo) return null;

  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const isPropiedad = moveCategory === "propiedad";

  const moveOptions = isPropiedad 
    ? ["Vendido", "Propio", "Atendido"].filter(t => t !== equipo?.tipoEquipoPropiedad)
    : ["Almacen", "En compra", "Entregado"].filter(t => t !== equipo?.status && t !== "Almacén" || (t === "Almacen" && equipo?.status === "Almacén"));

  const getIcon = (opt) => {
    switch(opt) {
      case "Vendido": return <ShoppingCart size={14}/>;
      case "Propio": return <Building2 size={14}/>;
      case "Atendido": return <Wrench size={14}/>;
      case "Almacen": return <Package size={14}/>;
      case "En compra": return <CreditCard size={14}/>;
      case "Entregado": return <Truck size={14}/>;
      default: return <Box size={14}/>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all group relative flex flex-col h-full border-l-4 border-l-blue-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-600 rounded uppercase tracking-tighter">
          {equipo?.codigo || "S/C"}
        </span>
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-sm border">
          <button onClick={() => onCreatePlan(equipo)} title="Plan" className="p-1 text-slate-400 hover:text-emerald-600"><Wrench size={14}/></button>
          <button onClick={() => onView(equipo)} title="Ver" className="p-1 text-slate-400 hover:text-blue-600"><Eye size={14}/></button>
          <button onClick={() => onEdit(equipo)} title="Editar" className="p-1 text-slate-400 hover:text-amber-600"><Edit2 size={14}/></button>
          <button onClick={() => onDelete(equipo?.id)} title="Borrar" className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
        </div>
      </div>

      {/* CUERPO */}
      <div className="mb-2">
        <h4 className="text-[13px] font-black text-slate-800 leading-tight line-clamp-1 group-hover:line-clamp-none transition-all">
          {equipo?.nombre || "Sin Nombre"}
        </h4>
        <div className="flex items-center gap-1 mt-1 text-slate-500">
          <User size={10} />
          <p className="text-[10px] font-bold truncate uppercase">{equipo?.cliente?.razonSocial || "Sin Cliente"}</p>
        </div>
      </div>

      {/* INFO DETALLADA */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 py-2 border-y border-slate-50 mb-2">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase">Marca</span>
          <span className="text-[10px] font-bold text-slate-700 truncate">{equipo?.marca || "-"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase">Modelo</span>
          <span className="text-[10px] font-bold text-slate-700 truncate">{equipo?.modelo || "-"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase">Serie</span>
          <span className="text-[10px] font-mono font-bold text-blue-600 truncate">{equipo?.serie || "-"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase">Sede</span>
          <span className="text-[10px] font-bold text-slate-700 truncate">{equipo?.sede || "-"}</span>
        </div>
      </div>

      {/* STATUS BADGES */}
      <div className="flex flex-wrap gap-1 mb-2">
        {isPropiedad ? (
          <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-black text-[9px] uppercase border border-amber-100 flex items-center gap-1">
            <RefreshCw size={10}/> {equipo?.status || "-"}
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-black text-[9px] uppercase border border-blue-100 flex items-center gap-1">
            <Globe size={10}/> {equipo?.tipoEquipoPropiedad || "-"}
          </span>
        )}
        <span className={`px-1.5 py-0.5 rounded-md font-black text-[9px] uppercase border flex items-center gap-1 ${
          equipo?.estado === 'Operativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          <Shield size={10}/> {equipo?.estado || "-"}
        </span>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
        <div className="flex items-center gap-1 text-slate-400">
          <FileText size={10}/>
          <span className="text-[10px] font-bold uppercase">{equipo?.numeroOV || "-"}</span>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowMoveMenu(!showMoveMenu)} 
            className="flex items-center gap-1 text-[9px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors uppercase"
          >
            Mover <ChevronDown size={10} strokeWidth={3}/>
          </button>
          
          {showMoveMenu && (
            <div className="absolute bottom-full right-0 mb-2 bg-white shadow-xl border border-slate-200 rounded-lg p-1 z-50 min-w-[120px]">
              <div className="fixed inset-0" onClick={() => setShowMoveMenu(false)}></div>
              {moveOptions.map(opt => (
                <button 
                  key={opt} 
                  onClick={() => { 
                    onMove(equipo, isPropiedad ? "tipoEquipoPropiedad" : "status", opt); 
                    setShowMoveMenu(false); 
                  }} 
                  className="relative w-full text-left px-2 py-1.5 text-[9px] font-black text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded flex items-center gap-2 transition-colors uppercase"
                >
                  {getIcon(opt)} {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}