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

const App = () => {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/exchange" element={<Exchange />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/coin/:coinId" element={<Coin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-reset-otp" element={<VerifyResetOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
      </Routes>
    </>
  )
}

export default App