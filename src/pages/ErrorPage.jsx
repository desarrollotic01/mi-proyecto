import { useNavigate } from "react-router-dom";
import { AlertOctagon, ArrowLeft, Home } from "lucide-react";

export default function ErrorPage({ code = 404, message = "Página no encontrada" }) {
  const navigate = useNavigate();

  const getErrorDetails = (code) => {
    switch (code) {
      case 404:
        return {
          title: "404",
          subtitle: "Página no encontrada",
          description: "Lo sentimos, la página que estás buscando no existe o ha sido movida.",
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        };
      case 500:
        return {
          title: "500",
          subtitle: "Error del servidor",
          description: "Ha ocurrido un error interno. Por favor, intenta nuevamente más tarde.",
          color: "text-red-600",
          bgColor: "bg-red-100",
        };
      case 403:
        return {
          title: "403",
          subtitle: "Acceso denegado",
          description: "No tienes permisos para acceder a esta página.",
          color: "text-orange-600",
          bgColor: "bg-orange-100",
        };
      default:
        return {
          title: code?.toString() || "Error",
          subtitle: message,
          description: "Ha ocurrido un error inesperado. Por favor, intenta nuevamente.",
          color: "text-gray-600",
          bgColor: "bg-gray-100",
        };
    }
  };

  const errorDetails = getErrorDetails(code);

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="text-center max-w-lg w-full">
        {/* Icono */}
        <div
          className={`w-28 h-28 ${errorDetails.bgColor} rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg`}
        >
          <AlertOctagon className={`w-14 h-14 ${errorDetails.color}`} strokeWidth={1.5} />
        </div>

        {/* Código de error */}
        <h1 className="text-8xl font-bold text-slate-900 mb-2 tracking-tight">
          {errorDetails.title}
        </h1>

        {/* Subtítulo */}
        <h2 className="text-2xl font-semibold text-slate-700 mb-4">
          {errorDetails.subtitle}
        </h2>

        {/* Descripción */}
        <p className="text-slate-500 text-lg mb-10 leading-relaxed">
          {errorDetails.description}
        </p>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-white text-slate-700 font-medium rounded-xl border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver atrás
          </button>

          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-blue-200"
          >
            <Home className="w-5 h-5" />
            Ir al Inicio
          </button>
        </div>

        {/* Footer */}
        <p className="mt-12 text-sm text-slate-400">
          Si el problema persiste, contacta al soporte técnico
        </p>
      </div>
    </div>
  );
}
