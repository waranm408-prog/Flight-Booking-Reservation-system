import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plane } from 'lucide-react';
import { useFormik } from 'formik';
import api from '../api/axios';

type Step = 'email' | 'otp' | 'password';

type EmailValues = {
  email: string;
};

type OtpValues = {
  otp: string;
};

type PasswordValues = {
  newPassword: string;
  confirmPassword: string;
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const emailFormik = useFormik<EmailValues>({
    initialValues: { email: '' },
    validate: (values) => {
      const errors: Partial<Record<keyof EmailValues, string>> = {};

      if (!values.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = 'Enter a valid email';
      }

      return errors;
    },
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      setMessage('');

      try {
        const response = await api.post('/users/forgot-password', {
          email: values.email.trim().toLowerCase(),
        });
        setEmail(values.email.trim().toLowerCase());
        setMessage(response.data.message);
        setStep('otp');
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to send OTP right now.');
      } finally {
        setLoading(false);
      }
    },
  });

  const otpFormik = useFormik<OtpValues>({
    initialValues: { otp: '' },
    validate: (values) => {
      const errors: Partial<Record<keyof OtpValues, string>> = {};

      if (!values.otp.trim()) {
        errors.otp = 'OTP is required';
      } else if (values.otp.length < 6) {
        errors.otp = 'OTP must be 6 digits';
      }

      return errors;
    },
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      setMessage('');

      try {
        const response = await api.post('/users/verify-otp', {
          email: email.trim().toLowerCase(),
          otp: values.otp,
        });
        setOtp(values.otp);
        setMessage(response.data.message);
        setStep('password');
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Invalid OTP.');
      } finally {
        setLoading(false);
      }
    },
  });

  const passwordFormik = useFormik<PasswordValues>({
    initialValues: { newPassword: '', confirmPassword: '' },
    validate: (values) => {
      const errors: Partial<Record<keyof PasswordValues, string>> = {};

      if (!values.newPassword) {
        errors.newPassword = 'New password is required';
      } else if (values.newPassword.length < 6) {
        errors.newPassword = 'Password must be at least 6 characters';
      }

      if (!values.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (values.confirmPassword !== values.newPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }

      return errors;
    },
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      setMessage('');

      try {
        const response = await api.post('/users/reset-password', {
          email: email.trim().toLowerCase(),
          otp,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        });
        setMessage(response.data.message);
        setTimeout(() => navigate('/login'), 1200);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to reset password.');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center px-5">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl">
        <div className="flex justify-center items-center gap-2 mb-6">
          <Plane className="text-blue-400" size={32} />
          <h1 className="text-3xl font-bold text-white">
            Sky<span className="text-blue-400">Elite</span>
          </h1>
        </div>

        <h2 className="text-2xl font-bold text-white text-center">
          {step === 'email' ? 'Forgot Password' : step === 'otp' ? 'Verify OTP' : 'Create New Password'}
        </h2>
        <p className="text-gray-300 text-center mt-2 mb-6">
          {step === 'email'
            ? 'Enter your email and we will send a one-time password.'
            : step === 'otp'
              ? 'Enter the OTP sent to your email.'
              : 'Set a new password for your account.'}
        </p>

        {message && <div className="mb-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</div>}
        {error && <div className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>}

        {step === 'email' && (
          <form onSubmit={emailFormik.handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-gray-200">Email</label>
              <input
                type="email"
                name="email"
                value={emailFormik.values.email}
                onChange={emailFormik.handleChange}
                onBlur={emailFormik.handleBlur}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white focus:border-blue-500 focus:outline-none"
              />
              {emailFormik.touched.email && emailFormik.errors.email ? (
                <p className="mt-1 text-sm text-rose-300">{emailFormik.errors.email}</p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition duration-300 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={otpFormik.handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-gray-200">OTP</label>
              <input
                type="text"
                name="otp"
                value={otpFormik.values.otp}
                onChange={otpFormik.handleChange}
                onBlur={otpFormik.handleBlur}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white focus:border-blue-500 focus:outline-none"
              />
              {otpFormik.touched.otp && otpFormik.errors.otp ? (
                <p className="mt-1 text-sm text-rose-300">{otpFormik.errors.otp}</p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition duration-300 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full rounded-xl border border-slate-600 py-3 font-semibold text-gray-200 transition duration-300 hover:bg-slate-800"
            >
              Back
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={passwordFormik.handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-gray-200">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordFormik.values.newPassword}
                onChange={passwordFormik.handleChange}
                onBlur={passwordFormik.handleBlur}
                placeholder="Enter new password"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white focus:border-blue-500 focus:outline-none"
              />
              {passwordFormik.touched.newPassword && passwordFormik.errors.newPassword ? (
                <p className="mt-1 text-sm text-rose-300">{passwordFormik.errors.newPassword}</p>
              ) : null}
            </div>
            <div>
              <label className="mb-2 block text-gray-200">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordFormik.values.confirmPassword}
                onChange={passwordFormik.handleChange}
                onBlur={passwordFormik.handleBlur}
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white focus:border-blue-500 focus:outline-none"
              />
              {passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword ? (
                <p className="mt-1 text-sm text-rose-300">{passwordFormik.errors.confirmPassword}</p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition duration-300 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button
              type="button"
              onClick={() => setStep('otp')}
              className="w-full rounded-xl border border-slate-600 py-3 font-semibold text-gray-200 transition duration-300 hover:bg-slate-800"
            >
              Back
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-gray-300">
          Remembered your password?
          <Link to="/login" className="ml-2 text-blue-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
