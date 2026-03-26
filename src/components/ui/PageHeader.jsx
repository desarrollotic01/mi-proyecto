import Button from "./Button";

export default function PageHeader({ 
  title, 
  subtitle, 
  icon: Icon,
  actions = [],
  breadcrumbs = [],
  className = ""
}) {
  return (
    <div className={`mb-6 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="inline-flex items-center">
                {index > 0 && (
                  <svg className="w-3 h-3 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                <a
                  href={crumb.href}
                  className={`text-sm font-medium ${
                    index === breadcrumbs.length - 1 
                      ? "text-gray-700" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {crumb.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Header Content */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-3 bg-blue-100 rounded-2xl">
              <Icon className="w-7 h-7 text-blue-700" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-600 mt-1 text-sm lg:text-base">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "primary"}
                size={action.size || "md"}
                icon={action.icon}
                onClick={action.onClick}
                disabled={action.disabled}
                loading={action.loading}
                className={action.className}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
