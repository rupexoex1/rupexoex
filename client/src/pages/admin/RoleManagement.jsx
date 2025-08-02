import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast, { Toaster } from 'react-hot-toast';

const RoleManagement = () => {
  const { axios } = useAppContext();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [roleChanges, setRoleChanges] = useState({}); // { userId: newRole }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/v1/users/admin/users');
      const sortedUsers = res.data.users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setUsers(sortedUsers);
    } catch (err) {
      toast.error('Failed to load users');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    setRoleChanges(prev => ({ ...prev, [userId]: newRole }));
  };

  const saveRoleChange = async (userId) => {
    const newRole = roleChanges[userId];
    const user = users.find(u => u._id === userId);

    const confirm = window.confirm(`Are you sure you want to change ${user.name}'s role to ${newRole}?`);
    if (!confirm) return;

    try {
      await axios.patch(`/api/v1/users/admin/users/${userId}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      await fetchUsers(); // auto refresh
      setRoleChanges(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    } catch (err) {
      toast.error('Failed to update role');
      console.error('Update error:', err);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <Toaster />
      <input
        type="text"
        className="mb-4 w-full p-2 border rounded"
        placeholder="Search users by name, email, or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <table className="w-full text-left border border-gray-300">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Joined Date</th>
              <th className="p-2">Role</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => {
              const currentRole = user.role;
              const selectedRole = roleChanges[user._id] || currentRole;
              const roleChanged = selectedRole !== currentRole;

              return (
                <tr key={user._id} className="border-b border-gray-300">
                  <td className="p-2">{user.name}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">{user.phone || '-'}</td>
                  <td className="p-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="p-2">
                    <select
                      value={selectedRole}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className="p-1 border rounded"
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="user">User</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => saveRoleChange(user._id)}
                      disabled={!roleChanged}
                      className={`px-3 py-1 rounded ${roleChanged
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RoleManagement;
