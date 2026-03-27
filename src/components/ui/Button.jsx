import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

const Button = forwardRef(function Button(
  { 
    children, 
    variant = "primary", 
    size = "md", 
    loading = false, 
    disabled = false, 
    icon: Icon,
    iconPosition = "left",
    fullWidth = false,
    className = "",
    ...props 
  }, 
  ref
) {
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200";

  const variantClasses = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-700 shadow-sm transition-colors",
    secondary: "bg-slate-50 text-slate-900 hover:bg-slate-100 focus:ring-slate-500 transition-colors",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm transition-colors",
    outline: "bg-transparent border-2 border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus:ring-slate-500 transition-colors",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm transition-colors",
    warning: "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500 shadow-sm transition-colors",
    ghost: "bg-transparent border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
  };

  const sizeClasses = {
    xs: "px-2.5 py-1.5 text-xs gap-1.5",
    sm: "px-3 py-2 text-sm gap-2", 
    md: "px-4 py-3 text-sm gap-2",
    lg: "px-6 py-4 text-base gap-3",
    xl: "px-8 py-5 text-lg gap-3"
  };

  const iconSizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-4 h-4", 
    lg: "w-5 h-5",
    xl: "w-6 h-6"
  };

  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    fullWidth && "w-full",
    className
  ].filter(Boolean).join(" ");

  const renderIcon = () => {
    if (loading) {
      return <Loader2 className={`animate-spin ${iconSizeClasses[size] || iconSizeClasses.md}`} />;
    }
    if (Icon) {
      return <Icon className={iconSizeClasses[size] || iconSizeClasses.md} />;
    }
    return null;
  };

  const iconElement = renderIcon();
  const showLeftIcon = iconElement && iconPosition === "left";
  const showRightIcon = iconElement && iconPosition === "right";

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {showLeftIcon && iconElement}
      {children}
      {showRightIcon && iconElement}
    </button>
  );
});

export default Button;
