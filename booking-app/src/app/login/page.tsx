import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, Lock, Sparkles } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Back to Home Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Login Card */}
        <div className="glass-white rounded-2xl p-8 shadow-strong">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-white/80">Sign in to your BookingGPT account</p>
          </div>

          {/* Demo Notice */}
          <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4 mb-6">
            <p className="text-white/90 text-sm text-center">
              <strong>Demo Mode:</strong> This is a demonstration login. Click "Sign In" to access the app.
            </p>
          </div>

          {/* Login Form */}
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90 font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-12 bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  defaultValue="demo@bookinggpt.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-12 bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  defaultValue="demo123"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-white/80">
                <input type="checkbox" className="rounded border-white/30" />
                Remember me
              </label>
              <Link href="#" className="text-white/80 hover:text-white">
                Forgot password?
              </Link>
            </div>

            <Link href="/quotes">
              <Button size="lg" className="w-full btn-glass hover-lift">
                Sign In to Dashboard
              </Button>
            </Link>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              New to BookingGPT?{' '}
              <Link href="/signup" className="text-white hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 text-center">
          <p className="text-white/60 text-xs">
            Trusted by 500+ travel professionals worldwide
          </p>
        </div>
      </div>
    </div>
  );
}