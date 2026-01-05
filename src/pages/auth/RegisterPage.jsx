import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { Input, Button, Label, Alert } from '../../components/ui';

// Validation schema
const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
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

// Password strength indicator
function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 6 characters', valid: password.length >= 6 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'One number', valid: /\d/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      {checks.map((check, index) => (
        <div 
          key={index} 
          className={`flex items-center gap-2 text-xs ${
            check.valid ? 'text-success' : 'text-muted-foreground'
          }`}
        >
          <CheckCircle size={12} className={check.valid ? 'opacity-100' : 'opacity-40'} />
          <span>{check.label}</span>
        </div>
      ))}
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data) => {
    clearError();
    const result = await registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
    });
    
    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Create an account
        </h1>
        <p className="mt-2 text-muted-foreground">
          Join Hackathon Judge and start your journey
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Register Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name" required>Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your full name"
            icon={User}
            error={errors.name}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-error">{errors.name.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" required>Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            icon={Mail}
            error={errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-error">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" required>Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
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
          <PasswordStrength password={password} />
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" required>Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
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

        {/* Terms */}
        <p className="text-xs text-muted-foreground">
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="text-secondary hover:text-secondary-hover">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-secondary hover:text-secondary-hover">
            Privacy Policy
          </Link>
          .
        </p>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Create Account
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Already have an account?
          </span>
        </div>
      </div>

      {/* Login Link */}
      <div className="text-center">
        <p className="text-muted-foreground">
          Already registered?{' '}
          <Link 
            to="/login" 
            className="font-semibold text-secondary hover:text-secondary-hover transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
