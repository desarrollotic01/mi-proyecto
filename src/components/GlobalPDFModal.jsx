import { PDFViewer } from '@react-pdf/renderer';

export const GlobalPDFModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-6xl h-[95vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-slate-800">{title || 'Vista Previa de Documento'}</h3>
          <button 
            onClick={onClose}
            className="hover:bg-red-500 hover:text-white text-gray-500 px-4 py-2 rounded-lg transition-all font-medium"
          >
            Cerrar
          </button>
        </div>
        
        <div className="flex-1 bg-zinc-900">
          <PDFViewer width="100%" height="100%" className="border-none">
            {children}
          </PDFViewer>
        </div>
      </div>
    </div>
  );
};