import { useState } from 'react';
import { Search, Star, Users, TrendingUp, Gift, Phone, Mail, Crown } from 'lucide-react';
import { customers, membershipTiers } from '@/data/mockData';

const tierColors: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  Bronze:   { bg: 'bg-amber-50',  text: 'text-amber-800',  border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' },
  Silver:   { bg: 'bg-slate-50',  text: 'text-slate-800',  border: 'border-slate-300', badge: 'bg-slate-200 text-slate-700' },
  Gold:     { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-300', badge: 'bg-yellow-100 text-yellow-800' },
  Platinum: { bg: 'bg-blue-50',   text: 'text-blue-800',   border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800' },
};

export default function MembershipPage() {
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('');

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchTier = !filterTier || c.membershipTier === filterTier;
    return matchSearch && matchTier;
  });

  const tierStats = membershipTiers.map(t => ({
    ...t,
    count: customers.filter(c => c.membershipTier === t.name).length,
  }));

  const totalPoints = customers.reduce((s, c) => s + c.loyaltyPoints, 0);
  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Membership & Loyalty</h1>
          <p className="text-slate-500 text-sm mt-1">Manage customer tiers, loyalty points, and member benefits</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          <Gift className="h-4 w-4" /> Configure Tiers
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: customers.length, sub: 'All tiers', icon: Users, color: 'blue' },
          { label: 'Platinum Members', value: customers.filter(c => c.membershipTier === 'Platinum').length, sub: 'Top loyalty tier', icon: Crown, color: 'blue' },
          { label: 'Total Points Issued', value: totalPoints.toLocaleString(), sub: 'Across all members', icon: Star, color: 'amber' },
          { label: 'Lifetime Value', value: `$${totalSpent.toFixed(0)}`, sub: 'All members combined', icon: TrendingUp, color: 'emerald' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">{c.label}</p>
              <div className={`h-9 w-9 rounded-lg bg-${c.color}-100 flex items-center justify-center`}>
                <c.icon className={`h-4.5 w-4.5 text-${c.color}-600`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{c.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {tierStats.map(tier => {
          const style = tierColors[tier.name] || tierColors.Bronze;
          return (
            <div key={tier.id} className={`rounded-xl border-2 ${style.border} ${style.bg} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5" style={{ color: tier.color }} />
                  <h4 className={`font-bold ${style.text}`}>{tier.name}</h4>
                </div>
                <span className={`text-xl font-bold ${style.text}`}>{tier.count}</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                {tier.minPoints.toLocaleString()} – {tier.maxPoints ? tier.maxPoints.toLocaleString() + ' pts' : '∞'}
              </p>
              <div className="space-y-1.5">
                {tier.benefits.map(benefit => (
                  <div key={benefit} className="flex items-start gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0`} style={{ backgroundColor: tier.color }} />
                    <p className="text-xs text-slate-600 leading-relaxed">{benefit}</p>
                  </div>
                ))}
              </div>
              {tier.discount > 0 && (
                <div className={`mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${style.badge}`}>
                  <Gift className="h-3 w-3" /> {tier.discount}% discount
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Member Search & List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-slate-900">Member Directory</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
            </div>
            <div className="flex items-center gap-1">
              {['', 'Bronze', 'Silver', 'Gold', 'Platinum'].map(t => (
                <button
                  key={t || 'all'}
                  onClick={() => setFilterTier(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterTier === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {t || 'All'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Member', 'Contact', 'Tier', 'Loyalty Points', 'Total Orders', 'Total Spent', 'Last Visit'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(customer => {
                const style = tierColors[customer.membershipTier] || tierColors.Bronze;
                return (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-slate-600 text-xs font-semibold">{customer.name.split(' ').map(n => n[0]).join('')}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{customer.name}</p>
                          <p className="text-xs text-slate-400">Since {customer.joinDate}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Phone className="h-3 w-3" /> {customer.phone}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail className="h-3 w-3" /> {customer.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5" style={{ color: membershipTiers.find(t => t.name === customer.membershipTier)?.color || '#B45309' }} />
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.badge}`}>{customer.membershipTier}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{customer.loyaltyPoints.toLocaleString()}</p>
                        <div className="h-1.5 w-20 bg-slate-200 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (customer.loyaltyPoints / 5000) * 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{customer.totalOrders}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">${customer.totalSpent.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{customer.lastVisit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400">{filtered.length} members shown</p>
        </div>
      </div>
    </div>
  );
}
