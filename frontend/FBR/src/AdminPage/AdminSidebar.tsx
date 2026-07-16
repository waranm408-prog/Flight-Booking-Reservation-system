import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Plane, BookOpen, CreditCard } from 'lucide-react';

type CurrentUser = {
  name?: string;
  email?: string;
  role?: string;
};

type AdminSidebarProps = {
  children?: ReactNode;
};

const AdminSidebar = ({ children }: AdminSidebarProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem('CurrentUser');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      if (!parsedUser?.email) {
        navigate('/login');
        return;
      }

      if (parsedUser.role !== 'admin') {
        navigate('/');
        return;
      }

      setUser(parsedUser);
    };

    loadUser();
    window.addEventListener('auth-state-changed', loadUser);

    return () => {
      window.removeEventListener('auth-state-changed', loadUser);
    };
  }, [navigate]);

  if (!user?.email) return null;

  return (
    <>
      <aside className="w-72 h-screen bg-slate-950 text-white fixed left-0 top-0 shadow-xl">
        <div className="flex items-center justify-center h-20 border-b border-slate-800">
          <Plane className="text-blue-500 mr-2" size={30} />
          <h1 className="text-2xl font-bold">
            Sky<span className="text-blue-500">Elite</span>
          </h1>
        </div>

        <div className="mt-8 px-5 space-y-3">
          <Link to="/admin" className="flex items-center gap-4 p-4 rounded-xl hover:bg-blue-600 transition duration-300">
            <LayoutDashboard size={22} />
            <span className="text-lg">Home</span>
          </Link>

          <Link to="/admin-users" className="flex items-center gap-4 p-4 rounded-xl hover:bg-blue-600 transition duration-300">
            <Users size={22} />
            <span className="text-lg">Users</span>
          </Link>

          <Link to="/admin-flights" className="flex items-center gap-4 p-4 rounded-xl hover:bg-blue-600 transition duration-300">
            <Plane size={22} />
            <span className="text-lg">Flights</span>
          </Link>

          <Link to="/admin-bookings" className="flex items-center gap-4 p-4 rounded-xl hover:bg-blue-600 transition duration-300">
            <BookOpen size={22} />
            <span className="text-lg">Bookings</span>
          </Link>

          <Link to="/admin-payments" className="flex items-center gap-4 p-4 rounded-xl hover:bg-blue-600 transition duration-300">
            <CreditCard size={22} />
            <span className="text-lg">Payments</span>
          </Link>

          <Link to="/login" className="flex items-center gap-4 p-4 rounded-xl hover:bg-red-600 transition duration-300">
            <CreditCard size={22} />
            <span className="text-lg">Logout</span>
          </Link>
        </div>
      </aside>

      <main className="ml-72 p-6 min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto">
          {children ?? <Outlet />}
        </div>
      </main>
    </>
  );
};

export default AdminSidebar;