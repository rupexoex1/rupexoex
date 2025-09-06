// src/pages/Profile.jsx
import { NavLink, useNavigate } from "react-router-dom";
import Signout from "../components/admin/Signout";
import coins from "../assets/static/coins.png";
import avatar from "../assets/static/avatar.png";
import bot from "../assets/static/bot.png";
import { assets } from "../assets/assets";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../context/AppContext";

const USD = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(n || 0)
  );

const Profile = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail = storedUser?.email || "guest@email.com";

  // from context
  const { axios, userBalance, fetchUserBalance } = useAppContext();

  // local
  const [processingHold, setProcessingHold] = useState(0); // orders + withdrawals
  const [loading, setLoading] = useState(true);

  // fetch balance + pending holds (orders + withdrawals)
  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      try {
        await fetchUserBalance(); // userBalance = NET (after holds)

        const [ordRes, wdRes] = await Promise.all([
          axios.get("/api/v1/users/orders"),
          axios.get("/api/v1/users/withdrawals"),
        ]);

        const orderHold = Array.isArray(ordRes.data?.orders)
          ? ordRes.data.orders
              .filter((o) => o.status === "pending")
              .reduce((sum, o) => sum + Number(o.amount || 0), 0)
          : 0;

        const withdrawHold = Array.isArray(wdRes.data?.withdrawals)
          ? wdRes.data.withdrawals
              .filter((w) => w.status === "pending")
              .reduce(
                (sum, w) => sum + Number(w.amount || 0) + Number(w.feeUSD ?? 7),
                0
              )
          : 0;

        setProcessingHold(orderHold + withdrawHold);
      } catch (e) {
        console.error("Profile fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoggedIn, axios, fetchUserBalance]);

  // ✅ Correct math:
  // Available = userBalance (already after holds)
  // Processing = pending orders + pending withdrawals(+fee)
  // Total = Available + Processing
  const available = Number(userBalance || 0);
  const processing = Number(processingHold || 0);
  const total = useMemo(() => available + processing, [available, processing]);

  const handleBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate("/");
  };

  if (!isLoggedIn) {
    return (
      <div className="w-full flex flex-col justify-center items-center px-4">
        <img src={coins} alt="WX Logo" className="rounded-lg object-cover" />
        <h2 className="rich-text pt-5 pb-4 font-semibold !text-3xl leading-4">
          Welcome to Rupexo
        </h2>
        <p className="rich-text text-xs mb-10 text-center">
          Welcome to the world's largest cryptocurrency marketplace. Sign up to
          explore more about cryptos.
        </p>
        <div className="space-x-2">
          <NavLink
            to="/register"
            className="font-light px-6 py-2 rounded-sm bg-[#7928ff] text-white hover:bg-[#6a1de1]"
          >
            Register
          </NavLink>
          <NavLink
            to="/login"
            className="font-light px-6 py-2 rounded-sm bg-[#7928ff] text-white hover:bg-[#6a1de1]"
          >
            Login
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0F172A] min-h-screen text-white flex flex-col">
      <div className="p-4 flex-1">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white"
            title="Go Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-full flex items-center justify-center">
            <a
              href="https://wa.me/923236619004?text=Hello%20Rupexo%20Support"
              target="_blank"
              rel="noreferrer"
            >
              <img src={bot} alt="Bot" className="w-10 h-10 cursor-pointer" />
            </a>
          </div>
        </div>

        {/* Avatar & Email */}
        <div className="flex flex-col items-center">
          <img
            src={avatar}
            alt="User Avatar"
            className="w-20 h-20 rounded-full border-2 border-white mb-2 object-cover"
          />
          <p className="text-sm text-gray-300">{userEmail}</p>
        </div>

        {/* Balance Boxes */}
        <div className="grid grid-cols-3 gap-2 mt-6 text-center text-sm">
          <BalanceBox
            label="Total"
            loading={loading}
            value={total}
          />
          <BalanceBox
            label="Available"
            loading={loading}
            value={available}
          />
          <BalanceBox
            label="Processing"
            loading={loading}
            value={processing}
          />
        </div>

        {/* Action List */}
        <div className="mt-6 space-y-3">
          <ActionItem
            iconSrc={assets.exchange_tab}
            label="Exchange History"
            link="/orders"
          />
          <ActionItem
            iconSrc={assets.recent_transaction}
            label="Recent USDT Transactions"
            link="/user-transactions"
          />
          {/* Withdrawals list */}
          <ActionItem
            iconSrc={assets.exchange_tab}
            label="My Withdrawals"
            link="/withdrawals"
          />
          <ActionItem
            iconSrc={assets.bank_account}
            label="Bank Accounts"
            link="/select-payee"
          />
          <ActionItem
            iconSrc={assets.reset_transaction}
            label="Reset transaction password"
          />
          {/* Withdraw page */}
          <ActionItem
            iconSrc={assets.withdraw}
            label="Withdraw USDT"
            link="/withdraw"
          />
        </div>

        {/* Signout */}
        <div className="mt-6">
          <Signout />
        </div>
      </div>
    </div>
  );
};

const BalanceBox = ({ label, value, loading }) => {
  const full = loading ? "…" : USD(value);
  const show = loading
    ? "…"
    : full.length > 14
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(Number(value || 0))
    : full;

  return (
    <div className="bg-[#1E293B] p-3 rounded">
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="text-xs font-bold truncate" title={full}>
        {show}
      </p>
    </div>
  );
};

const ActionItem = ({ iconSrc, label, link }) => (
  <NavLink
    to={link || "#"}
    className="bg-[#1E293B] px-4 py-3 rounded flex items-center justify-between cursor-pointer hover:bg-[#273549] transition"
  >
    <div className="flex items-center gap-3">
      <img src={iconSrc} alt={label} className="w-5 h-5" />
      <span className="text-sm">{label}</span>
    </div>
    <span className="text-gray-400 text-lg font-bold">›</span>
  </NavLink>
);

export default Profile;
