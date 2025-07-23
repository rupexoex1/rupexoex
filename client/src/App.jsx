import { Route, Routes } from "react-router-dom"
import Layout from "./layout/Layout"
import Home from "./pages/Home"
import Exchange from "./pages/Exchange"
import Orders from "./pages/Orders"
import Profile from "./pages/Profile"
import Coin from "./components/liveCryptoCoins/Coin"
import Register from "./components/admin/Register"
import Login from "./components/admin/Login"

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/exchange" element={<Exchange />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/coin/:coinId" element={<Coin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Route>
    </Routes>
  )
}

export default App