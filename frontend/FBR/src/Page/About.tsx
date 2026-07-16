import { ShieldCheck, Headphones, Award, Globe, Users, Target } from 'lucide-react';

 function About() {
  return (
     <section id="about">
    <div className="min-h-screen bg-orange-200 font-sans antialiased text-slate-800 py-12 ">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* ======================================================== */}
        {/* HEADER SECTION                                           */}
        {/* ======================================================== */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-blue-600 text-sm font-bold tracking-widest uppercase bg-blue-50 px-4 py-1.5 rounded-full">
            Our Journey & Commitment
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Redefining the Sky with Trust & Comfort
          </h1>
          <p className="text-base font-bold sm:text-lg text-slate-500 leading-relaxed">
            We are dedicated to providing seamless premium travel options, backed by military-grade security systems and dedicated global assistance.
          </p>
        </div>

        {/* ======================================================== */}
        {/* CORE SERVICES SECTION (Support & Secure Payments)        */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: 24/7 Support */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md border border-slate-100 flex flex-col justify-between transition-all hover:shadow-lg">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">24/7 Global Live Support</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Travel plans shift, and we adjust alongside you. Our round-the-clock specialized concierge ecosystem ensures real-time flight re-routing, ticket amendments, and baggage tracking assistance anytime, anywhere across the globe. No robotic loops—just authentic human problem solvers.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-4 text-xs font-semibold text-blue-600">
              <span>✓ Average response time under 2 mins</span>
              <span>✓ Multilingual Support</span>
            </div>
          </div>

          {/* Card 2: Secure Payment */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md border border-slate-100 flex flex-col justify-between transition-all hover:shadow-lg">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">100% Encrypted Secure Payments</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Your transactional privacy is non-negotiable. Powered by industry-standard AES-256 bit encryption layer integrations, our payment architecture guarantees that card details, digital wallets, and bank logs remain completely bulletproof against vulnerabilities.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-4 text-xs font-semibold text-emerald-600">
              <span>✓ PCI-DSS Level 1 Compliant</span>
              <span>✓ 3D Secure 2.0 Auth</span>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* COMPANY HISTORY TIMELINE SECTION                         */}
        {/* ======================================================== */}
        <div className="bg-white rounded-4xl p-6 md:p-10 shadow-sm border border-white-100 space-y-8">
          <div className="text-center  md:text-left space-y-1">
            <h3 className=" md:pl-100 text-2xl  font-bold text-slate-900">The Story of SkyElite</h3>
            <p className=" md:pl-89 text-sm  text-slate-400">How we grew into a trusted name across the continents.</p>
          </div>

          {/* Timeline Node Chain */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">

            {/* Timeline element 1 */}
            <div className="space-y-3  relative group ">
              <div className="text-4xl font-black text-blue-600 group-hover:text-blue-200 transition-colors md:pl-11">2016</div>
              <h4 className="text-base font-bold text-slate-800">The Blueprint Foundation</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Launched as a niche routing terminal aggregator to optimize flight scheduling delays. We began with just 4 operating routes and a core team of 10 tech visionaries.
              </p>
            </div>

            {/* Timeline element 2 */}
            <div className="space-y-3 relative group ">
              <div className="text-4xl font-black text-blue-600 group-hover:text-blue-200 transition-colors md:pl-11">2021</div>
              <h4 className="text-base font-bold text-slate-800">Going Global & Greener</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Expanded intercontinental wings across 80+ international airports. Introduced dynamic carbon-offset tracking and won the award for Sustainable Digital Service Innovation.
              </p>
            </div>

            {/* Timeline element 3 */}
            <div className="space-y-3 relative group md:pl-11">
              <div className="text-4xl font-black text-blue-600 group-hover:text-blue-200 transition-colors md:pl-11">2026</div>
              <h4 className="text-base font-bold text-slate-800">Next Gen Ecosystem</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Serving over 15 million happy flyers annually. Deploying fully decentralized, ultra-fast transaction systems and immediate click-to-refund processing.
              </p>
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* "MORE" / STATS SECTION                                   */}
        {/* ======================================================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          
          <div className="bg-pink-500 p-5 rounded-xl border border-slate-200/40">
            <div className="text-2xl sm:text-3xl font-black text-black-900">150+</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-black-400 mt-1 flex items-center justify-center gap-1">
              <Globe className="w-3 h-3 text-blue-500" /> Destinations
            </div>
          </div>

          <div className="bg-pink-500 p-5 rounded-xl border border-slate-200/40">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">15M+</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-black-400 mt-1 flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-blue-500" /> Happy Flyers
            </div>
          </div>

          <div className="bg-pink-500 p-5 rounded-xl border border-slate-200/40">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">99.4%</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-black-400 mt-1 flex items-center justify-center gap-1">
              <Target className="w-3 h-3 text-blue-500" /> Success Rate
            </div>
          </div>

          <div className="bg-pink-500 p-5 rounded-xl border border-slate-200/40">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">22+</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-black-400 mt-1 flex items-center justify-center gap-1">
              <Award className="w-3 h-3 text-black-500" /> Global Awards
            </div>
          </div>

        </div>

      </div>
    </div>
  </section>
  );
}
export default About;