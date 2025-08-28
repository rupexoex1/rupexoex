import { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'react-hot-toast';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const Exchange = () => {
  const { axios } = useAppContext();
  const navigate = useNavigate();

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const userWallet = storedUser?.tronWallet?.address || '';
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('auto'); // 'manual' | 'auto'
  const [address, setAddress] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // POST as per your route
        const res = await axios.post('/api/v1/users/check-deposit');
        if (mounted && res.data?.success) {
          if (res.data.mode === 'manual') {
            setMode('manual');
            setAddress(res.data.masterWalletAddress || '');
          } else {
            setMode('auto');
            setAddress(userWallet || '');
          }
        }
      } catch (err) {
        console.error('check-deposit error:', err?.response?.data || err?.message);
        // fallback gracefully
        setMode('auto');
        setAddress(userWallet || '');
      } finally {
        mounted = false;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [axios, userWallet]);

  const copy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied!');
    } catch {
      toast.error('Copy failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center">
        <div className="animate-pulse bg-[#101a30] border border-[#1d2740] rounded-xl p-6 w-[92%] max-w-md">
          <div className="h-5 w-40 bg-[#142040] rounded mb-4" />
          <div className="h-40 bg-[#142040] rounded mb-4" />
          <div className="h-10 bg-[#142040] rounded" />
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 font-medium">Wallet address not found.</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
          >
            Login Again
          </button>
        </div>
      </div>
    );
  }

  const isManual = mode === 'manual';

  return (
    <div className="min-h-screen bg-[#0b1220] text-white py-8 px-4 flex justify-center">
      <div className="w-full max-w-md bg-[#0f172a] border border-[#1d2740] rounded-2xl p-5 shadow-xl">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-semibold">Deposit USDT (TRC20)</h1>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`text-[10px] px-2 py-1 rounded-full ${isManual ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}
            >
              {isManual ? 'Manual mode' : 'Auto mode'}
            </span>
            <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
              Network: TRON (TRC20)
            </span>
          </div>
        </div>

        {/* QR */}
        <div className="bg-white rounded-xl p-3 mx-auto w-fit">
          <QRCode value={address} size={200} />
        </div>

        {/* Address + copy */}
        <div className="mt-4">
          <p className="text-xs text-gray-400 mb-1">
            {isManual ? 'Master Wallet Address' : 'Your Deposit Address'}
          </p>
          <div className="bg-[#0b1220] border border-[#1d2740] rounded-lg p-3 break-words text-sm">
            {address}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={copy}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
            >
              Copy Address
            </button>
            <NavLink
              to="/user-transactions"
              className="w-full text-center py-2 rounded-lg bg-[#1f2937] hover:bg-[#223149] text-white font-semibold transition-colors"
            >
              View History
            </NavLink>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-5 text-[11px] text-gray-400 space-y-2">
          <p>• Send only <span className="text-gray-200 font-medium">USDT (TRC20)</span> to this address.</p>
          <p>• Deposits need network confirmations to appear.</p>
          {isManual ? (
            <p>• In manual mode, your funds go to the master wallet. Admin will credit your balance.</p>
          ) : (
            <p>• In auto mode, your funds are auto-forwarded and balance updates automatically.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Exchange;
