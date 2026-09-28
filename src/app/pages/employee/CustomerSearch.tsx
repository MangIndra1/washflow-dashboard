import { useState } from 'react';
import { Search, Phone, Mail, MapPin, Star, ShoppingBag, DollarSign, Clock, MessageSquare, QrCode, X } from 'lucide-react';
import { customers, orders, membershipTiers } from '../../data/mockData';
import { StatusBadge } from '../../components/ui/StatusBadge';

type Customer = typeof customers[0];

const tierColors: Record<string, { bg: string; text: string }> = {
  Bronze:   { bg: 'bg-amber-100',   text: 'text-amber-800' },
  Silver:   { bg: 'bg-slate-200',   text: 'text-slate-700' },
  Gold:     { bg: 'bg-yellow-100',  text: 'text-yellow-800' },
  Platinum: { bg: 'bg-blue-100',    text: 'text-blue-800' },
};

export default function CustomerSearch() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [filterTier, setFilterTier] = useState('');

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
      || c.phone.includes(search)
      || c.email.toLowerCase().includes(search.toLowerCase());
    const matchTier = !filterTier || c.membershipTier === filterTier;
    return matchSearch && matchTier;
  });

  const customerOrders = selected ? orders.filter(o => o.customerId === selected.id) : [];
  const tier = selected ? membershipTiers.find(t => t.name === selected.membershipTier) : null;
  const tierStyle = selected ? tierColors[selected.membershipTier] : { bg: '', text: '' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-slate-900">Customer Search</h1>
        <p className="text-slate-500 text-sm mt-1">Search customers, view history, and manage loyalty points</p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {['', 'Bronze', 'Silver', 'Gold', 'Platinum'].map(t => (
            <button
              key={t || 'all'}
              onClick={() => setFilterTier(t)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filterTier === t ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {t || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="xl:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500 font-medium">{filtered.length} customers found</p>
          </div>
          <div className="divide-y divide-slate-50 overflow-y-auto max-h-[60vh]">
            {filtered.map(c => {
              const style = tierColors[c.membershipTier];
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors ${selected?.id === c.id ? 'bg-emerald-50 border-l-2 border-emerald-500' : ''}`}
                >
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-slate-600">{c.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                    <p className="text-xs text-slate-400 truncate">{c.phone}</p>
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${style.bg} ${style.text}`}>
                    {c.membershipTier}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Search className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">No customers found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Profile */}
        <div className="xl:col-span-2">
          {!selected ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 text-slate-400">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-base font-medium">Select a customer to view profile</p>
              <p className="text-sm mt-1 opacity-60">Search and click any customer from the list</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className={`h-24 rounded-t-xl ${tierStyle.bg} relative`}>
                  <div className="absolute -bottom-8 left-6">
                    <div className="h-16 w-16 rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center">
                      <span className="text-xl font-bold text-slate-600">{selected.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                  </div>
                </div>
                <div className="px-6 pt-12 pb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-slate-900 font-bold text-lg">{selected.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="h-4 w-4" style={{ color: tier?.color || '#B45309' }} />
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tierStyle.bg} ${tierStyle.text}`}>{selected.membershipTier}</span>
                        {tier && tier.discount > 0 && (
                          <span className="text-xs text-slate-400">{tier.discount}% discount active</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-colors">
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
                        <QrCode className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600">{selected.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600 truncate">{selected.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600 truncate">{selected.preferredBranch}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { icon: ShoppingBag, label: 'Total Orders', value: selected.totalOrders, color: 'text-blue-600' },
                      { icon: DollarSign, label: 'Total Spent', value: `$${selected.totalSpent.toFixed(2)}`, color: 'text-emerald-600' },
                      { icon: Star, label: 'Loyalty Points', value: selected.loyaltyPoints.toLocaleString(), color: 'text-amber-500' },
                      { icon: Clock, label: 'Last Visit', value: selected.lastVisit, color: 'text-slate-500' },
                    ].map(s => (
                      <div key={s.label} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                          <p className="text-xs text-slate-400">{s.label}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-900">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Loyalty Progress */}
                  {tier && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-slate-600">Loyalty Progress</p>
                        <p className="text-xs text-slate-400">
                          {selected.loyaltyPoints.toLocaleString()} / {tier.maxPoints ? tier.maxPoints.toLocaleString() : '∞'} pts
                        </p>
                      </div>
                      <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, tier.maxPoints ? (selected.loyaltyPoints / tier.maxPoints) * 100 : 100)}%`,
                            backgroundColor: tier.color,
                          }}
                        />
                      </div>
                      {tier.maxPoints && (
                        <p className="text-xs text-slate-400 mt-1.5">
                          {(tier.maxPoints - selected.loyaltyPoints).toLocaleString()} points to next tier
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Order History */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h4 className="text-slate-800 font-semibold">Transaction History</h4>
                  <span className="text-xs text-slate-400">{customerOrders.length} orders</span>
                </div>
                {customerOrders.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No orders at this branch</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {customerOrders.map(o => (
                      <div key={o.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-xs font-semibold text-slate-400">{o.id}</p>
                            <span className="text-xs text-slate-300">·</span>
                            <p className="text-xs text-slate-400">{o.createdAt}</p>
                          </div>
                          <p className="text-sm font-medium text-slate-900">{o.serviceName}</p>
                          {o.notes && <p className="text-xs text-amber-600 mt-0.5">Note: {o.notes}</p>}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <p className="text-sm font-semibold text-slate-900">${o.total.toFixed(2)}</p>
                          <StatusBadge status={o.paymentStatus} size="sm" />
                          <StatusBadge status={o.status} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
