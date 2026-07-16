import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { BellRing, CheckCircle2, Mail, Plane } from "lucide-react";
import api from '../api/axios';

type CurrentUser = {
  name?: string;
  email?: string;
  address?: string;
  passportNumber?: string;
};

type UserDetailsValues = {
  name: string;
  email: string;
  address: string;
  passportNumber: string;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
};

const getNotificationStorageKey = (email?: string) => {
  const normalizedEmail = (email || "").trim().toLowerCase();
  return normalizedEmail ? `userNotifications:${normalizedEmail}` : "userNotifications:guest";
};

const UserDetails = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const loadLocalUser = () => {
      try {
        const storedUser = localStorage.getItem("CurrentUser");
        setUser(storedUser ? JSON.parse(storedUser) : null);
      } catch {
        setUser(null);
      }
    };

    const loadNotifications = () => {
      try {
        const storedUser = localStorage.getItem("CurrentUser");
        const currentUser = storedUser ? JSON.parse(storedUser) : null;
        const storageKey = getNotificationStorageKey(currentUser?.email || user?.email);
        const storedNotifications = localStorage.getItem(storageKey);
        const parsed = storedNotifications ? JSON.parse(storedNotifications) : [];
        setNotifications(parsed.length ? parsed : [
          {
            id: "welcome",
            title: "Welcome aboard",
            message: "Your booking updates and payment confirmations will appear here.",
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch {
        setNotifications([]);
      }
    };

    async function fetchProfile() {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await api.get('/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(response.data.user);
        localStorage.setItem('CurrentUser', JSON.stringify(response.data.user));
      } catch (error) {
        loadLocalUser();
      }
    }

    loadLocalUser();
    loadNotifications();
    fetchProfile();
    window.addEventListener("notifications-updated", loadNotifications);

    return () => {
      window.removeEventListener("notifications-updated", loadNotifications);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("CurrentUser");
    window.dispatchEvent(new Event("auth-state-changed"));
    navigate("/");
  };

  const formik = useFormik<UserDetailsValues>({
    enableReinitialize: true,
    initialValues: {
      name: user?.name || "",
      email: user?.email || "",
      address: user?.address || "",
      passportNumber: user?.passportNumber || "",
    },
    validate: (values) => {
      const errors: Partial<UserDetailsValues> = {};

      if (!values.address.trim()) {
        errors.address = "Address is required";
      }

      if (!values.passportNumber.trim()) {
        errors.passportNumber = "Passport number is required";
      }

      return errors;
    },
    onSubmit: async (values) => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          alert('Please login to save profile details.');
          navigate('/login');
          return;
        }

        const response = await api.put(
          '/users/profile',
          {
            name: values.name,
            address: values.address,
            passportNumber: values.passportNumber,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const updatedUser = response.data.user;
        localStorage.setItem('CurrentUser', JSON.stringify(updatedUser));
        setUser(updatedUser);
        alert('Your details were saved successfully.');
        navigate('/');
      } catch (error: any) {
        const message = error?.response?.data?.message || 'Unable to save details.';
        alert(message);
      }
    },
  });

  if (!user?.email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center px-5">
        <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-lg">
          <Plane className="mx-auto mb-4 text-blue-400" size={36} />
          <h2 className="text-2xl font-bold text-white">Please sign in first</h2>
          <p className="mt-2 text-gray-300">You need an active account to continue.</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-5 py-10">
      <div className="mx-auto max-w-6xl grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-lg">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">User Details</h2>
              <p className="text-sm text-gray-300">Fill the remaining details for your profile.</p>
            </div>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-gray-200">Full Name</label>
              <input
                type="text"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-gray-200">Email</label>
              <input
                type="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-gray-200">Address</label>
              <input
                type="text"
                name="address"
                value={formik.values.address}
                onChange={formik.handleChange}
                placeholder="Enter your address"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-blue-500"
              />
              {formik.errors.address ? <p className="mt-1 text-sm text-red-400">{formik.errors.address}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-gray-200">Passport Number</label>
              <input
                type="text"
                name="passportNumber"
                value={formik.values.passportNumber}
                onChange={formik.handleChange}
                placeholder="Enter passport number"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-blue-500"
              />
              {formik.errors.passportNumber ? <p className="mt-1 text-sm text-red-400">{formik.errors.passportNumber}</p> : null}
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Save Details
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 font-semibold text-red-300 transition hover:bg-red-500/20"
              >
                Logout
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="rounded-xl border border-slate-600 px-4 py-3 font-semibold text-gray-200 transition hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <aside className="rounded-3xl border border-white/20 bg-slate-900/70 p-6 shadow-2xl backdrop-blur-lg">
          <div className="flex items-center gap-2">
            <BellRing size={20} className="text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
          </div>
          <p className="mt-2 text-sm text-slate-400">Updates about your bookings, payments, and confirmation emails.</p>

          <div className="mt-5 space-y-3">
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-800/70 p-4">
                  <div className="flex items-start gap-2">
                    <Mail size={16} className="mt-0.5 text-blue-400" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-300">{item.message}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/70 p-4 text-sm text-slate-400">
                No notifications yet.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default UserDetails;
