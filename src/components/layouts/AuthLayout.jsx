import { Link, Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { Trophy } from 'lucide-react';

function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white rounded-full" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Trophy size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold">Hackathon Judge</h1>
          </div>
          
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-semibold mb-4">
              Organize. Compete. Innovate.
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              The all-in-one platform for organizing hackathons, managing teams, 
              submitting projects, and evaluating innovations fairly.
            </p>
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-2 gap-6 max-w-md">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h3 className="font-semibold mb-1">For Organizers</h3>
              <p className="text-sm text-white/70">Create and manage hackathons with ease</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h3 className="font-semibold mb-1">For Participants</h3>
              <p className="text-sm text-white/70">Join teams and submit projects</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h3 className="font-semibold mb-1">For Judges</h3>
              <p className="text-sm text-white/70">Evaluate with customizable criteria</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h3 className="font-semibold mb-1">Real-time Results</h3>
              <p className="text-sm text-white/70">Live leaderboards and analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col min-h-screen bg-background w-full">
        {/* Mobile Header */}
        <div className="lg:hidden p-6 flex items-center justify-center border-b border-border bg-secondary w-full">
          <Link to="/" className="flex items-center gap-2 text-white">
            <Trophy size={28} />
            <span className="text-xl font-bold">Hackathon Judge</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-8 md:px-12 w-full">
          <div className="w-full max-w-md mx-auto">
            <Outlet />
          </div>
        </div>

        {/* Footer */}
        <footer className="p-6 text-center text-sm text-muted-foreground border-t border-border w-full">
          <p>© {new Date().getFullYear()} Hackathon Judge. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default AuthLayout;
