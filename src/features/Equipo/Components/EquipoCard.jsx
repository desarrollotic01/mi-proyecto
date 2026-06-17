import { useState, memo } from "react";
import {
  ShoppingCart, Building2, Wrench, Package, CreditCard,
  Truck, Box, Eye, Edit2, Trash2, User, RefreshCw,
  Globe, Shield, FileText, ChevronDown, MapPin, Tag, Hash
} from "lucide-react";

export default memo(function EquipoCard({ equipo, onEdit, onDelete, onView, onMove, onCreatePlan, onOpenPDF, moveCategory }) {
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

  let topBarColor = "bg-slate-300";
  if (isPropiedad) {
     if (equipo.tipoEquipoPropiedad === "Vendido") topBarColor = "bg-blue-500";
     if (equipo.tipoEquipoPropiedad === "Propio") topBarColor = "bg-amber-500";
     if (equipo.tipoEquipoPropiedad === "Atendido") topBarColor = "bg-purple-500";
  } else {
     if (equipo.status === "Almacen" || equipo.status === "Almacén") topBarColor = "bg-indigo-500";
     if (equipo.status === "En compra") topBarColor = "bg-amber-500";
     if (equipo.status === "Entregado") topBarColor = "bg-emerald-500";
  }

  // Pequeña función para quitarle peso visual a los datos vacíos ("-")
  const renderData = (valor, colorClase = "text-slate-700") => {
    if (!valor || valor === "-" || valor === "S/C") {
      return <span className="text-[11px] font-medium text-slate-400 truncate block w-full">-</span>;
    }
    return <span className={`text-[11px] font-bold ${colorClase} truncate block w-full`} title={valor}>{valor}</span>;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full group w-full min-w-0 overflow-hidden relative">
      
      <div className={`h-1 w-full shrink-0 ${topBarColor}`} />

      {/* PADDING AUMENTADO A p-3.5 PARA DAR RESPIRACIÓN */}
      <div className="p-3.5 flex flex-col flex-1 w-full min-w-0 overflow-hidden">
        
        {/* HEADER: Código & Acciones */}
        <div className="flex justify-between items-start mb-3 gap-2 w-full min-w-0">
          {/* PASTILLA CON MÁS AIRE VERTICAL (py-1 en lugar de py-0.5) */}
          <span className="text-[11px] font-black px-2 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200 truncate shrink-0 max-w-[50%]">
            {equipo?.codigo || "S/C"}
          </span>
          
          {/* ICONOS MÁS OSCUROS (text-slate-500) Y MÁS GRANDES (size={14}, p-1.5) */}
          <div className="flex items-center gap-0.5 shrink-0 bg-white">
            <button onClick={(e) => { e.stopPropagation(); onOpenPDF && onOpenPDF(equipo); }} title="PDF" className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><FileText size={14}/></button>
            <button onClick={(e) => { e.stopPropagation(); onCreatePlan(equipo); }} title="Plan" className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"><Wrench size={14}/></button>
            <button onClick={(e) => { e.stopPropagation(); onView(equipo); }} title="Ver" className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Eye size={14}/></button>
            <button onClick={(e) => { e.stopPropagation(); onEdit(equipo); }} title="Editar" className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"><Edit2 size={14}/></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(equipo?.id); }} title="Borrar" className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={14}/></button>
          </div>
        </div>

        {/* TÍTULO Y CLIENTE (TAMAÑOS AUMENTADOS) */}
        <div className="mb-3 w-full min-w-0">
          <h4 className="text-[13px] font-black text-slate-800 leading-tight line-clamp-2 mb-1.5 w-full break-words" title={equipo?.nombre}>
            {equipo?.nombre || "Sin Nombre"}
          </h4>
          <div className="flex items-center gap-1.5 text-slate-500 w-full min-w-0">
            <User size={12} className="shrink-0" />
            <p className="text-[11px] font-bold truncate flex-1 min-w-0">{equipo?.cliente?.razonSocial || "Sin Cliente"}</p>
          </div>
        </div>

        {/* CAJA DE DETALLES TÉCNICOS (Alineación perfecta e items-center) */}
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 grid grid-cols-2 gap-x-3 gap-y-2 mb-3 w-full min-w-0">
          <div className="flex flex-col min-w-0 w-full overflow-hidden">
            <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 truncate mb-0.5"><Tag size={10} className="shrink-0"/> Marca</span>
            {renderData(equipo?.marca)}
          </div>
          <div className="flex flex-col min-w-0 w-full overflow-hidden">
            <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 truncate mb-0.5"><Box size={10} className="shrink-0"/> Modelo</span>
            {renderData(equipo?.modelo)}
          </div>
          <div className="flex flex-col min-w-0 w-full overflow-hidden">
            <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 truncate mb-0.5"><Hash size={10} className="shrink-0"/> Serie</span>
            {renderData(equipo?.serie, "text-blue-600")}
          </div>
          <div className="flex flex-col min-w-0 w-full overflow-hidden">
            <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 truncate mb-0.5"><MapPin size={10} className="shrink-0"/> Sede</span>
            {renderData(equipo?.sede)}
          </div>
        </div>

        {/* BADGES DE ESTADO (Letras legibles a 10px y más padding) */}
        <div className="flex flex-wrap gap-1.5 mt-auto pt-1 w-full min-w-0">
          {isPropiedad ? (
            <span className="px-2 py-1 rounded text-amber-700 bg-amber-50 border border-amber-200 font-bold text-[10px] uppercase flex items-center gap-1 truncate max-w-[50%]">
              <RefreshCw size={10} className="shrink-0"/> <span className="truncate">{equipo?.status || "-"}</span>
            </span>
          ) : (
            <span className="px-2 py-1 rounded text-blue-700 bg-blue-50 border border-blue-200 font-bold text-[10px] uppercase flex items-center gap-1 truncate max-w-[50%]">
              <Globe size={10} className="shrink-0"/> <span className="truncate">{equipo?.tipoEquipoPropiedad || "-"}</span>
            </span>
          )}
          <span className={`px-2 py-1 rounded font-bold text-[10px] uppercase border flex items-center gap-1 truncate max-w-[45%] ${
            equipo?.estado === 'Operativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            <Shield size={10} className="shrink-0"/> <span className="truncate">{equipo?.estado || "-"}</span>
          </span>
        </div>

        {/* FOOTER: OV y Botón Mover */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 w-full min-w-0 relative">
          
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-slate-600 min-w-0 flex-1">
            <FileText size={12} className="shrink-0"/>
            <span className="text-[10px] font-black uppercase tracking-wider truncate block w-full" title={`OV: ${equipo?.numeroOV}`}>
              OV: {equipo?.numeroOV || "-"}
            </span>
          </div>
          
          <div className="relative shrink-0">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMoveMenu(!showMoveMenu); }} 
              className="flex items-center gap-1 text-[10px] font-black text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1.5 rounded-md transition-colors uppercase shadow-sm"
            >
              Mover <ChevronDown size={12} strokeWidth={3}/>
            </button>
            
            {showMoveMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-white shadow-xl border border-slate-200 rounded-lg p-1 z-[60] w-36 origin-bottom-right animate-in fade-in zoom-in-95">
                <div className="fixed inset-0 z-[-1]" onClick={(e) => { e.stopPropagation(); setShowMoveMenu(false); }}></div>
                {moveOptions.map(opt => (
                  <button 
                    key={opt} 
                    onClick={(e) => { 
                      e.stopPropagation();
                      onMove(equipo, isPropiedad ? "tipoEquipoPropiedad" : "status", opt); 
                      setShowMoveMenu(false); 
                    }} 
                    className="w-full text-left px-2 py-2 text-[11px] font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-md flex items-center gap-2 transition-colors uppercase"
                  >
                    {getIcon(opt)} <span className="truncate">{opt}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
})