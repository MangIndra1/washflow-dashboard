import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Waves, Shield, Users, Building2, BarChart3, CheckCircle, ChevronRight, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { branches } from '../data/mockData';

const adminFeatures = ['Multi-branch performance analytics', 'Employee & service management', 'Financial reports & exports', 'Inventory & commission tracking'];
const employeeFeatures = ['Fast order intake with auto-numbering', 'Live Kanban order board', 'Customer history & loyalty lookup', 'Daily transaction summary'];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'role' | 'employee-branch'>('role');
  const [selectedBranch, setSelectedBranch] = useState('');

  const handleAdminLogin = () => {
    login({ role: 'admin', name: 'Alex Rivera', email: 'alex@cleanwave.app', avatar: 'AR' });
    navigate('/admin');
  };

  const handleEmployeeLogin = () => {
    const branch = branches.find(b => b.id === selectedBranch);
    if (!branch) return;
    login({
      role: 'employee', name: 'David Park', email: 'david@cleanwave.app',
      avatar: 'DP', branchId: branch.id, branchName: branch.name,
    });
    navigate('/employee');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-600/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Waves className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-xl leading-none">CleanWave</p>
              <p className="text-blue-300 text-xs mt-0.5">Laundry Management System</p>
            </div>
          </div>

          <div className="max-w-sm">
            <h1 className="text-white mb-4" style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.2 }}>
              Streamline your laundry operations
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              The complete SaaS platform for modern laundry businesses — from single shops to multi-branch enterprises.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4">
            {[
              { value: '4', label: 'Branches', icon: Building2 },
              { value: '1,240', label: 'Orders/Month', icon: BarChart3 },
              { value: '13', label: 'Team Members', icon: Users },
              { value: '$47K', label: 'Revenue/Month', icon: BarChart3 },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-white font-bold text-2xl">{stat.value}</p>
                <p className="text-slate-400 text-sm mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 py-4 border-t border-white/10">
            <div className="flex -space-x-2">
              {['SR', 'MC', 'EW'].map((av) => (
                <div key={av} className="h-8 w-8 rounded-full bg-blue-600 border-2 border-slate-900 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">{av}</span>
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-sm">Trusted by 3 branch managers today</p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Waves className="h-5 w-5 text-white" />
            </div>
            <p className="text-slate-900 font-bold text-lg">CleanWave</p>
          </div>

          {step === 'role' && (
            <>
              <div className="mb-8">
                <h2 className="text-slate-900" style={{ fontSize: '1.75rem', fontWeight: 700 }}>Welcome back</h2>
                <p className="text-slate-500 mt-1.5">Select your role to continue to the dashboard.</p>
              </div>

              <div className="space-y-4">
                {/* Admin Card */}
                <button
                  onClick={handleAdminLogin}
                  className="w-full text-left group relative p-5 rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <Shield className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <p className="text-slate-900 font-semibold">Admin</p>
                        <p className="text-slate-400 text-xs">Business Owner / Manager</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors mt-1" />
                  </div>
                  <div className="space-y-1.5">
                    {adminFeatures.map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                        <span className="text-xs text-slate-500">{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Demo</span>
                  </div>
                </button>

                {/* Employee Card */}
                <button
                  onClick={() => setStep('employee-branch')}
                  className="w-full text-left group relative p-5 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                        <Users className="h-5 w-5 text-emerald-600 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <p className="text-slate-900 font-semibold">Employee</p>
                        <p className="text-slate-400 text-xs">Branch Staff / Operator</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 transition-colors mt-1" />
                  </div>
                  <div className="space-y-1.5">
                    {employeeFeatures.map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        <span className="text-xs text-slate-500">{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Demo</span>
                  </div>
                </button>
              </div>

              <p className="text-center text-xs text-slate-400 mt-8">
                This is a demo environment. No real data is stored.
              </p>
            </>
          )}

          {step === 'employee-branch' && (
            <>
              <button
                onClick={() => setStep('role')}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors"
              >
                <ChevronRight className="h-4 w-4 rotate-180" /> Back to role selection
              </button>

              <div className="mb-8">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
                <h2 className="text-slate-900" style={{ fontSize: '1.75rem', fontWeight: 700 }}>Select your branch</h2>
                <p className="text-slate-500 mt-1.5">Choose the branch you're working at today.</p>
              </div>

              <div className="space-y-3 mb-6">
                {branches.map(branch => (
                  <button
                    key={branch.id}
                    onClick={() => setSelectedBranch(branch.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                      selectedBranch === branch.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    } ${branch.status !== 'active' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={branch.status !== 'active'}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-900 font-medium text-sm">{branch.name}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{branch.address}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {branch.status !== 'active' && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Maintenance</span>
                        )}
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          selectedBranch === branch.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                        }`}>
                          {selectedBranch === branch.id && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleEmployeeLogin}
                disabled={!selectedBranch}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
                  selectedBranch
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                Continue to Dashboard <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
