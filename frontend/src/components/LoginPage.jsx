import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const demoAccounts = [
  { email: 'admin@collabhub.local', label: 'Admin', dept: 'Administration' },
  { email: 'ops.lead@collabhub.local', label: 'Sarah Mitchell', dept: 'Operations' },
  { email: 'eng.lead@collabhub.local', label: 'James Rodriguez', dept: 'Engineering' },
  { email: 'fin.lead@collabhub.local', label: 'Patricia Chen', dept: 'Finance' },
  { email: 'log.lead@collabhub.local', label: 'Michael Thompson', dept: 'Logistics' },
  { email: 'exec@collabhub.local', label: 'Director Reynolds', dept: 'Executive (Read-Only)' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  const quickLogin = async (acct) => {
    setError('');
    try {
      await login(acct.email, 'demo123');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#337ab7] text-white text-2xl font-bold mb-4">
            CH
          </div>
          <h1 className="text-2xl font-bold text-white">Collaboration Hub</h1>
          <p className="text-slate-400 text-sm mt-1">Federal IT Asset & Task Management</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@collabhub.local"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Password"
              />
            </div>
            <button type="submit" className="w-full bg-[#337ab7] hover:bg-[#2563eb] text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
              Sign In
            </button>
          </form>

          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-slate-500 mb-3 font-medium">Quick Demo Login:</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map(acct => (
                <button
                  key={acct.email}
                  onClick={() => quickLogin(acct)}
                  className="text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-xs font-medium text-slate-700">{acct.label}</div>
                  <div className="text-[10px] text-slate-400">{acct.dept}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
