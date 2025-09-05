import logo from '../assets/static/logo.png'
import avatar from '../assets/static/avatar.png'
import bot from '../assets/static/bot.png'
import twoMobiles from '../assets/static/twoMobiles.png'

import ContainerOne from '../components/containers/ContainerOne'
import ContainerTwo from '../components/containers/ContainerTwo'
import ContainerThree from '../components/containers/ContainerThree'
import LiveCryptoCoins from '../components/liveCryptoCoins/LiveCryptoCoins'
import USDTPriceCards from '../components/containers/USDTPriceCards'
import { useAppContext } from '../context/AppContext'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

const Home = () => {
  // get axios + virtual balance from context
  const { axios, userBalance } = useAppContext();

  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState("")
  const [processingHold, setProcessingHold] = useState(0); // sum of pending orders (USDT)
  const [loadingHold, setLoadingHold] = useState(true);

  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    if (storedUser) {
      setUserName(storedUser.name)
      setUserRole(storedUser.role)
    } else {
      setUserName("")
      setUserRole("")
    }
  }, [])

  // fetch user's pending orders → processing hold
  useEffect(() => {
    if (!isLoggedIn) {
      setProcessingHold(0);
      setLoadingHold(false);
      return;
    }
    (async () => {
      try {
        const res = await axios.get("/api/v1/users/orders");
        if (res.data?.success && Array.isArray(res.data.orders)) {
          const pendingSum = res.data.orders
            .filter(o => o.status === "pending")
            .reduce((s, o) => s + Number(o.amount || 0), 0);
          setProcessingHold(pendingSum);
        } else {
          setProcessingHold(0);
        }
      } catch (e) {
        console.error("home: fetch processing hold error:", e);
        setProcessingHold(0);
      } finally {
        setLoadingHold(false);
      }
    })();
  }, [axios, isLoggedIn]);

  // derive balances
  const available = Number(userBalance || 0); // virtual balance from backend
  const availableAfterHold = Math.max(0, available - Number(processingHold || 0));

  // Logic for name with role
  let nameWithRole = "Guest";
  if (userName && userRole) {
    if (userRole === "admin") {
      nameWithRole = `${userName} (Admin)`;
    } else if (userRole === "manager") {
      nameWithRole = `${userName} (Manager)`;
    } else if (userRole === "user") {
      nameWithRole = userName;
    } else {
      nameWithRole = userName;
    }
  } else if (userName && !userRole) {
    nameWithRole = userName;
  }

  return (
    <div className='rich-text'>
      {/* MAIN HEADER */}
      <div className='bg-secondary rounded-b-3xl pt-5 pb-2'>
        <div className='flex justify-between items-center'>
          <img width={100} className='rounded-3xl mx-3 cursor-pointer' src={logo} alt="" />
          {(userRole === "admin" || userRole === "manager") && (
            <NavLink to={"/admin"}>
              <button
                className='font-light mx-4 cursor-pointer px-4 py-2 rounded-sm bg-[#7928ff] text-white hover:bg-[#6a1de1]'
              >
                Dashboard
              </button>
            </NavLink>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 px-4 py-2 rounded-lg w-full max-w-md">
          {/* Avatar */}
          <div className="flex items-center gap-3 cursor-pointer">
            <img
              src={avatar}
              alt="User"
              className="w-12 h-12 rounded-full border-2 border-blue-500"
            />
            <div className="flex flex-col">
              {nameWithRole === "Guest" ? (
                <h2 className="rich-text pt-5 pb-2 font-semibold text-sm leading-4">
                  Welcome to Rupexo
                </h2>
              ) : (
                <h2 className="rich-text pt-5 pb-2 font-semibold text-sm leading-4">
                  {
                    loadingHold
                      ? "…"
                      : new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(availableAfterHold)
                  }
                </h2>
              )}
              <p className="rich-text text-xs mb-1">{nameWithRole}</p>
              {/* optional helper line to explain deduction */}
              {isLoggedIn && !loadingHold && (
                <p className="text-[10px] text-gray-400">
                  (Available after holds: {availableAfterHold.toFixed(2)} | Holds: {Number(processingHold || 0).toFixed(2)})
                </p>
              )}
            </div>
          </div>

          {/* Support Icon */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center">
            <a
              href='https://wa.me/923236619004?text=Hello%20Rupexo%20Support'
              target='_blank'
              rel="noreferrer"
            >
              <img
                src={bot}
                alt="Support"
                className="w-10 h-10 cursor-pointer"
              />
            </a>
          </div>
        </div>
      </div>

      {/* CONTAINERS */}
      <div className='mt-4 mx-4'>
        <USDTPriceCards />
        <ContainerOne />
        <ContainerTwo />
        <ContainerThree />
        <div className='my-6 flex justify-center items-center'>
          <img src={twoMobiles} alt="" />
        </div>
      </div>

      {/* Live Crypto Coins */}
      <LiveCryptoCoins />
    </div>
  )
}

export default Home
