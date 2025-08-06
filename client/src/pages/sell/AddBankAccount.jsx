import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const AddBankAccount = () => {
  const navigate = useNavigate();
  const { axios } = useAppContext();

  const [form, setForm] = useState({
    accountNumber: '',
    ifsc: '',
    holderName: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { accountNumber, ifsc, holderName } = form;

    if (!accountNumber || !ifsc || !holderName) {
      return toast.error("Please fill all fields");
    }

    try {
      setLoading(true);
      const res = await axios.post('/api/v1/users/accounts', form);
      if (res.data.success) {
        toast.success('Account added successfully');
        navigate('/select-payee'); // redirect after add
      }
    } catch (err) {
      toast.error("Error adding account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="text-xl">{'←'}</button>
        <h1 className="text-lg font-bold">Add new Bank Account</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 mb-10">
        <div>
          <label className="block text-sm mb-1">Account Number</label>
          <input
            type="text"
            name="accountNumber"
            value={form.accountNumber}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-[#1e293b] text-white rounded outline-none"
            placeholder="Enter account number"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">IFSC</label>
          <input
            type="text"
            name="ifsc"
            value={form.ifsc}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-[#1e293b] text-white rounded outline-none"
            placeholder="Enter IFSC code"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Payee Name</label>
          <input
            type="text"
            name="holderName"
            value={form.holderName}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-[#1e293b] text-white rounded outline-none"
            placeholder="Enter name on account"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 text-white rounded font-semibold text-center ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Submitting...' : 'Commit'}
        </button>
      </form>
    </div>
  );
};

export default AddBankAccount;
