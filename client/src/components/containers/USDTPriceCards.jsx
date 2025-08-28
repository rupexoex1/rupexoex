import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import PriceCard from './PriceCard';

const USDTPriceCards = () => {
  const {
    basicPrice,
    vipPrice,
    selectedPlan,
    setSelectedPlan,
    token,
  } = useAppContext();

  const navigate = useNavigate();

  const handleSelect = (plan) => {
    setSelectedPlan((prev) => (prev === plan ? null : plan));
  };

  const handleSellClick = () => {
    if (!token) return navigate('/login');
    if (!selectedPlan) return toast.error('Select plan first');
    const selectedPrice = selectedPlan === 'Basic' ? basicPrice : vipPrice;
    navigate('/sell', { state: { plan: selectedPlan, price: selectedPrice } });
  };

  const handleDepositClick = () => {
    if (!token) return navigate('/login');
    // ⬇️ yahan change — deposit page ki jagah /exchange
    navigate('/exchange');
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-md bg-[#0b1220] border border-[#1d2740] rounded-2xl p-4 md:p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-white text-lg font-semibold">USDT Rates</h3>
          <p className="text-xs text-gray-400">Select your plan to continue</p>
        </div>

        <div className="space-y-3">
          <PriceCard
            type="Basic"
            price={basicPrice}
            range="100$ - 5,000$"
            bgColor="#156BF4"
            isSelected={selectedPlan === 'Basic'}
            onSelect={() => handleSelect('Basic')}
          />
          <PriceCard
            type="VIP"
            price={vipPrice}
            range="≥ 5,000$"
            bgColor="#F8C630"
            isSelected={selectedPlan === 'VIP'}
            onSelect={() => handleSelect('VIP')}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={handleDepositClick}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
          >
            Deposit
          </button>

          <button
            onClick={handleSellClick}
            disabled={!selectedPlan}
            className={`w-full py-2 rounded-lg font-semibold transition-colors ${
              selectedPlan
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Sell USDT
          </button>
        </div>

        <div className="mt-3 text-[11px] text-gray-400 text-center">
          Rates may vary based on market conditions. Network: TRON (TRC20)
        </div>
      </div>
    </div>
  );
};

export default USDTPriceCards;
