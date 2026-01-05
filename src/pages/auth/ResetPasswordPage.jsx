import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { Input, Button, Label, Alert } from '../../components/ui';

// Validation schema
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    if (!token) return;
    
    clearError();
    const result = await resetPassword({
      token,
      password: data.password,
    });
    
    if (result.success) {
      setIsSuccess(true);
    }
  };

  // No token provided
  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-16 h-16 bg-error/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Invalid Reset Link
          </h1>
          <p className="mt-2 text-muted-foreground">
            This password reset link is invalid or has expired.
            Please request a new one.
          </p>
        </div>

        <Link to="/forgot-password">
          <Button className="w-full">
            Request New Link
          </Button>
        </Link>

        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-secondary hover:text-secondary-hover transition-colors"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Password reset successful
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your password has been reset successfully.
            You can now sign in with your new password.
          </p>
        </div>

        <Button
          className="w-full"
          onClick={() => navigate('/login')}
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Reset your password
        </h1>
        <p className="mt-2 text-muted-foreground">
          Enter your new password below.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Reset Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" required>New Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              icon={Lock}
              error={errors.password}
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-error">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" required>Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              icon={Lock}
              error={errors.confirmPassword}
              className="pr-10"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-error">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Reset Password
        </Button>
      </form>

      {/* Back to Login */}
      <div className="text-center">
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-secondary hover:text-secondary-hover transition-colors"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
