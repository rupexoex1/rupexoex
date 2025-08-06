import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

const SelectPayee = () => {
  const navigate = useNavigate();
  const { axios, selectedPlan, setSelectedBank } = useAppContext(); // ✅ Include selectedPlan from context
  const [accounts, setAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get("/api/v1/users/accounts");
      if (res.data.success) {
        setAccounts(res.data.accounts);
      }
    } catch (err) {
      toast.error("Failed to load bank accounts");
    }
  };

  const confirmDelete = (id) => {
    setSelectedAccountId(id);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/v1/users/accounts/${selectedAccountId}`);
      toast.success("Account deleted");
      fetchAccounts(); // Refresh the list
    } catch (err) {
      toast.error("Failed to delete account");
    } finally {
      setShowModal(false);
      setSelectedAccountId(null);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => navigate(-1)} className="text-xl">{'←'}</button>
        <h1 className="text-lg font-bold">Bank Account</h1>
        <div className="w-6" />
      </div>

      {/* Account Cards */}
      <div className="space-y-4">
        {accounts.length === 0 && (
          <p className="text-center text-gray-400">No accounts found</p>
        )}

        {accounts.map((acc) => (
          <div
            key={acc._id}
            className="bg-[#1e293b] rounded-xl p-4 text-sm relative space-y-2 transition"
          >
            {/* Clickable Account Info */}
            <div
              onClick={() => {
                setSelectedBank(acc);
                navigate('/sell', {
                  state: {
                    selectedAccount: acc,
                    selectedPlan,
                  },
                }); navigate('/sell', {
                  state: {
                    plan: selectedPlan,
                    price: selectedPlan === 'Basic' ? 85 : 90, // or whatever logic you're using
                    selectedAccount: acc, // keep this if you’ll later use it
                  },
                });

              }}
              className="space-y-2 cursor-pointer hover:bg-[#334155] p-2 rounded-md"
            >
              <div className="flex justify-between border-b border-[#334155] pb-1">
                <span className="text-white/70">Account No</span>
                <span className="font-semibold">{acc.accountNumber}</span>
              </div>

              <div className="flex justify-between border-b border-[#334155] pb-1">
                <span className="text-white/70">IFSC</span>
                <span className="font-semibold">{acc.ifsc}</span>
              </div>

              <div className="flex justify-between border-b border-[#334155] pb-1">
                <span className="text-white/70">Account Name</span>
                <span className="font-semibold">{acc.holderName}</span>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex justify-between items-center pt-2">
              <div>
                <p className="text-white/70">Create time</p>
                <p className="font-semibold">
                  {new Date(acc.createdAt).toISOString().split(".")[0].replace("T", " ")}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDelete(acc._id);
                }}
                className="bg-[#0f172a] hover:bg-red-700 p-2 rounded-xl transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>

            </div>
          </div>
        ))}
      </div>

      {/* Add Account Button */}
      <div className="mt-6">
        <button
          onClick={() => navigate('/add-bank-account')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full font-semibold"
        >
          Add new bank account
        </button>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#1e293b] p-6 rounded-lg w-[90%] max-w-sm">
            <h2 className="text-lg font-bold mb-4">Delete Confirmation</h2>
            <p className="mb-6">Are you sure you want to delete this account?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectPayee;
