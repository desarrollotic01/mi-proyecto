import { X } from "lucide-react";
import { useEffect } from "react";

export default function ModalBase({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  size = "md",
  showCloseButton = true,
  closeOnBackdrop = true,
  loading = false,
  zIndex = "z-[60]"
}) {
  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl", 
    lg: "max-w-4xl",
    xl: "max-w-5xl",
    full: "max-w-[95vw]"
  };

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center ${zIndex} p-4 overflow-y-auto min-h-[100dvh]`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-white w-full ${sizeClasses[size]} rounded-2xl shadow-2xl transform transition-all my-8 max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10 shrink-0">
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-2xl font-bold text-gray-900 truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0 ml-4" 
                disabled={loading}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
