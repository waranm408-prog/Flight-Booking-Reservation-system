import { Plane } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from "formik";
import api from '../api/axios';


type LoginValues = {
  email: string;
  password: string;
};
const Login = () => {
  const navigate = useNavigate();
  const formik =useFormik<LoginValues>({
    initialValues: {
      email: "",  
      password: ""
    },
    validate: (values) => {
    
        let error: any = {};
        if (values.email == "") {
          error.email = "Email is required";
        }
        if (values.password == "") {
          error.password = "Password is required";
        } else if (values.password.length < 6) {
          error.password = "Password must be at least 6 characters";
        }
        return error;
      },
       onSubmit: async (values) => {
        try {
          const response = await api.post('/users/login', values);
          const data = response.data;
          const isAdmin = data?.user?.role === 'admin';
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('CurrentUser', JSON.stringify(data.user));
          window.dispatchEvent(new Event('auth-state-changed'));
          alert('Login successful!');
          navigate(isAdmin ? '/admin' : '/');
        } catch (error: any) {
          const message = error?.response?.data?.message || 'Invalid email or password';
          alert(message);
        }
       }

  });
  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center px-5">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl">
        {/* Logo */}
        <div className="flex justify-center items-center gap-2 mb-8">
          <Plane className="text-blue-400" size={32} />
          <h1 className="text-3xl font-bold text-white">
            Sky<span className="text-blue-400">Elite</span>
          </h1>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-white text-center">
          Welcome Back
        </h2>

        <p className="text-gray-300 text-center mt-2 mb-8">
          Login to continue your journey.
        </p>

        {/* Form */}
        <form onSubmit={formik.handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-gray-200 mb-2">
              Email
            </label>

            <input
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              name="email"
              placeholder="Enter your email"
              className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-200 mb-2">
              Password
            </label>

            <input
              type="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              name="password"
              placeholder="Enter your password"
              className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <a
              href="/forgot-password"
              className="text-blue-400 hover:underline"
            >
              Forgot Password?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl text-white font-semibold transition duration-300"
          >
            Login
          </button>
        </form>

        {/* Signup Link */}
        <p className="text-center text-gray-300 mt-6">
          Don't have an account?
          <Link to="/signup" className="text-blue-400 ml-2 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
      </>
  );
};

export default Login;