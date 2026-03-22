import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DollarSign, Eye, EyeOff } from "lucide-react";
import { useLogin } from "@/api/hooks";
import { apiPost } from "@/api/client";
import { saveAuth } from "@/api/auth";
import toast from "react-hot-toast";

export function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const [email, setEmail] = useState("ananya@technova.in");
  const [password, setPassword] = useState("Welcome@123");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "otp">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await loginMutation.mutateAsync({ email, password });
      if (res.success) {
        saveAuth(res.data);
        toast.success(`Welcome back, ${res.data.user.firstName}!`);
        const role = res.data.user.role;
        navigate(role === "hr_admin" || role === "hr_manager" ? "/dashboard" : "/my");
      } else {
        toast.error(res.error?.message || "Login failed");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Login failed. Check your credentials.");
    }
  }

  async function handleForgotSubmitEmail(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await apiPost("/auth/forgot-password", { email: forgotEmail });
      toast.success("OTP sent to your email (check console in dev mode)");
      setForgotStep("otp");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleForgotSubmitOTP(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setForgotLoading(true);
    try {
      await apiPost("/auth/reset-password", {
        email: forgotEmail,
        otp: fd.get("otp") as string,
        newPassword: fd.get("newPassword") as string,
      });
      toast.success("Password reset! You can now log in.");
      setForgotOpen(false);
      setForgotStep("email");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Invalid OTP");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-3 lg:hidden">
        <div className="bg-brand-600 flex h-10 w-10 items-center justify-center rounded-xl">
          <DollarSign className="h-6 w-6 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">EMP Payroll</span>
      </div>

      <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
      <p className="mt-1 text-sm text-gray-500">Sign in to manage your payroll</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Input
          id="email"
          label="Email address"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="focus:border-brand-500 focus:ring-brand-500 block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-1"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              defaultChecked
              className="text-brand-600 focus:ring-brand-500 rounded border-gray-300"
            />
            <span className="text-gray-600">Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setForgotOpen(true);
              setForgotStep("email");
            }}
            className="text-brand-600 hover:text-brand-700 text-sm font-medium"
          >
            Forgot password?
          </button>
        </div>
        <Button type="submit" loading={loginMutation.isPending} className="w-full">
          Sign in
        </Button>
      </form>

      <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
        <p className="font-medium">Demo credentials:</p>
        <p>ananya@technova.in / Welcome@123</p>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={() => setContactOpen(true)}
          className="text-brand-600 hover:text-brand-700 font-medium"
        >
          Contact your HR admin
        </button>
      </p>

      {/* Contact HR Admin Modal */}
      <Modal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title="Contact HR Admin"
        className="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            If you don't have an account, please reach out to your HR administrator to get access to
            the payroll system.
          </p>
          <div className="space-y-2 rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-700">HR Department</p>
            <p className="text-sm text-gray-600">Email: hr@technova.in</p>
            <p className="text-sm text-gray-600">Phone: +91 80 4567 8900</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setContactOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                window.location.href = "mailto:hr@technova.in?subject=Payroll%20Account%20Request";
              }}
            >
              Send Email
            </Button>
          </div>
        </div>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="Reset Password"
        className="max-w-sm"
      >
        {forgotStep === "email" ? (
          <form onSubmit={handleForgotSubmitEmail} className="space-y-4">
            <p className="text-sm text-gray-500">
              Enter your email address and we'll send you a 6-digit OTP.
            </p>
            <Input
              id="forgotEmail"
              label="Email"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => setForgotOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={forgotLoading}>
                Send OTP
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgotSubmitOTP} className="space-y-4">
            <p className="text-sm text-gray-500">
              Enter the 6-digit OTP sent to <strong>{forgotEmail}</strong> and your new password.
            </p>
            <Input
              id="otp"
              name="otp"
              label="OTP Code"
              placeholder="123456"
              maxLength={6}
              required
            />
            <Input
              id="newPassword"
              name="newPassword"
              label="New Password"
              type="password"
              placeholder="Min 8 characters"
              required
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => setForgotStep("email")}>
                Back
              </Button>
              <Button type="submit" loading={forgotLoading}>
                Reset Password
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
