import logo from '../assets/static/logo.jpg'
import avatar from '../assets/static/avatar.png'
import bot from '../assets/static/bot.png'
import twoMobiles from '../assets/static/twoMobiles.png'

import ContainerOne from '../components/containers/ContainerOne'
import ContainerTwo from '../components/containers/ContainerTwo'
import ContainerThree from '../components/containers/ContainerThree'
import LiveCryptoCoins from '../components/liveCryptoCoins/LiveCryptoCoins'
import { useAppContext } from '../context/AppContext'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const Home = () => {

  const { user } = useAppContext();
  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    if (storedUser) {
      setUserName(storedUser.name)
      setUserRole(storedUser.role)
      toast.success(`Welcome ${storedUser.name}`)
    } else {
      setUserName("")
      setUserRole("")
    }
  }, [])
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
        <img width={100} className='rounded-3xl mx-3 cursor-pointer' src={logo} alt="" />
        <div className="flex items-center justify-between mt-2 px-4 py-2 rounded-lg w-full max-w-md">
          {/* Avatar */}
          <div className="flex items-center gap-3 cursor-pointer">
            <img
              src={avatar}
              alt="User"
              className="w-12 h-12 rounded-full border-2 border-blue-500"
            />
            <div className="flex flex-col">
              <h2 className="rich-text pt-5 pb-2 font-semibold text-sm leading-4">
                Welcome to Rupexo
              </h2>
              <p className="rich-text text-xs mb-1">{nameWithRole}</p>
            </div>
          </div>

          {/* Icon */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center">
            <a
              href='https://wa.me/923236619004?text=Hello%20Rupexo%20Support'
              target='_blank'
            >
              <img
                src={bot} // Replace with actual icon
                alt="Headset"
                className="w-10 h-10 cursor-pointer"
              />
            </a>
          </div>
        </div>
      </div>

      {/* CONTAINERS */}
      <div className='mt-4 mx-4'>
        <ContainerOne />
        <ContainerTwo />
        <ContainerThree />
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