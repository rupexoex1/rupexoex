import { NavLink } from "react-router-dom";
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
    <div className="min-h-screen bg-black text-white flex justify-center items-center flex-col p-6">
      <DepositQRCode walletAddress={walletAddress} />
      <NavLink to={"/user-transactions"}
        className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 cursor-pointer text-sm mt-6"
      >
        View Transaction History
      </NavLink>
    </div>
  );
};

export default Deposit;
