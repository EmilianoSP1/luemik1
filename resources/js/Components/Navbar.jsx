export default function Navbar({ active = "Home" }) {
  const items = [
    { label: "Home", href: "#" },
    { label: "Docs", href: "#" },
    { label: "Showcase", href: "#" },
  ];

  return (
    <nav className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-full px-8 py-2 flex gap-8 shadow-lg mx-auto mt-8 w-fit z-20 relative">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          className={`text-lg font-medium transition-all duration-200 
            ${active === item.label ? "text-white" : "text-gray-300"} 
            flex items-center gap-2 relative`}
        >
          {active === item.label && (
            <span className="block w-2 h-2 bg-white rounded-full mr-2"></span>
          )}
          {item.label}
        </a>
      ))}
    </nav>
  );
}
