import DepositQRCode from "../../pages/deposit/DepositQRCode";

const Deposit = () => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const walletAddress = storedUser?.tronWallet?.address;

  if (!walletAddress) {
    return (
      <div className="text-center text-red-500 p-6">
        Wallet address not found. Please log in again.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center items-center p-6">
      <DepositQRCode walletAddress={walletAddress} />
    </div>
  );
};

export default Deposit;
