import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/apiClient';
import { UserContext } from '../context/UserContext';
import { Lock, ArrowRight, User, Loader2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';

const Signup: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUser } = useContext(UserContext);

    const token = searchParams.get('token');

    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isValidToken, setIsValidToken] = useState(true);
    const [invitationEmail, setInvitationEmail] = useState('');
    const [invitationRole, setInvitationRole] = useState('');
    const [isLoadingInvitation, setIsLoadingInvitation] = useState(true);

    useEffect(() => {
        const fetchInvitationDetails = async () => {
            // Robust token extraction: Check search params first, then hash parsing fallback
            let tokenToUse = token;

            if (!tokenToUse) {
                // Fallback: Manually parse URL if HashRouter messed up the query params
                // Case: /#/signup?token=xyz (Standard) -> searchParams works
                // Case: /?token=xyz#/signup (Query before hash) -> window.location.search
                const urlParams = new URLSearchParams(window.location.search);
                tokenToUse = urlParams.get('token');

                // Case: /signup?token=xyz (Direct path, though unlikely in hash router)
                if (!tokenToUse && window.location.hash.includes('?')) {
                    const hashParts = window.location.hash.split('?')[1];
                    const hashParams = new URLSearchParams(hashParts);
                    tokenToUse = hashParams.get('token');
                }
            }

            console.log("Extracted Token:", tokenToUse); // Debug log

            if (!tokenToUse) {
                setIsValidToken(false);
                toast.error("Invalid or missing invitation token");
                navigate('/login');
                return;
            }

            try {
                setIsLoadingInvitation(true);
                const response = await api.get(`/auth/verify-invitation?token=${tokenToUse}`);
                setInvitationEmail(response.email);
                setInvitationRole(response.role);
                setIsValidToken(true);
            } catch (error: any) {
                console.error("Invitation verification error:", error);
                toast.error(error.message || "Invalid or expired invitation");
                setIsValidToken(false);
                setTimeout(() => navigate('/login'), 2000);
            } finally {
                setIsLoadingInvitation(false);
            }
        };

        fetchInvitationDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        try {
            // Register with API
            const response = await api.post('/auth/signup', {
                token,
                name,
                password
            });

            toast.success("Account created successfully!");

            // Auto-login with the session
            if (response.session) {
                const { data: { session }, error } = await supabase.auth.setSession({
                    access_token: response.session.access_token,
                    refresh_token: response.session.refresh_token
                });

                if (!error && session) {
                    // Set user in context
                    setUser(response.user);

                    // Redirect to dashboard based on role
                    const role = response.user.role;
                    if (role === 'ADMIN') {
                        navigate('/admin');
                    } else if (role === 'WORKER') {
                        navigate('/worker');
                    } else if (role === 'CLIENT') {
                        navigate('/client');
                    } else {
                        navigate('/');
                    }
                } else {
                    // Fallback to login page if session setup fails
                    toast.success("Please log in with your new credentials");
                    navigate('/login');
                }
            } else {
                // Fallback to login page
                toast.success("Please log in with your new credentials");
                navigate('/login');
            }

        } catch (error: any) {
            console.error("Signup error", error);
            toast.error(error.message || "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isValidToken) return null;

    if (isLoadingInvitation) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-slate-600">Verifying invitation...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
                <div className="bg-[#7B3F00] py-6 px-8 text-center relative">
                    <h2 className="text-2xl font-bold text-white font-serif">Complete Registration</h2>
                    <p className="text-white/80 text-sm mt-1">Set up your account to join the team</p>
                </div>

                <div className="p-8">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    value={invitationEmail}
                                    disabled
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-600 cursor-not-allowed"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Invited as {invitationRole}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                    placeholder="Create a strong password"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                    placeholder="Confirm password"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-focus transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-5 h-5" /></>}
                        </button>
                    </form>
                </div>
            </div>
            <p className="mt-8 text-center text-slate-400 text-sm">
                &copy; {new Date().getFullYear()} Fotabong Royal Enterprise
            </p>
        </div>
    );
};

export default Signup;

