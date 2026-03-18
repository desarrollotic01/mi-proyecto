import { useState } from "react";
import { 
  ShoppingCart, Building2, Wrench, Package, CreditCard, 
  Truck, Box, Eye, Edit2, Trash2, User, RefreshCw, 
  Globe, Shield, FileText, ChevronDown 
} from "lucide-react";

export default function EquipoCard({ equipo, onEdit, onDelete, onView, onMove, onCreatePlan, onOpenPDF, moveCategory }) {
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
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all group relative flex flex-col h-full border-l-[5px] border-l-blue-500">
      
      {/* HEADER: Código + Acciones */}
      <div className="flex justify-between items-start mb-3 gap-2">
        <span className="text-xs font-black px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md uppercase tracking-wide border border-slate-200">
          {equipo?.codigo || "S/C"}
        </span>
        
        {/* ✅ MOBILE FIX: Siempre visibles en celular (opacity-100), se ocultan en PC hasta hacer hover */}
        <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-slate-100">
          <button onClick={() => onOpenPDF && onOpenPDF(equipo)} title="PDF" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"><FileText size={16}/></button>
          <button onClick={() => onCreatePlan(equipo)} title="Plan" className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md"><Wrench size={16}/></button>
          <button onClick={() => onView(equipo)} title="Ver" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"><Eye size={16}/></button>
          <button onClick={() => onEdit(equipo)} title="Editar" className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md"><Edit2 size={16}/></button>
          <button onClick={() => onDelete(equipo?.id)} title="Borrar" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 size={16}/></button>
        </div>
      </div>

      {/* CUERPO: Nombre y Cliente */}
      <div className="mb-3">
        <h4 className="text-base font-black text-slate-800 leading-tight line-clamp-2 mb-1">
          {equipo?.nombre || "Sin Nombre"}
        </h4>
        <div className="flex items-center gap-1.5 text-slate-500">
          <User size={12} className="text-slate-400 shrink-0" />
          <p className="text-xs font-bold truncate">{equipo?.cliente?.razonSocial || "Sin Cliente"}</p>
        </div>
      </div>

      {/* ✅ CAJA DE DATOS TÉCNICOS: Destacada en gris suave */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 grid grid-cols-2 gap-x-3 gap-y-2 mb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Marca</span>
          <span className="text-xs font-bold text-slate-700 truncate">{equipo?.marca || "-"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Modelo</span>
          <span className="text-xs font-bold text-slate-700 truncate">{equipo?.modelo || "-"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Serie</span>
          <span className="text-xs font-mono font-bold text-blue-600 truncate">{equipo?.serie || "-"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sede</span>
          <span className="text-xs font-bold text-slate-700 truncate">{equipo?.sede || "-"}</span>
        </div>
      </div>

      {/* STATUS BADGES: Más redondeados */}
      <div className="flex flex-wrap gap-2 mb-4">
        {isPropiedad ? (
          <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 font-black text-[10px] uppercase border border-amber-200 flex items-center gap-1.5 shadow-sm">
            <RefreshCw size={12}/> {equipo?.status || "-"}
          </span>
        ) : (
          <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-black text-[10px] uppercase border border-blue-200 flex items-center gap-1.5 shadow-sm">
            <Globe size={12}/> {equipo?.tipoEquipoPropiedad || "-"}
          </span>
        )}
        <span className={`px-2 py-1 rounded-lg font-black text-[10px] uppercase border shadow-sm flex items-center gap-1.5 ${
          equipo?.estado === 'Operativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          <Shield size={12}/> {equipo?.estado || "-"}
        </span>
      </div>

      {/* FOOTER: Botón de mover grande y fácil de tocar */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
          <FileText size={12}/>
          <span className="text-[10px] font-black uppercase">{equipo?.numeroOV || "-"}</span>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowMoveMenu(!showMoveMenu)} 
            className="flex items-center gap-1.5 text-xs font-black text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors uppercase shadow-sm active:scale-95"
          >
            Mover <ChevronDown size={14} strokeWidth={2.5}/>
          </button>
          
          {showMoveMenu && (
            <div className="absolute bottom-full right-0 mb-2 bg-white shadow-xl border border-slate-200 rounded-xl p-1.5 z-50 min-w-[140px] animate-in fade-in slide-in-from-bottom-2">
              <div className="fixed inset-0" onClick={() => setShowMoveMenu(false)}></div>
              {moveOptions.map(opt => (
                <button 
                  key={opt} 
                  onClick={() => { 
                    onMove(equipo, isPropiedad ? "tipoEquipoPropiedad" : "status", opt); 
                    setShowMoveMenu(false); 
                  }} 
                  className="relative w-full text-left px-3 py-2 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg flex items-center gap-2.5 transition-colors uppercase"
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