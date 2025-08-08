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
      className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded font-semibold"
    >
      Sign Out
    </button>
  )
}


export default Signout