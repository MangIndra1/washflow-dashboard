import { useState } from 'react';
import { Printer, CheckCircle, RotateCcw, QrCode, MessageSquare, Search, Plus } from 'lucide-react';
import { services, customers } from '@/data/mockData';
import { useAuth } from '@/features/auth/AuthContext';

const generateOrderId = () => {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-2026-${num}`;
};

const addDays = (days: number) => {
  const d = new Date('2026-02-27');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

type Step = 'form' | 'receipt';

export default function NewOrderPage() {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<Step>('form');
  const [orderId] = useState(generateOrderId());
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    serviceId: '',
    weight: '',
    quantity: '',
    paymentStatus: 'paid',
    notes: '',
    promoCode: '',
  });

  const selectedService = services.find(s => s.id === form.serviceId);
  const priceUnit = selectedService?.priceUnit || 'per kg';
  const isWeightBased = priceUnit === 'per kg';

  const subtotal = selectedService
    ? isWeightBased
      ? parseFloat(form.weight || '0') * selectedService.price
      : parseInt(form.quantity || '0') * selectedService.price
    : 0;

  const discount = form.promoCode === 'MEMBER10' ? subtotal * 0.10 : form.promoCode === 'FIRST20' ? subtotal * 0.20 : 0;
  const total = subtotal - discount;

  const dueDate = selectedService
    ? addDays(selectedService.estimatedTime.includes('72') ? 3 : selectedService.estimatedTime.includes('48') ? 2 : selectedService.estimatedTime.includes('24') ? 1 : 0)
    : addDays(1);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)
  ).slice(0, 5);

  const handleSubmit = () => {
    if (!form.customerName || !form.phone || !form.serviceId) return;
    setStep('receipt');
  };

  const handleNewOrder = () => {
    setForm({ customerName: '', phone: '', serviceId: '', weight: '', quantity: '', paymentStatus: 'paid', notes: '', promoCode: '' });
    setCustomerSearch('');
    setStep('form');
  };

  if (step === 'receipt') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Receipt Header */}
          <div className="bg-slate-900 p-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-7 w-7 text-white" />
            </div>
            <p className="text-white font-bold text-lg">Order Confirmed!</p>
            <p className="text-slate-400 text-sm mt-1">{currentUser?.branchName}</p>
          </div>

          <div className="p-6">
            {/* Order ID + QR */}
            <div className="flex items-center justify-between mb-5 p-4 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300">
              <div>
                <p className="text-xs text-slate-400 mb-1">Order Number</p>
                <p className="text-2xl font-bold text-slate-900 font-mono">{orderId}</p>
              </div>
              <div className="h-16 w-16 bg-slate-200 rounded-lg flex items-center justify-center">
                <QrCode className="h-10 w-10 text-slate-600" />
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-5">
              {[
                { label: 'Customer', value: form.customerName },
                { label: 'Phone', value: form.phone },
                { label: 'Service', value: selectedService?.name || '' },
                { label: isWeightBased ? 'Weight' : 'Quantity', value: isWeightBased ? `${form.weight} kg` : `${form.quantity} pcs` },
                { label: 'Branch', value: currentUser?.branchName || '' },
                { label: 'Received', value: '2026-02-27' },
                { label: 'Due Date', value: dueDate },
                { label: 'Payment', value: form.paymentStatus.charAt(0).toUpperCase() + form.paymentStatus.slice(1) },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-500">{row.label}</span>
                  <span className="text-sm font-medium text-slate-900">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 mb-5">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">Promo ({form.promoCode})</span>
                    <span className="text-emerald-600">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-emerald-200">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="font-bold text-emerald-700 text-lg">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {form.notes && (
              <div className="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs font-semibold text-amber-700 mb-1">Special Notes</p>
                <p className="text-sm text-amber-800">{form.notes}</p>
              </div>
            )}

            {/* WhatsApp Reminder UI */}
            <div className="mb-5 p-3 rounded-lg border border-emerald-200 bg-emerald-50 flex items-start gap-3">
              <MessageSquare className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-emerald-800">WhatsApp Notification</p>
                <p className="text-xs text-emerald-600 mt-0.5">Order confirmation sent to {form.phone}</p>
              </div>
              <button className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700 transition-colors">Send</button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors">
                <Printer className="h-4 w-4" /> Print Receipt
              </button>
              <button onClick={handleNewOrder} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
                <RotateCcw className="h-4 w-4" /> New Order
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-slate-900">New Order</h1>
        <p className="text-slate-500 text-sm mt-1">Fast order intake for {currentUser?.branchName}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        {/* Order ID Banner */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
          <div>
            <p className="text-xs text-slate-400">Auto-generated Order ID</p>
            <p className="text-base font-bold text-slate-900 font-mono">{orderId}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <QrCode className="h-4 w-4" />
            <span>QR will be generated on save</span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer Search */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Search existing customer or type new name..."
                value={form.customerName || customerSearch}
                onChange={e => {
                  const v = e.target.value;
                  setCustomerSearch(v);
                  setForm({...form, customerName: v});
                  setShowCustomerDropdown(v.length > 0);
                }}
                onFocus={() => setShowCustomerDropdown(customerSearch.length > 0)}
              />
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setForm({...form, customerName: c.name, phone: c.phone});
                        setCustomerSearch(c.name);
                        setShowCustomerDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0"
                    >
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-slate-600">{c.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.phone} · {c.membershipTier} member · {c.totalOrders} orders</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.membershipTier === 'Platinum' ? 'bg-blue-100 text-blue-700' : c.membershipTier === 'Gold' ? 'bg-yellow-100 text-yellow-800' : c.membershipTier === 'Silver' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-700'}`}>
                        {c.membershipTier}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g. 555-0100"
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
            />
          </div>

          {/* Service */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              Service <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {services.filter(s => s.isActive).map(svc => (
                <button
                  key={svc.id}
                  onClick={() => setForm({...form, serviceId: svc.id, weight: '', quantity: ''})}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${form.serviceId === svc.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <p className="text-xs font-semibold text-slate-800 leading-snug">{svc.name}</p>
                  <p className="text-xs text-slate-400 mt-1">${svc.price} {svc.priceUnit}</p>
                  <p className="text-xs text-slate-400">{svc.estimatedTime}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Weight / Quantity */}
          {selectedService && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  {isWeightBased ? 'Weight (kg)' : 'Quantity (pieces/sets)'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step={isWeightBased ? '0.1' : '1'}
                  min="0"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={isWeightBased ? 'e.g. 5.5' : 'e.g. 8'}
                  value={isWeightBased ? form.weight : form.quantity}
                  onChange={e => setForm({...form, [isWeightBased ? 'weight' : 'quantity']: e.target.value})}
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-xs text-emerald-600">Estimated Due</p>
                  <p className="text-sm font-bold text-emerald-800">{dueDate}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Status */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Payment Status</label>
            <div className="flex gap-3">
              {['paid', 'unpaid', 'partial'].map(status => (
                <button
                  key={status}
                  onClick={() => setForm({...form, paymentStatus: status})}
                  className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium capitalize transition-all ${
                    form.paymentStatus === status
                      ? status === 'paid' ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : status === 'unpaid' ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Promo Code */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Promo Code (Optional)</label>
            <div className="flex gap-2">
              <input
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                placeholder="e.g. MEMBER10"
                value={form.promoCode}
                onChange={e => setForm({...form, promoCode: e.target.value.toUpperCase()})}
              />
              {discount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700 font-medium">-${discount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Special Notes</label>
            <textarea
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="e.g. Handle with care, delicate fabric, customer needs by 3pm..."
              value={form.notes}
              onChange={e => setForm({...form, notes: e.target.value})}
            />
          </div>

          {/* Order Summary */}
          {selectedService && (isWeightBased ? form.weight : form.quantity) && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Order Summary</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{selectedService.name} × {isWeightBased ? form.weight + 'kg' : form.quantity + ' pcs'}</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Promo discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="font-bold text-slate-900 text-lg">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!form.customerName || !form.phone || !form.serviceId}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200 disabled:shadow-none"
          >
            <Plus className="h-5 w-5" /> Create Order & Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
