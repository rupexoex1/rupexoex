import { NavLink, useNavigate } from "react-router-dom";
import Signout from "../components/admin/Signout";
import coins from "../assets/static/coins.png";
import avatar from "../assets/static/avatar.png";
import bot from "../assets/static/bot.png";
import { assets } from "../assets/assets";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../context/AppContext";

const Profile = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail = storedUser?.email || "guest@email.com";

  // from context
  const { axios, userBalance, fetchUserBalance } = useAppContext();

  // local: processing & loading
  const [processingBalance, setProcessingBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // fetch available (context) + pending orders -> processing
  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      try {
        await fetchUserBalance(); // sets userBalance in context

        const res = await axios.get("/api/v1/users/orders");
        if (res.data?.success && Array.isArray(res.data.orders)) {
          const pendingSum = res.data.orders
            .filter((o) => o.status === "pending")
            .reduce((sum, o) => sum + Number(o.amount || 0), 0);
          setProcessingBalance(pendingSum);
        }
      } catch (e) {
        console.error("Profile fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoggedIn, axios, fetchUserBalance]);

  // balances
  const available = Number(userBalance || 0);
  const availableAfterHold = Math.max(0, available - Number(processingBalance || 0)); // show holds deducted
  const total = useMemo(
    () => availableAfterHold + Number(processingBalance || 0),
    [availableAfterHold, processingBalance]
  );

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
          Welcome to the world's largest cryptocurrency marketplace. Sign up to explore more about cryptos.
        </p>
        <div className="space-x-2">
          <NavLink to="/register" className="font-light px-6 py-2 rounded-sm bg-[#7928ff] text-white hover:bg-[#6a1de1]">
            Register
          </NavLink>
          <NavLink to="/login" className="font-light px-6 py-2 rounded-sm bg-[#7928ff] text-white hover:bg-[#6a1de1]">
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
            value={
              loading
                ? "…"
                : new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(total)
            }
          />

          <BalanceBox
            label="Available"
            value={
              loading
                ? "…"
                : new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(availableAfterHold)
            }
          />

          <BalanceBox
            label="Processing"
            value={
              loading
                ? "…"
                : new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(Number(processingBalance))
            }
          />
        </div>

        {/* Action List */}
        <div className="mt-6 space-y-3">
          <ActionItem iconSrc={assets.exchange_tab} label="Exchange History" link="/orders" />
          <ActionItem iconSrc={assets.recent_transaction} label="Recent USDT Transactions" link="/user-transactions" />
          {/* NEW: My Withdrawals list */}
          <ActionItem iconSrc={assets.exchange_tab} label="My Withdrawals" link="/withdrawals" />
          <ActionItem iconSrc={assets.bank_account} label="Bank Accounts" link="/select-payee" />
          <ActionItem iconSrc={assets.reset_transaction} label="Reset transaction password" />
          <ActionItem iconSrc={assets.withdraw} label="Withdraw USDT" />
        </div>

        {/* Signout */}
        <div className="mt-6">
          <Signout />
        </div>
      </div>
    </div>
  );
};

// Balance card box
const BalanceBox = ({ label, value }) => (
  <div className="bg-[#1E293B] p-3 rounded">
    <p className="text-gray-400 text-xs">{label}</p>
    <p className="text-sm font-bold">{value}</p>
  </div>
);

// Action list row
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
