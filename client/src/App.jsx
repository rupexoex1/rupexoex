import { Toaster } from "react-hot-toast";
import { Route, Routes } from "react-router-dom";
import CryptoLoader from "./components/CryptoLoader";
import Layout from "./layout/Layout";
import Home from "./pages/Home";
import Exchange from "./pages/Exchange";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Coin from "./components/liveCryptoCoins/Coin";
import Register from "./components/admin/Register";
import Login from "./components/admin/Login";
import VerifyOtp from "./components/admin/VerifyOtp";
import ForgotPassword from "./components/admin/ForgotPassword";
import VerifyResetOtp from "./components/admin/VerifyResetOtp "; // 🔧 space removed
import ResetPassword from "./components/admin/ResetPassword";
import AdminLayout from "./pages/admin/AdminLayout";
import Deposit from "./pages/deposit/Deposit";
import SellUSDT from "./pages/sell/SellUSDT";
import WithdrawUSDT from "./pages/WithdrawUSDT";
import WithdrawTracking from "./pages/WithdrawTracking";
import UserWithdrawals from "./pages/UserWithdrawals";

import { useAppContext } from "./context/AppContext";
import Dashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import WalletManagement from "./pages/admin/WalletManagement";
import RateManagement from "./pages/admin/RateManagement";
import OrderManagement from "./pages/admin/OrderManagement";
import TransactionHistory from "./pages/admin/TransactionHistory";
import RoleManagement from "./pages/admin/RoleManagement";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import UserTransactions from "./pages/transactions/UserTransactions";
import SelectPayee from "./pages/sell/SelectPayee";
import AddBankAccount from "./pages/sell/AddBankAccount";
import OrderTracking from "./pages/order/OrderTracking";
import MasterWalletSettings from "./pages/admin/MasterWalletSettings";
import BalanceAdjust from "./pages/admin/BalanceAdjust";
import WithdrawalsManagement from "./pages/admin/WithdrawalsManagement";
import BlockedAccount from "./pages/BlockedAccount";
import BlockGuard from "./components/BlockGuard";

// 🔐 new guard for signed-in user pages
import RequireAuth from "./components/RequireAuth";

const App = () => {
  const { token, loading } = useAppContext();

  // ⏳ simple loading gate to prevent first-render flicker
  if (loading) {
    return (
      <>
        <Toaster />
        <CryptoLoader />
      </>
    );
  }

  return (
    <>
      <Toaster />
      <BlockGuard />

      <Routes>
        <Route path="/" element={<Layout />}>
          {/* USER ROUTES */}
          <Route index element={<Home />} />
          <Route
            path="/exchange"
            element={
              <RequireAuth>
                <Exchange />
              </RequireAuth>
            }
          />
          <Route
            path="/orders"
            element={
              <RequireAuth>
                <Orders />
              </RequireAuth>
            }
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="/coin/:coinId" element={<Coin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-reset-otp" element={<VerifyResetOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/withdraw" element={<WithdrawUSDT />} />
          <Route path="/user-transactions" element={<UserTransactions />} />
          <Route path="/sell" element={<SellUSDT />} />
          <Route path="/select-payee" element={<SelectPayee />} />
          <Route path="/add-bank-account" element={<AddBankAccount />} />
          <Route path="/order-tracking/:id" element={<OrderTracking />} />
          <Route path="/withdraw-tracking/:id" element={<WithdrawTracking />} />
          <Route path="/withdrawals" element={<UserWithdrawals />} />
          <Route path="/blocked" element={<BlockedAccount />} />
        </Route>

        {/* ADMIN / MANAGER */}
        <Route element={<ProtectedRoute allowedRoles={["admin", "manager"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="user" element={<UserManagement />} />
            <Route path="wallet" element={<WalletManagement />} />
            <Route path="order" element={<OrderManagement />} />
            <Route path="transactions" element={<TransactionHistory />} />
            <Route path="rate" element={<RateManagement />} />
            <Route path="role" element={<RoleManagement />} />
            <Route path="settings" element={<MasterWalletSettings />} />
            <Route path="adjust-balance" element={<BalanceAdjust />} />
            <Route path="withdrawals" element={<WithdrawalsManagement />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
};

export default App;
