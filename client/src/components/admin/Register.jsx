import React, { useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Register = () => {

  const { axios, setToken, navigate } = useAppContext();

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post('/api/v1/auth/register', { name, phone, email, password, role: "user" })
      if (res.data.success) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        setToken(res.data.token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
        setTimeout(() => {
          navigate("/")
        }, 1000);
        toast.success(res.data.message || "Registered successfully!")
      } else {
        toast.error(res.data.message || "Registration failed")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Registration failed")
    }
  }

  return (
    <div className='flex items-center justify-center h-screen'>
      <div className='w-full max-w-sm p-6 max-md:m-6 border bg-white border-white shadow-xl shadow-primary/15 rounded-lg'>
        <div className='flex flex-col items-center justify-center'>

          <div className='w-full py-6 text-center'>
            <h1 className='text-3xl font-bold text-[#6d4fc2]'><span className='text-black'>Register</span> Account</h1>
            <p className='font-light'>Enter your credentials to access the full functionality</p>
          </div>

          <form onSubmit={handleSubmit} className='mt-6 w-full sm:max-w-md text-gray-600'>

            <div className='flex flex-col'>
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} type='text' required placeholder='Enter your full name' className='border-b-2 border-gray-300 p-2 outline-none mb-6' />
            </div>

            <div className='flex flex-col'>
              <label>Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" required placeholder='Enter your phone number' className='border-b-2 border-gray-300 p-2 outline-none mb-6' />
            </div>

            <div className='flex flex-col'>
              <label>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder='Your email id' className='border-b-2 border-gray-300 p-2 outline-none mb-6' />
            </div>

            <div className='flex flex-col'>
              <label>Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder='Your password' className='border-b-2 border-gray-300 p-2 outline-none mb-6' />
            </div>

            <button type='submit' className='w-full py-3 mb-2 font-medium bg-[#6d4fc2] text-white rounded cursor-pointer hover:bg-primary/90'>Register</button>

            <p>
              Already have an account?{" "}
              <Link to="/login" className="text-[#6d4fc2] font-semibold hover:underline">
                Register
              </Link>
            </p>

          </form>

        </div>
      </div>
    </div>
  )
}

export default Register