// src/pages/BlockedAccount.jsx
export default function BlockedAccount() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">Account Blocked</h1>
        <p className="text-sm text-gray-600">
          Your account is currently blocked. Please contact support for assistance.
        </p>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }}
          className="mt-6 px-4 py-2 bg-gray-900 text-white rounded-lg"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
