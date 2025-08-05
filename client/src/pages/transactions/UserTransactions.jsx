import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import TransactionCard from "./TransactionCard";
import { useNavigate } from "react-router-dom";

import bot from "../../assets/static/bot.png";
import { ArrowLeft } from "lucide-react";

const UserTransactions = () => {
  const { axios, token } = useAppContext();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMyTransactions = async () => {
    try {
      const res = await axios.get("/api/v1/users/transactions");
      if (res.data.success && res.data.transactions.length > 0) {
        const sorted = res.data.transactions.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setTransactions(sorted);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyTransactions();
    }
  }, [token]);

  if (loading) return <p className="text-white text-center mt-10">Loading...</p>;
  if (transactions.length === 0) return <p className="text-white text-center mt-10">No transactions yet.</p>;

  return (
    <>
      {/* Header */}
      <div className="bg-secondary rounded-b-3xl py-5">
        <div className="flex justify-between items-center px-3">

          {/* Back + Title */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white"
              title="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
            <p className="rich-text !text-xl mb-1">Recent USDT Transactions</p>
          </div>

          {/* Bot Icon */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center">
            <a href="https://wa.me/923236619004?text=Hello%20Rupexo%20Support" target="_blank">
              <img src={bot} alt="Bot" className="w-10 h-10 cursor-pointer" />
            </a>
          </div>
        </div>

      
      </div>

      {/* Transaction Cards */}
      <div className="mt-6 flex flex-col gap-4 items-center p-4">
        {transactions.map((tx) => (
          <TransactionCard key={tx._id} tx={tx} />
        ))}
      </div>
    </>
  );
};

export default UserTransactions;
