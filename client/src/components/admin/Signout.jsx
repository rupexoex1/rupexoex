import React from 'react'
import { useAppContext } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'

const Signout = () => {
  const { setToken } = useAppContext()
  const navigate = useNavigate()

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization']
    setToken(null);
    toast.success("Signed Out")
    navigate("/")
  }
  return (
    <button
      onClick={handleSignOut}
      className='font-light cursor-pointer px-6 py-2 rounded-sm bg-[#7928ff] text-white hover:bg-[#6a1de1]'
    >
      Sign Out
    </button>
  )
}


export default Signout