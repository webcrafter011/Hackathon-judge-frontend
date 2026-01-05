import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { Input, Button, Label, Alert } from '../../components/ui';

// Validation schema
const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address'),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(6, 'Password must be at least 6 characters'),
});

function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isLoading, error, clearError } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);

    // Get the redirect path from location state, or default to dashboard
    const from = location.state?.from?.pathname || '/dashboard';

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data) => {
        clearError();
        const result = await login(data);

        if (result.success) {
            navigate(from, { replace: true });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center lg:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Welcome back
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Sign in to your account to continue
                </p>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="error">
                    {error}
                </Alert>
            )}

            {/* Login Form */}
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

                {/* Password Field */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" required>Password</Label>
                        <Link
                            to="/forgot-password"
                            className="text-sm text-secondary hover:text-secondary-hover transition-colors"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
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

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    isLoading={isLoading}
                >
                    Sign In
                </Button>
            </form>

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        New to Hackathon Judge?
                    </span>
                </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
                <p className="text-muted-foreground">
                    Don't have an account?{' '}
                    <Link
                        to="/register"
                        className="font-semibold text-secondary hover:text-secondary-hover transition-colors"
                    >
                        Create an account
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
