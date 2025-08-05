import { Toaster } from "react-hot-toast"
import { Route, Routes } from "react-router-dom"
import Layout from "./layout/Layout"
import Home from "./pages/Home"
import Exchange from "./pages/Exchange"
import Orders from "./pages/Orders"
import Profile from "./pages/Profile"
import Coin from "./components/liveCryptoCoins/Coin"
import Register from "./components/admin/Register"
import Login from "./components/admin/Login"
import VerifyOtp from "./components/admin/VerifyOtp"
import ForgotPassword from "./components/admin/ForgotPassword"
import VerifyResetOtp from "./components/admin/VerifyResetOtp "
import ResetPassword from "./components/admin/ResetPassword"
import AdminLayout from "./pages/admin/AdminLayout"
import Deposit from "./pages/deposit/Deposit"

import { useAppContext } from "./context/AppContext"
import Dashboard from "./pages/admin/Dashboard"
import UserManagement from "./pages/admin/UserManagement"
import WalletManagement from "./pages/admin/WalletManagement"
import RateManagement from "./pages/admin/RateManagement"
import OrderManagement from "./pages/admin/OrderManagement"
import TransactionHistory from "./pages/admin/TransactionHistory"
import RoleManagement from "./pages/admin/RoleManagement"
import ProtectedRoute from "./components/admin/ProtectedRoute"



const App = () => {
  const { token } = useAppContext()
  return (
    <>
      <Toaster />
      <Routes>

        <Route path="/" element={<Layout />}>
          {/* USER ROUTES */}
          <Route index element={<Home />} />
          <Route path="/exchange" element={token ? <Exchange /> : <Login />} />
          <Route path="/orders" element={token ? <Orders /> : <Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/coin/:coinId" element={<Coin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-reset-otp" element={<VerifyResetOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/deposit" element={<Deposit />} />
        </Route>


        <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="user" element={<UserManagement />} />
            <Route path="wallet" element={<WalletManagement />} />
            <Route path="order" element={<OrderManagement />} />
            <Route path="transactions" element={<TransactionHistory />} />
            <Route path="rate" element={<RateManagement />} />
            <Route path="role" element={<RoleManagement />} />
          </Route>
        </Route>
      </Routes >
    </>
  )
}

export default App