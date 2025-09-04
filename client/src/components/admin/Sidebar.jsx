import React from 'react'
import { NavLink } from 'react-router-dom'
import { assets } from '../../assets/assets'

const Sidebar = () => {
  return (
    <div className='flex flex-col border-r border-gray-200 min-h-full pt-6'>

      <NavLink
        end={true}
        to="/admin"
        className={({ isActive }) =>
          `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-64 cursor-pointer ${isActive && "bg-primary/10 border-r-4 border-primary"}`
        }
      >
        <img src={assets.home_icon} alt="" className="min-w-4 w-5" />
        <p className="hidden md:inline-block">Dashboard</p>
      </NavLink>

      <NavLink
        to="/admin/user"
        className={({ isActive }) =>
          `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-64 cursor-pointer ${isActive && "bg-primary/10 border-r-4 border-primary"}`
        }
      >
        <img src={assets.add_icon} alt="" className="min-w-4 w-5" />
        <p className="hidden md:inline-block">User Management</p>
      </NavLink>

      <NavLink
        to="/admin/wallet"
        className={({ isActive }) =>
          `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-64 cursor-pointer ${isActive && "bg-primary/10 border-r-4 border-primary"}`
        }
      >
        <img src={assets.list_icon} alt="" className="min-w-4 w-5" />
        <p className="hidden md:inline-block">Wallet Management</p>
      </NavLink>

      <NavLink
        to="/admin/order"
        className={({ isActive }) =>
          `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-64 cursor-pointer ${isActive && "bg-primary/10 border-r-4 border-primary"}`
        }
      >
        <img src={assets.comment_icon} alt="" className="min-w-4 w-5" />
        <p className="hidden md:inline-block">Order Management</p>
      </NavLink>

      {/* 🔥 New Withdrawals Management tab */}
      <NavLink
        to="/admin/withdrawals"
        className={({ isActive }) =>
          `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-64 cursor-pointer ${isActive && "bg-primary/10 border-r-4 border-primary"}`
        }
      >
        {/* if you have a “money” or “withdraw” icon in assets, replace this temporary comment_icon */}
        <img src={assets.comment_icon} alt="" className="min-w-4 w-5" />
        <p className="hidden md:inline-block">Withdrawals</p>
      </NavLink>

      <NavLink
        to="/admin/transactions"
        className={({ isActive }) =>
          `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-64 cursor-pointer ${isActive && "bg-primary/10 border-r-4 border-primary"}`
        }
      >
        <img src={assets.comment_icon} alt="" className="min-w-4 w-5" />
        <p className="hidden md:inline-block">Transactions History</p>
      </NavLink>

      <NavLink
        to="/admin/rate"
        className={({ isActive }) =>
          `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-64 cursor-pointer ${isActive && "bg-primary/10 border-r-4 border-primary"}`
        }
      >
        <img src={assets.comment_icon} alt="" className="min-w-4 w-5" />
        <p className="hidden md:inline-block">Rate Management</p>
      </NavLink>

      <NavLink
        to="/admin/role"
        className={({ isActive }) =>
          `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-64 cursor-pointer ${isActive && "bg-primary/10 border-r-4 border-primary"}`
        }
      >
        <img src={assets.role_management} alt="" className="min-w-4 w-5 text-black" />
        <p className="hidden md:inline-block">Role Management</p>
      </NavLink>

      <NavLink
        to="/admin/adjust-balance"
        className={({ isActive }) =>
          `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-64 cursor-pointer ${isActive && "bg-primary/10 border-r-4 border-primary"}`
        }
      >
        <img src={assets.comment_icon} alt="" className="min-w-4 w-5" />
        <p className="hidden md:inline-block">Balance Adjust</p>
      </NavLink>

      <NavLink
        to="/admin/settings"
        className={({ isActive }) =>
          `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-64 cursor-pointer ${isActive && "bg-primary/10 border-r-4 border-primary"}`
        }
      >
        <img src={assets.comment_icon} alt="" className="min-w-4 w-5" />
        <p className="hidden md:inline-block">Master Wallet</p>
      </NavLink>

    </div>
  )
}

export default Sidebar
