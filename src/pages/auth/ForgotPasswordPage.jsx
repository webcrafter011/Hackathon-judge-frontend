import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { Input, Button, Label, Alert } from '../../components/ui';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

function ForgotPasswordPage() {
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data) => {
    clearError();
    const result = await forgotPassword(data.email);
    
    if (result.success) {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Check your email
          </h1>
          <p className="mt-2 text-muted-foreground">
            We've sent a password reset link to your email address.
            Please check your inbox and follow the instructions.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsSuccess(false)}
          >
            Try again
          </Button>
        </div>

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Forgot password?
        </h1>
        <p className="mt-2 text-muted-foreground">
          No worries, we'll send you reset instructions.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Forgot Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Send Reset Link
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

export default ForgotPasswordPage;
