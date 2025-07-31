import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const { axios, setToken } = useAppContext();
  const navigate = useNavigate(); // For programmatically redirecting to Home page

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Sending login data to backend
      const { data } = await axios.post('/api/v1/auth/login', { email, password });

      if (data.success) {
        // Storing the token and user in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));  // Store user details

        // Set token in axios for future requests
        setToken(data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

        // Showing success toast
        toast.success(data.message || "Logged in successfully!");

        // Redirect to Home page after successful login
        navigate('/'); // This will redirect to the / route (Home page)
      } else {
        // Show error toast if login fails
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      // Show error toast if there's any network or other issue
      toast.error(error?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className='flex items-center justify-center pt-6'>
      <div className='w-full max-w-sm p-6 max-md:m-6 border bg-white border-white shadow-xl shadow-primary/15 rounded-lg'>
        <div className='flex flex-col items-center justify-center'>

          <div className='w-full py-6 text-center'>
            <h1 className='text-3xl font-bold text-black'>
              <span className='text-[#6d4fc2]'>Login</span> Account
            </h1>
            <p className='font-light'>Enter your credentials to access the full functionality</p>
          </div>

          <form onSubmit={handleSubmit} className='mt-6 w-full sm:max-w-md text-gray-600'>

            <div className='flex flex-col'>
              <label>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder='Your email id'
                className='border-b-2 border-gray-300 p-2 outline-none mb-6'
              />
            </div>

            <div className='flex flex-col relative'>
              <label>Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                required
                placeholder='Your password'
                className='border-b-2 border-gray-300 p-2 outline-none mb-6'
              />
              <span
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 bottom-8 cursor-pointer text-sm text-gray-500"
              >
                {showPassword ? "Hide" : "Show"}
              </span>
            </div>

            <button
              type='submit'
              className='w-full py-3 mb-2 font-medium bg-[#6d4fc2] text-white rounded cursor-pointer hover:bg-primary/90'
            >
              Login
            </button>

            <div className="mt-4 text-sm text-gray-600">
              <p>
                New here?{" "}
                <Link to="/register" className="text-[#6d4fc2] font-semibold hover:underline">
                  Create an account
                </Link>
              </p>
              <div className="text-right text-sm text-blue-600 hover:underline mt-2">
                <Link to="/forgot-password">Forgot Password?</Link>
              </div>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
};

export default Login;
