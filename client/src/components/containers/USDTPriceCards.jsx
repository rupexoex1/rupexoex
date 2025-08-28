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

    if (!selectedPlan) {
      toast.error('Select plan first');
      return;
    }
    const selectedPrice = selectedPlan === 'Basic' ? basicPrice : vipPrice;

    navigate('/sell', {
      state: { plan: selectedPlan, price: selectedPrice },
    });
  };

  const handleDepositClick = () => {
    if (!token) return navigate('/login');
    // ⬇️ Deposit now routes to /exchange (your unified deposit page)
    navigate('/exchange');
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-md bg-[#0b1220] border border-[#1d2740] rounded-2xl p-4 md:p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-white text-lg font-semibold">USDT Rates</h3>
            <p className="text-xs text-gray-400">Choose your plan to proceed</p>
          </div>

          {/* Tiny badge */}
          <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
            TRON • TRC20
          </span>
        </div>

        {/* Plan Cards */}
        <div className="space-y-3">
          <PriceCard
            type="Basic"
            price={basicPrice}
            range="100$ – 5,000$"
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

        {/* Actions */}
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

        {/* Notes */}
        <div className="mt-4 space-y-1 text-[11px] text-gray-400">
          <p>• Rates are indicative and can change with the market.</p>
          <p>• Selecting a plan applies the respective rate when selling.</p>
        </div>
      </div>
    </div>
  );
};

export default USDTPriceCards;
