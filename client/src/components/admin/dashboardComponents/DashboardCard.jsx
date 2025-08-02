export default function DashboardCard({
  title,
  value,
  percentage,
  comparison,
  icon,
  iconBg = "bg-blue-700",
}) {
  return (
    <div className="bg-[#1A1A1A] text-white max-h-[11rem] p-6 rounded-xl w-full max-w-sm shadow-md">
      <div className="flex justify-between items-start">
        <p className="text-sm text-gray-400">{title}</p>
        <div className={`p-2 rounded-full ${iconBg}`}> <img src={icon} alt="" /></div>
      </div>
      <h2 className="text-3xl font-bold mt-2">{value}</h2>
      <div className="flex items-center gap-2 mt-1">
        <span className="bg-blue-600 text-xs px-2 py-1 rounded-md">
          +{percentage}%
        </span>
        <span className="text-sm text-gray-400">{comparison}</span>
      </div>
    </div>
  );
}