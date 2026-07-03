import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="mb-4 rounded-full bg-rose-100 p-4 text-rose-600">
        <ShieldAlert size={48} />
      </div>
      <h1 className="text-3xl font-bold text-slate-800">Access Denied</h1>
      <p className="text-slate-500 mt-2 max-w-md">
        You do not have permission to access this page. If you believe this is an error, please contact your administrator.
      </p>
      <Link 
        to="/login"
        className="mt-6 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-md shadow-primary-200"
      >
        Go to Login
      </Link>
    </div>
  );
};

export default Unauthorized;
