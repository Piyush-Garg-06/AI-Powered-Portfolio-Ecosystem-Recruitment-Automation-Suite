export function Button({
  children,
  className = "",
  ...props
}) {
  return (
    <button
      {...props}
      className={`
      px-5
      py-3
      rounded-xl
      bg-gradient-to-r
      from-violet-600
      to-purple-600
      text-white
      font-semibold
      hover:scale-[1.02]
      transition-all
      duration-300
      disabled:opacity-50
      ${className}
      `}
    >
      {children}
    </button>
  );
}