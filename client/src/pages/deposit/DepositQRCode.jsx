import QRCode from "react-qr-code";

const DepositQRCode = ({ walletAddress }) => {
  return (
    <div className="flex flex-col items-center space-y-4 bg-[#111] p-4 rounded-xl">
      <h2 className="text-white text-lg font-semibold">TRC20-USDT Deposit</h2>

      {/* QR Code */}
      <div className="bg-white p-2 rounded-lg">
        <QRCode value={walletAddress} size={180} />
      </div>

      {/* Wallet address */}
      <div className="text-white text-sm text-center break-words max-w-sm">
        {walletAddress}
      </div>

      {/* Copy Button */}
      <button
        onClick={() => {
          navigator.clipboard.writeText(walletAddress);
        }}
        className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 cursor-pointer text-sm"
      >
        Copy Address
      </button>
    </div>
  );
};

export default DepositQRCode;
