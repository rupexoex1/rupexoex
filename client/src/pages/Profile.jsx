import React from 'react'
import Signout from '../components/admin/Signout'
import { Link } from 'react-router-dom'
import coins from '../assets/static/coins.png'

const Profile = () => {
  const isLoggedIn = localStorage.getItem('token');
  return (
    <>
      <div className='w-full flex justify-center items-center'>
        {isLoggedIn ? (

          <div className='flex flex-col justify-center items-center px-4'>
            <img
              src={coins}
              alt="WX Logo"
              className=" rounded-lg object-cover"
            />
            <h2 className="rich-text pt-5 pb-4 font-semibold !text-3xl leading-4">
                  Welcome to Rupexo
                </h2>
                <p className="rich-text text-xs mb-10 text-center">Welcome to the world's largest cryptocurrency marketplace. Sign up to explore more about cryptos.</p>
            <Signout />
          </div>
        ) : (
          <>
          <div className='flex flex-col justify-center items-center px-4'>
            <img
              src={coins}
              alt="WX Logo"
              className=" rounded-lg object-cover"
            />
            <h2 className="rich-text pt-5 pb-4 font-semibold !text-3xl leading-4">
                  Welcome to Rupexo
                </h2>
                <p className="rich-text text-xs mb-10 text-center">Welcome to the world's largest cryptocurrency marketplace. Sign up to explore more about cryptos.</p>
            <div className='space-x-2'>
                  <Link to={'/register'} className='font-light px-6 py-2 rounded-sm bg-[#7928ff] text-white hover:bg-[#6a1de1]'>Register</Link>
                  <Link to={'/login'} className='font-light px-6 py-2 rounded-sm bg-[#7928ff] text-white hover:bg-[#6a1de1]'>Login</Link>
                </div>
          </div>
            

          </>
        )}
      </div>

    </>
  )
}

export default Profile