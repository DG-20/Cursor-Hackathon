import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { signUp as signUpApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { setAuth } = useAuth();

    const passwordTooShort = password.length > 0 && password.length < 6;
    const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
    const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords don't match.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const data = await signUpApi({
                email: email.trim(),
                password,
                confirm_password: confirmPassword,
                first_name: name.trim() || email.trim().split('@')[0],
            });
            if (data.user && data.session) {
                setAuth(data.user, data.session);
                navigate('/');
                window.location.reload();
            } else {
                setError(data.message || 'Check your email to confirm sign up.');
            }
        } catch (err) {
            setError(err?.message || 'Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden"
            style={{ background: '#0d1f1e' }}
        >

            {/* Background orbs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute rounded-full"
                    style={{
                        width: '500px', height: '500px',
                        top: '-150px', left: '-150px',
                        background: 'radial-gradient(circle, rgba(56, 178, 172, 0.1) 0%, transparent 70%)',
                        filter: 'blur(50px)',
                    }}
                    animate={{ x: [0, 25, 0], y: [0, 20, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute rounded-full"
                    style={{
                        width: '500px', height: '500px',
                        bottom: '-150px', right: '-150px',
                        background: 'radial-gradient(circle, rgba(104, 157, 140, 0.08) 0%, transparent 70%)',
                        filter: 'blur(50px)',
                    }}
                    animate={{ x: [0, -20, 0], y: [0, -25, 0] }}
                    transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            <div className="relative z-10 w-full max-w-sm">

                {/* Back */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-10"
                >
                    <Link
                        to="/"
                        className="flex items-center gap-2 w-fit"
                        style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.875rem',
                            color: 'rgba(140, 180, 165, 0.5)',
                            fontWeight: '300',
                            textDecoration: 'none',
                        }}
                    >
                        <ArrowLeft size={15} />
                        Back
                    </Link>
                </motion.div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="mb-10"
                >
                    <h1
                        style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: 'clamp(2.25rem, 8vw, 3rem)',
                            color: '#e8ede8',
                            fontWeight: '400',
                            lineHeight: '1.1',
                            letterSpacing: '-0.02em',
                            marginBottom: '0.75rem',
                        }}
                    >
                        Create your<br />account
                    </h1>
                    <p style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.9rem',
                        color: 'rgba(160, 200, 185, 0.5)',
                        fontWeight: '300',
                        lineHeight: '1.6',
                    }}>
                        A quiet space to untangle your thoughts.
                    </p>
                </motion.div>

                {/* Form */}
                <motion.form
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.25 }}
                    onSubmit={handleSubmit}
                    className="space-y-3"
                >
                    {/* Email */}
                    <div>
                        <label style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(140, 180, 165, 0.5)', fontWeight: '400', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="w-full px-4 py-3.5 rounded-xl focus:outline-none transition-all duration-300"
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(104, 178, 160, 0.12)',
                                color: '#deeee6',
                                fontFamily: 'var(--font-sans)',
                                fontSize: '0.9375rem',
                                fontWeight: '300',
                            }}
                            onFocus={e => e.target.style.borderColor = 'rgba(104, 178, 160, 0.35)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(104, 178, 160, 0.12)'}
                        />
                    </div>

                    <div>
                        <label style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(140, 180, 165, 0.5)', fontWeight: '400', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Billy"
                            required
                            className="w-full px-4 py-3.5 rounded-xl focus:outline-none transition-all duration-300"
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(104, 178, 160, 0.12)',
                                color: '#deeee6',
                                fontFamily: 'var(--font-sans)',
                                fontSize: '0.9375rem',
                                fontWeight: '300',
                            }}
                            onFocus={e => e.target.style.borderColor = 'rgba(104, 178, 160, 0.35)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(104, 178, 160, 0.12)'}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(140, 180, 165, 0.5)', fontWeight: '400', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                required
                                className="w-full px-4 py-3.5 rounded-xl focus:outline-none transition-all duration-300"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: `1px solid ${passwordTooShort ? 'rgba(240, 150, 130, 0.4)' : 'rgba(104, 178, 160, 0.12)'}`,
                                    color: '#deeee6',
                                    fontFamily: 'var(--font-sans)',
                                    fontSize: '0.9375rem',
                                    fontWeight: '300',
                                    paddingRight: '3rem',
                                }}
                                onFocus={e => e.target.style.borderColor = passwordTooShort ? 'rgba(240, 150, 130, 0.5)' : 'rgba(104, 178, 160, 0.35)'}
                                onBlur={e => e.target.style.borderColor = passwordTooShort ? 'rgba(240, 150, 130, 0.4)' : 'rgba(104, 178, 160, 0.12)'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2"
                                style={{ color: 'rgba(140, 180, 165, 0.35)' }}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {passwordTooShort && (
                            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(240, 150, 130, 0.7)', fontWeight: '300', marginTop: '0.4rem' }}>
                                At least 8 characters required
                            </p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(140, 180, 165, 0.5)', fontWeight: '400', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                            Confirm Password
                        </label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat your password"
                            required
                            className="w-full px-4 py-3.5 rounded-xl focus:outline-none transition-all duration-300"
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: `1px solid ${passwordsMismatch ? 'rgba(240, 150, 130, 0.4)' : passwordsMatch ? 'rgba(80, 180, 145, 0.4)' : 'rgba(104, 178, 160, 0.12)'}`,
                                color: '#deeee6',
                                fontFamily: 'var(--font-sans)',
                                fontSize: '0.9375rem',
                                fontWeight: '300',
                            }}
                            onFocus={e => e.target.style.borderColor = passwordsMismatch ? 'rgba(240, 150, 130, 0.5)' : passwordsMatch ? 'rgba(80, 180, 145, 0.5)' : 'rgba(104, 178, 160, 0.35)'}
                            onBlur={e => e.target.style.borderColor = passwordsMismatch ? 'rgba(240, 150, 130, 0.4)' : passwordsMatch ? 'rgba(80, 180, 145, 0.4)' : 'rgba(104, 178, 160, 0.12)'}
                        />
                        {passwordsMismatch && (
                            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(240, 150, 130, 0.7)', fontWeight: '300', marginTop: '0.4rem' }}>
                                Passwords don't match
                            </p>
                        )}
                        {passwordsMatch && (
                            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(100, 190, 160, 0.7)', fontWeight: '300', marginTop: '0.4rem' }}>
                                Passwords match ✓
                            </p>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', color: 'rgba(240, 150, 130, 0.8)', fontWeight: '300' }}>
                            {error}
                        </p>
                    )}

                    {/* Submit */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-2xl transition-all duration-300 disabled:opacity-50"
                            style={{
                                background: 'linear-gradient(135deg, rgba(80, 160, 145, 0.85) 0%, rgba(56, 130, 120, 0.9) 100%)',
                                color: 'rgba(230, 245, 240, 0.95)',
                                fontFamily: 'var(--font-sans)',
                                fontWeight: '500',
                                fontSize: '0.9375rem',
                                border: '1px solid rgba(104, 178, 160, 0.2)',
                                boxShadow: '0 4px 20px rgba(56, 130, 120, 0.15)',
                            }}
                        >
                            {isLoading ? 'Creating account...' : 'Create account'}
                        </button>
                    </div>
                </motion.form>

                {/* Divider */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="flex items-center gap-4 my-6"
                >
                    <div style={{ flex: 1, height: '1px', background: 'rgba(104, 178, 160, 0.1)' }} />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(140, 180, 165, 0.3)', fontWeight: '300' }}>or</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(104, 178, 160, 0.1)' }} />
                </motion.div>

                {/* Sign in link */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-center"
                    style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'rgba(140, 180, 165, 0.4)', fontWeight: '300' }}
                >
                    Already have an account?{' '}
                    <Link
                        to="/sign-in"
                        style={{ color: 'rgba(120, 190, 170, 0.8)', textDecoration: 'none', fontWeight: '400' }}
                    >
                        Sign in
                    </Link>
                </motion.p>

            </div>
        </div>
    );
}