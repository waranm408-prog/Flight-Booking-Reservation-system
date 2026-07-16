import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";

import Navbar from "../components/Navbar";
import About from "./About";

export default function Home() {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      fromLocation: "",
      toLocation: "",
      departureDate: "",
    },

    onSubmit: (values) => {
      if (values.fromLocation.trim() && values.toLocation.trim()) {
        navigate(
          `/flights?from=${encodeURIComponent(values.fromLocation)}&to=${encodeURIComponent(values.toLocation)}&departureDate=${encodeURIComponent(values.departureDate)}`
        );
      }
    },
  });



  return (
    <>
      <Navbar />

      <section id="#/" className="scroll-mt-24">
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12">
          <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-10">
                   
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden h-[520px] flex items-center justify-center bg-slate-950 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=80"
                alt="Flight"
                className="absolute inset-0 w-full h-full object-cover opacity-60"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/30" />

              <div className="relative text-center text-white px-6 max-w-3xl z-10 space-y-6">
                <h1 className="text-5xl font-bold">
                  Fly Anywhere Your Heart Desires
                </h1>
                <p className="text-lg text-slate-200">
                  Experience seamless booking and luxury travel.
                </p>
              </div>
            </div>

            <div className="-mt-12 relative z-20 px-4 sm:px-6 lg:px-8">
              <form
                onSubmit={formik.handleSubmit}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-100 max-w-6xl mx-auto"
              >    <h2 className=" text-2xl font-bold text-slate-800 mb-6 md:px-10">International Flights Search</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  
                  {/* From */}
                  <div className="p-3 bg-slate-50 rounded-xl border">
                    <label className="text-xs font-bold flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      Flying From
                    </label>

                    <input
                      type="text"
                      name="fromLocation"
                      placeholder="Enter your departure city (e.g., Chennai)"
                      value={formik.values.fromLocation}
                      onChange={formik.handleChange}
                      className="w-full bg-transparent outline-none mt-2"
                    />
                  </div>

                  {/* To */}
                  <div className="p-3 bg-slate-50 rounded-xl border">
                    <label className="text-xs font-bold flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-red-500" />
                      Going To
                    </label>

                    <input
                      type="text"
                      name="toLocation"
                      placeholder="Enter Destination (e.g., Mumbai)"
                      value={formik.values.toLocation}
                      onChange={formik.handleChange}
                      className="w-full bg-transparent outline-none mt-2"
                    />
                  </div>

                  {/* Date */}
                  <div className="p-3 bg-slate-50 rounded-xl border">
                    <label className="text-xs font-bold flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Departure Date
                    </label>

                    <input
                      type="date"
                      name="departureDate"
                      value={formik.values.departureDate}
                      onChange={formik.handleChange}
                      className="w-full bg-transparent outline-none mt-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl"
                  >
                    Search Flights
                  </button>
                </div>
              </form>
            </div>

          </main>
        </div>

        <About />
      </section>
    </>
  );
}