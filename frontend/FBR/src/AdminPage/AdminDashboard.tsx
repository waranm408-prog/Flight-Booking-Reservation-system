import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    bookingsCount: 0,
    flightsCount: 0,
    usersCount: 0,
    paymentsCount: 0,
    totalRevenue: 0,
    bookingRate: 0,
    cancellationRate: 0,
    cancelledBookingsCount: 0,
  });

  const chartMetrics = [
    { label: 'Bookings', value: stats.bookingsCount, color: 'from-sky-500 to-blue-600' },
    { label: 'Payments', value: stats.paymentsCount, color: 'from-emerald-500 to-teal-600' },
    { label: 'Flights', value: stats.flightsCount, color: 'from-violet-500 to-indigo-600' },
    { label: 'Users', value: stats.usersCount, color: 'from-orange-400 to-amber-500' },
  ];

  const maxMetricValue = Math.max(...chartMetrics.map((metric) => metric.value), 1);
  const cancellationRate = stats.cancellationRate || 0;
  const cancelledBookingsCount = stats.cancelledBookingsCount || 0;

  useEffect(() => {
    let mounted = true;
    api.get('/admin/stats')
      .then(res => {
        if (!mounted) return;
        setStats({
          bookingsCount: res.data.bookingsCount || 0,
          flightsCount: res.data.flightsCount || 0,
          usersCount: res.data.usersCount || 0,
          paymentsCount: res.data.paymentsCount || 0,
          totalRevenue: res.data.totalRevenue || 0,
          bookingRate: res.data.bookingRate || 0,
          cancellationRate: res.data.cancellationRate || 0,
          cancelledBookingsCount: res.data.cancelledBookingsCount || 0,
        });
      })
      .catch(err => console.error('Failed to load admin stats', err));

    return () => { mounted = false; };
  }, []);

  return (
    <>
    <div className="min-h-screen bg-blue-300 p-2 rounded-4xl shadow-lg">
    <div className="">
      <h3 className="text-2xl font-semibold mb-4">Admin Dashboard</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 bg-pink-500 p-4 rounded-4xl shadow-lg">
        <div className="rounded-2xl bg-slate-800/80 p-4 text-white shadow">
          <div className="text-sm text-slate-200">Bookings</div>
          <div className="mt-2 text-2xl font-bold">{stats.bookingsCount}</div>
        </div>

        <div className="rounded-2xl bg-slate-800/80 p-4 text-white shadow">
          <div className="text-sm text-slate-200">Users</div>
          <div className="mt-2 text-2xl font-bold">{stats.usersCount}</div>
        </div>

        <div className="rounded-2xl bg-slate-800/80 p-4 text-white shadow">
          <div className="text-sm text-slate-200">Flights</div>
          <div className="mt-2 text-2xl font-bold">{stats.flightsCount}</div>
        </div>

        <div className="rounded-2xl bg-slate-800/80 p-4 text-white shadow">
          <div className="text-sm text-slate-200">Payments</div>
          <div className="mt-2 text-2xl font-bold">{stats.paymentsCount}</div>
        </div>

        <div className="rounded-2xl bg-slate-800/80 p-4 text-white shadow">
          <div className="text-sm text-slate-200">Total Revenue</div>
          <div className="mt-2 text-2xl font-bold">₹{Number(stats.totalRevenue || 0).toLocaleString('en-IN')}</div>
        </div>
      </div>

      
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-slate-800/80 p-4 text-white shadow">
          <div className="text-sm text-slate-200">Cancelled Bookings</div>
          <div className="mt-2 flex items-center gap-4">
            <div className="text-4xl font-bold">{cancelledBookingsCount}</div>
            <div className="text-sm text-slate-300">users cancelled bookings</div>
          </div>
          <div className="mt-4 text-sm text-slate-400">
            Cancellation rate: {cancellationRate}% of all bookings
          </div>
        </div>

        <div className="rounded-2xl bg-slate-800/80 p-4 text-white shadow">
          <div className="text-sm text-slate-200">Overall Metrics</div>
          <div className="mt-4 space-y-3">
            {chartMetrics.map((metric) => {
              const percent = maxMetricValue ? Math.round((metric.value / maxMetricValue) * 100) : 0;
              return (
                <div key={metric.label} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-slate-300">{metric.label}</div>
                  <div className="flex-1">
                    <div className="w-full bg-slate-700 h-3 rounded overflow-hidden">
                      <div
                        className={`h-3 rounded ${metric.color} bg-gradient-to-r`}
                        style={{ width: `${percent}%` }}
                        aria-label={`${metric.label} ${metric.value}`}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm font-semibold">{metric.value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    
    </div>
    </>
  );
}
