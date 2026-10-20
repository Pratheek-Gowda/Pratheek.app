import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans selection:bg-blue-200">
      
      {}
      {/* LEFT PANEL: Enterprise Branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-950 relative items-center justify-center overflow-hidden">
        
        {/* Subtle Background Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        
        {/* Abstract Gradient Glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600 rounded-full mix-blend-screen filter blur-[150px] opacity-20"></div>

        {}
        <div className="relative z-10 p-16 max-w-2xl text-white">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-8 shadow-2xl shadow-blue-900/50 border border-blue-400/30">
            {/* Enterprise Icon */}
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          
          <h1 className="text-5xl font-extrabold mb-6 tracking-tight leading-tight">
            Welcome back to <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              The Portal
            </span>
          </h1>
          
          <p className="text-lg text-slate-300 leading-relaxed mb-10 font-medium">
            Sign in to access your enterprise dashboard, manage your subagents, and track real-time analytics.
          </p>

          {}
          <div className="flex items-center gap-4 pt-6 border-t border-slate-800">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">PR</div>
              <div className="w-10 h-10 rounded-full border-2 border-slate-950 bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-200">SJ</div>
              <div className="w-10 h-10 rounded-full border-2 border-slate-950 bg-cyan-900 flex items-center justify-center text-xs font-bold text-cyan-200">AK</div>
            </div>
            <span className="font-semibold text-sm text-slate-400">Trusted by 500+ top agents</span>
          </div>
        </div>
      </div>

      {}
      {/* RIGHT PANEL: The Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-[440px] animate-fade-in relative z-10">
          
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
             <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pratheek Enterprises</h2>
            <p className="text-slate-500 font-medium mt-1">Sign in to continue</p>
          </div>

          {}
          <SignIn
            appearance={{
              elements: {
                card: "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 rounded-2xl p-8 w-full",
                header: "hidden lg:block",
                headerTitle: "text-2xl font-bold text-slate-900 tracking-tight",
                headerSubtitle: "text-slate-500 font-medium mt-1",
                socialButtonsBlockButton: "bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all rounded-xl text-slate-700 font-semibold py-2.5 shadow-sm active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait",
                socialButtonsBlockButtonText: "font-semibold text-sm",
                dividerLine: "bg-slate-100",
                dividerText: "text-slate-400 font-semibold text-xs tracking-widest",
                formFieldLabel: "text-sm font-semibold text-slate-700 mb-1.5",
                formFieldInput: "w-full bg-slate-50 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all font-medium text-slate-900 shadow-sm",
                otpCodeFieldInput: "bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 rounded-xl text-center text-lg font-bold shadow-sm transition-all",
                formButtonPrimary: "w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all mt-4 active:scale-[0.98]",
                footerActionText: "text-slate-500 font-medium",
                footerActionLink: "text-blue-600 hover:text-blue-800 font-bold transition-colors",
                identityPreview: "bg-slate-50 border border-slate-200 rounded-xl mb-4",
                identityPreviewText: "text-slate-800 font-bold",
                identityPreviewEditButtonIcon: "text-blue-600 hover:text-blue-700",
                formResendCodeLink: "text-blue-600 hover:text-blue-800 font-bold",
              },
              layout: {
                socialButtonsPlacement: "bottom",
                socialButtonsVariant: "blockButton",
              }
            }}
          />

          {}
          <div className="mt-8 text-center flex justify-center">
            <a 
              href="https://pratheek.app" 
              className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-all"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Return to pratheek.app
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
