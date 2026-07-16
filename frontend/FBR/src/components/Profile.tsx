import { useEffect, useState } from "react";
import { ArrowRight, UserCircle2 } from "lucide-react";
// @ts-ignore: no declaration file for react-router-hash-link
import { HashLink as Link } from "react-router-hash-link";

type CurrentUser = {
  name?: string;
  email?: string;
};

const Profile = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem("CurrentUser");
        setUser(storedUser ? JSON.parse(storedUser) : null);
      } catch {
        setUser(null);
      }
    };

    loadUser();
    window.addEventListener("storage", loadUser);
    window.addEventListener("auth-state-changed", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("auth-state-changed", loadUser);
    };
  }, []);

  const isLoggedIn = Boolean(user?.name?.trim());
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "";
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "";

  return (
    <Link
      to={isLoggedIn ? "/user-details" : "/login"}
      className="group flex items-center gap-3 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-2 pr-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur transition hover:border-blue-400/70 hover:bg-slate-800"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg">
        {isLoggedIn ? (
          <span className="text-sm font-semibold">{initial}</span>
        ) : (
          <UserCircle2 size={20} />
        )}
      </div>
      <div className="text-left">
        <p className="text-sm font-semibold text-white">
          {isLoggedIn ? displayName : "Sign in"}
        </p>
        <p className="text-xs text-slate-400">
          {isLoggedIn ? "Your account" : "Access your account"}
        </p>
      </div>
      <ArrowRight
        size={16}
        className="text-blue-400 transition group-hover:translate-x-1"
      />
    </Link>
  );
};

export default Profile;
