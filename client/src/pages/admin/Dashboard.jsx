import { useState } from "react";
import { assets } from "../../assets/assets.js";
import DashboardCard from "../../components/admin/dashboardComponents/DashboardCard.jsx";

const Dashboard = () => {
  const [stats, setStats] = useState({
    todayNewUsers: 0,
    userGrowthPercent: 0,
  });
  return (
    <div className="min-h-screen bg-white p-10 grid grid-cols-1 md:grid-cols-3 gap-6">
      <DashboardCard
        title="Number of new users registered today"
        value="2,847"
        percentage={12}
        comparison="vs last month"
        icon={assets.people}
        iconBg="bg-[#156BF41A]"
      />
      <DashboardCard
        title="Total amount of deposits (in USDT) today."
        value="184"
        percentage={8}
        comparison="vs last month"
        icon={assets.badge}
        iconBg="bg-[#F8C6301A]"
      />
      <DashboardCard
        title="Total orders in INR pending."
        value="2,663"
        percentage={15}
        comparison="vs last month"
        icon={assets.star}
        iconBg="bg-[#156BF41A]"
      />
    </div>
  )
}

export default Dashboard