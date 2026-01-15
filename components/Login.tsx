
// ... (imports remain the same)
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { Lock, ArrowRight, X, Mail, Phone, MapPin, Shield, FileText, Loader2 } from 'lucide-react';
// import { MOCK_USERS } from '../constants';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
    const { login } = useContext(UserContext);
    const navigate = useNavigate();
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (error: any) {
            console.error("Login Error:", error);
            const message = error.message || "Login failed. Please check your connection.";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = () => {
        toast("Registration is currently by invitation only. Please contact the administrator.", {
            icon: '🔒',
            style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
            },
        });
    };

    return (
        <div className="min-h-screen bg-white flex flex-col relative overflow-hidden font-sans text-slate-900">
            {/* Background Texture - Blueprint Style */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#003366 1px, transparent 1px), linear-gradient(90deg, #003366 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}>
            </div>

            {/* Header */}
            <header className="pt-8 pb-4 text-center px-4 relative z-10">
                <div className="flex justify-center mb-4">
                    <img
                        src="https://i.postimg.cc/9X91N12z/Whats-App-Image-2025-05-31-at-05-59-28-35f9787e.jpg"
                        alt="Fotabong Royal Enterprise Logo"
                        className="h-24 w-auto object-contain rounded-lg shadow-sm bg-white"
                    />
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#7B3F00] tracking-wide uppercase font-serif">
                    Fotabong Royal Enterprise Cameroon
                </h1>
                <p className="text-blue-900/80 font-medium mt-2 text-sm md:text-base italic">
                    Building Dreams, Roads, Bridges, and Communities
                </p>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center px-4 max-w-6xl mx-auto w-full relative z-10 mb-12">

                {/* Hero Image */}
                <div className="w-full max-w-4xl h-64 md:h-96 rounded-2xl overflow-hidden shadow-2xl border-4 border-[#7B3F00]/20 mb-8 relative group">
                    <img
                        src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=2000"
                        alt="Construction Site"
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-8">
                        <p className="text-white text-lg md:text-xl font-medium text-center px-6 max-w-2xl drop-shadow-md">
                            We design, supervise, and build your dream homes, roads, and bridges. Quality is our priority.
                        </p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md justify-center">
                    <button
                        onClick={() => setShowLoginForm(true)}
                        className="flex-1 py-3 px-6 bg-blue-700 text-white rounded-xl font-bold text-lg shadow-[0_4px_0_rgb(29,78,216)] active:shadow-[0_2px_0_rgb(29,78,216)] active:translate-y-[2px] transition-all flex items-center justify-center gap-2 hover:bg-blue-600"
                    >
                        Login
                    </button>
                    <button
                        onClick={handleSignUp}
                        className="flex-1 py-3 px-6 bg-white text-[#7B3F00] border-2 border-[#7B3F00] rounded-xl font-bold text-lg shadow-[0_4px_0_rgb(123,63,0)] active:shadow-[0_2px_0_rgb(123,63,0)] active:translate-y-[2px] transition-all flex items-center justify-center gap-2 hover:bg-[#7B3F00]/5"
                    >
                        Sign Up
                    </button>
                </div>

            </main>

            {/* Footer */}
            <footer className="bg-[#7B3F00] text-white/90 py-6 px-4 relative z-10 mt-auto w-full">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-light">
                    <div className="flex gap-6">
                        <button onClick={() => setShowAboutModal(true)} className="hover:text-white hover:underline focus:outline-none">About Us</button>
                        <button onClick={() => setShowContactModal(true)} className="hover:text-white hover:underline focus:outline-none">Contact</button>
                    </div>
                    <div className="flex gap-6">
                        <button onClick={() => setShowPrivacyModal(true)} className="hover:text-white hover:underline focus:outline-none">Privacy Policy</button>
                        <button onClick={() => setShowTermsModal(true)} className="hover:text-white hover:underline focus:outline-none">Terms of Service</button>
                    </div>
                </div>
                <div className="text-center text-xs text-white/60 mt-4">
                    © {new Date().getFullYear()} Fotabong Royal Enterprise Cameroon. All rights reserved.
                </div>
            </footer>

            {/* Login Modal Overlay */}
            {showLoginForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#003366]/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowLoginForm(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors bg-white/20 backdrop-blur-md"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>

                        <div className="bg-blue-700 py-6 px-8 text-center">
                            <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                            <p className="text-blue-100 text-sm">Access your project dashboard</p>
                        </div>

                        <div className="p-8">
                            <form className="space-y-5" onSubmit={handleSubmit}>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            placeholder="Enter your email"
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
                                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            placeholder="Enter your password"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 bg-[#7B3F00] text-white rounded-xl font-bold text-lg hover:bg-[#603000] transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
                                </button>
                            </form>


                        </div>
                    </div>
                </div>
            )}

            {/* About Us Modal */}
            {showAboutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#003366]/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowAboutModal(false)}
                            className="absolute top-4 right-4 text-white hover:text-slate-200 p-1 rounded-full hover:bg-white/20 transition-colors z-50"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="bg-[#7B3F00] py-6 px-8 text-center relative">
                            <h2 className="text-2xl font-bold text-white font-serif">About Us</h2>
                        </div>

                        <div className="p-8">
                            <div className="flex justify-center mb-6">
                                <img
                                    src="https://i.postimg.cc/9X91N12z/Whats-App-Image-2025-05-31-at-05-59-28-35f9787e.jpg"
                                    alt="Fotabong Royal Enterprise Logo"
                                    className="h-24 w-auto object-contain rounded-lg shadow-sm"
                                />
                            </div>
                            <div className="space-y-4 text-center">
                                <p className="text-slate-800 text-lg font-semibold leading-relaxed">
                                    Fotabong Royal Enterprise Cameroon is a professional construction company specializing in buildings, roads, bridges, property development, and construction management.
                                </p>
                                <div className="w-16 h-1 bg-[#7B3F00]/20 mx-auto rounded-full"></div>
                                <p className="text-slate-600 font-medium">
                                    We are committed to quality, reliability, and customer satisfaction.
                                </p>
                            </div>
                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={() => setShowAboutModal(false)}
                                    className="px-8 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-colors border border-slate-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Modal */}
            {showContactModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#003366]/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowContactModal(false)}
                            className="absolute top-4 right-4 text-white hover:text-slate-200 p-1 rounded-full hover:bg-white/20 transition-colors z-50"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="bg-[#7B3F00] py-6 px-8 text-center relative">
                            <h2 className="text-2xl font-bold text-white font-serif">Contact Us</h2>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-50 p-3 rounded-full">
                                    <Mail className="w-6 h-6 text-[#7B3F00]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Email</h3>
                                    <a href="mailto:forecam2007@yahoo.com" className="text-slate-600 hover:text-[#7B3F00] transition-colors">forecam2007@yahoo.com</a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-blue-50 p-3 rounded-full">
                                    <Phone className="w-6 h-6 text-[#7B3F00]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Phone</h3>
                                    <p className="text-slate-600">+237 233 351 905</p>
                                    <p className="text-slate-600">+237 675 000 459</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-blue-50 p-3 rounded-full">
                                    <MapPin className="w-6 h-6 text-[#7B3F00]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Location</h3>
                                    <p className="text-slate-600">Tiko Golf Layout, P.O. Box 43</p>
                                    <p className="text-slate-600">Tiko, Cameroon</p>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={() => setShowContactModal(false)}
                                    className="px-8 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-colors border border-slate-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Privacy Policy Modal */}
            {showPrivacyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#003366]/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowPrivacyModal(false)}
                            className="absolute top-4 right-4 text-white hover:text-slate-200 p-1 rounded-full hover:bg-white/20 transition-colors z-50"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="bg-[#7B3F00] py-6 px-8 text-center relative">
                            <h2 className="text-2xl font-bold text-white font-serif">Privacy Policy</h2>
                        </div>

                        <div className="p-8 space-y-4">
                            <div className="flex justify-center mb-4">
                                <div className="bg-blue-50 p-4 rounded-full">
                                    <Shield className="w-8 h-8 text-[#7B3F00]" />
                                </div>
                            </div>
                            <p className="text-slate-700 text-lg leading-relaxed text-center">
                                We respect your privacy. All personal and project information shared in this system is securely stored and used only for operational and communication purposes.
                            </p>
                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={() => setShowPrivacyModal(false)}
                                    className="px-8 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-colors border border-slate-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Terms & Conditions Modal */}
            {showTermsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#003366]/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowTermsModal(false)}
                            className="absolute top-4 right-4 text-white hover:text-slate-200 p-1 rounded-full hover:bg-white/20 transition-colors z-50"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="bg-[#7B3F00] py-6 px-8 text-center relative">
                            <h2 className="text-2xl font-bold text-white font-serif">Terms & Conditions</h2>
                        </div>

                        <div className="p-8 space-y-4">
                            <div className="flex justify-center mb-4">
                                <div className="bg-blue-50 p-4 rounded-full">
                                    <FileText className="w-8 h-8 text-[#7B3F00]" />
                                </div>
                            </div>
                            <p className="text-slate-700 text-lg leading-relaxed text-center">
                                By using this system, you agree to comply with company policies, authorized access rules, and proper use of project, work order, and company data.
                            </p>
                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={() => setShowTermsModal(false)}
                                    className="px-8 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-colors border border-slate-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
