import { useFormik } from "formik";
import { Plane } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from '../api/axios';
type SignupValues = {
  name: string;
  email: string;
  password: string;
};
const Signup = () => {
        const navigate =useNavigate();   
        const formik = useFormik<SignupValues>({
            initialValues: {
                name: "",
                email: "",
                password: ""
            },

            validate: (values) => {
                const errors: Partial<SignupValues> = {};
                if (!values.name) {
                    errors.name = "Name is required";
                }
                if (!values.email) {
                    errors.email = "Email is required";
                } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
                    errors.email = "Invalid email address";
                }
                if (!values.password) {
                    errors.password = "Password is required";
                } else if (values.password.length < 6) {
                    errors.password = "Password must be at least 6 characters";
                }
                return errors;
            },
            onSubmit: async (values) => {
              try {
                await api.post('/users/signup', values);
               
                navigate('/login');
              } catch (error: any) {
                const message = error?.response?.data?.message || 'Failed to create account.';
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

        <h2 className="text-2xl font-bold text-white text-center mb-2">
          Create Account
        </h2>

        <p className="text-gray-300 text-center mb-8">
          Sign up to start your journey.
        </p>

        <form onSubmit={formik.handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="text-gray-200 block mb-2">Full Name</label>
            <input
              type="text"
              value={formik.values.name}
              name="name"
              onChange={formik.handleChange}
              
              placeholder="Enter your name"
              className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 focus:border-blue-500 outline-none"
            />
            <span className="text-red-500">{formik.errors.name}</span>
          </div>

          {/* Email */}
          <div>
            <label className="text-gray-200 block mb-2">Email</label>
            <input
              type="email"
              value={formik.values.email}
              name="email"
              onChange={formik.handleChange}
              placeholder="Enter your email"
              className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 focus:border-blue-500 outline-none"
            />
              <span className="text-red-500">{formik.errors.email}</span>
          </div>

          {/* Password */}
          <div>
            <label className="text-gray-200 block mb-2">Password</label>
            <input
              type="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              name="password"
              placeholder="Enter your password"
              className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 focus:border-blue-500 outline-none"
            />
              <span className="text-red-500">{formik.errors.password}</span>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition duration-300"
          >
            Create Account
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-gray-300 mt-6">
          Already have an account?
          <Link
         
            to="/login"
            className="text-red-400 ml-2 hover:underline"
          >
            Login
          </Link>
          
        </p>
      </div>
    </div>





</>


    )
};

export default Signup;