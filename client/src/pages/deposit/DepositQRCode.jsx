import toast from "react-hot-toast";
import QRCode from "react-qr-code";

const DepositQRCode = ({ walletAddress }) => {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      toast.success("Address copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 bg-[#111] p-5 rounded-2xl shadow-lg w-full max-w-sm">
      <h2 className="text-white text-lg font-semibold">USDT (TRC20) Deposit</h2>

      <div className="bg-white p-3 rounded-xl">
        <QRCode value={walletAddress} size={180} />
      </div>

      <div className="w-full">
        <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
          Wallet Address
        </div>
        <div className="text-white text-xs break-words bg-black/40 border border-white/10 rounded-lg p-3">
          {walletAddress}
        </div>
      </div>

      <button
        onClick={copy}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm w-full"
      >
        Copy Address
      </button>
    </div>
  );
};

export default DepositQRCode;
