
import { useFormik } from "formik";
import { Headphones } from "lucide-react";
import { useNavigate } from "react-router-dom";

type SupportValues = {
  name: string;
  email: string;
  feedback: string;
};

const Support = () => {
const navigate = useNavigate();
  const formik = useFormik<SupportValues>({
    initialValues: {
      name: "",
      email: "",
      feedback: "",
    },

    onSubmit: (values, { resetForm }) => {
      const feedbacks = JSON.parse(
        localStorage.getItem("feedbacks") || "[]"
      );

      feedbacks.push(values);

      localStorage.setItem(
        "feedbacks",
        JSON.stringify(feedbacks)
      );

      alert("Feedback Sent Successfully!");
        navigate("/");
      resetForm();
    },
  });


  

  return (
              
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center px-5">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl">

        {/* Logo */}
        <div className="flex justify-center items-center gap-2 mb-8">
          <Headphones className="text-blue-400" size={35} />
          <h1 className="text-3xl font-bold text-white">
            Support Center
          </h1>
        </div>

        <h2 className="text-center text-gray-300 mb-8">
          We'd love to hear your feedback.
        </h2>

        <form
          onSubmit={formik.handleSubmit}
          className="space-y-5"
        >
          {/* Name */}
          <div>
            <label className="text-white block mb-2">
              Name
            </label>

            <input
              type="text"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              placeholder="Enter your name"
              className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-white block mb-2">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              placeholder="Enter your email"
              className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Feedback */}
          <div>
            <label className="text-white block mb-2">
              Feedback
            </label>

            <textarea
              name="feedback"
              value={formik.values.feedback}
              onChange={formik.handleChange}
              rows={5}
              placeholder="Write your feedback..."
              className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl text-white font-semibold transition"
          >
            Send Feedback
          </button>
        </form>
      </div>
    </div>
      
  );
}
export default  Support;