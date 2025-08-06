import { useAppContext } from "../../context/AppContext";

const BalanceCards = () => {
  const { userBalance } = useAppContext();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-white mb-6">
      <div className="bg-[#1e293b] p-4 rounded">
        <h3 className="text-sm">Total Balance</h3>
        <p className="text-lg font-bold">{(userBalance.available + userBalance.pending).toFixed(2)} USDT</p>
      </div>
      <div className="bg-[#1e293b] p-4 rounded">
        <h3 className="text-sm">Available Balance</h3>
        <p className="text-lg font-bold text-green-400">{userBalance.available.toFixed(2)} USDT</p>
      </div>
      <div className="bg-[#1e293b] p-4 rounded">
        <h3 className="text-sm">Pending Balance</h3>
        <p className="text-lg font-bold text-yellow-400">{userBalance.pending.toFixed(2)} USDT</p>
      </div>
    </div>
  );
};

export default BalanceCards;
