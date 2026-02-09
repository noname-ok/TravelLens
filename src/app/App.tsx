import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/app/config/firebase';
import LoginScreen from '@/app/components/LoginScreen';
import SignUpScreen, { SignUpFormData } from '@/app/components/SignUpScreen';
import ForgetPasswordScreen from '@/app/components/ForgetPasswordScreen';
import PhoneVerificationScreen from '@/app/components/PhoneVerificationScreen';
import OnboardingScreen from '@/app/components/OnboardingScreen';
import CreateNewPasswordScreen from '@/app/components/CreateNewPasswordScreen';
import JournalCard from './components/JournalCard';
import { Toaster } from '@/app/components/ui/sonner';
import { toast } from 'sonner';
import { signUpWithEmail, logOut } from '@/app/services/authService';

type Screen = 'login' | 'signup' | 'forgetPassword' | 'phoneVerification' | 'onboarding' | 'createNewPassword' | 'home';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+855');

  // Listen to auth state changes
  useEffect(() => {
    // Only run if auth actually exists to prevent the crash
    if (!auth) {
      console.error("Firebase Auth is null! Check your firebase.ts file.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        setCurrentScreen('home');
      } else {
        setCurrentScreen('login');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignUp = async (data: SignUpFormData) => {
    const result = await signUpWithEmail(data);
    
    if (result.success) {
      toast.success('Account created successfully!');
      setCurrentScreen('onboarding');
    } else {
      toast.error(result.error || 'Failed to create account');
    }
  };

  const handleLogout = async () => {
    const result = await logOut();
    if (result.success) {
      toast.success('Logged out successfully');
      setCurrentScreen('login');
    } else {
      toast.error('Failed to log out');
    }
  };

  const handlePhoneVerification = (phone: string, code: string) => {
    setPhoneNumber(phone);
    setCountryCode(code);
    setCurrentScreen('phoneVerification');
  };

  const handlePhoneVerified = () => {
    toast.success('Phone number verified successfully!');
    setCurrentScreen('createNewPassword');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0fa3e2] mx-auto mb-4"></div>
          <p className="font-['Poppins:Regular',sans-serif] text-[14px] text-[rgba(0,0,0,0.6)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-background flex items-center justify-center">
      <div className="w-full h-full max-w-md mx-auto border-x border-border shadow-2xl flex flex-col">
        <Toaster position="top-center" />
        {currentScreen === 'login' && (
          <LoginScreen 
            onCreateAccount={() => setCurrentScreen('signup')}
            onForgetPassword={() => setCurrentScreen('forgetPassword')}
          />
        )}
        {currentScreen === 'signup' && (
          <SignUpScreen 
            onBack={() => setCurrentScreen('login')} 
            onSignUp={handleSignUp}
          />
        )}
        {currentScreen === 'forgetPassword' && (
          <ForgetPasswordScreen 
            onBack={() => setCurrentScreen('login')}
            onPhoneVerification={handlePhoneVerification}
          />
        )}
        {currentScreen === 'phoneVerification' && (
          <PhoneVerificationScreen
            phoneNumber={phoneNumber}
            countryCode={countryCode}
            onVerified={handlePhoneVerified}
            onBack={() => setCurrentScreen('forgetPassword')}
          />
        )}
        {currentScreen === 'onboarding' && (
          <OnboardingScreen
            onNext={() => setCurrentScreen('login')}
          />
        )}
        {currentScreen === 'createNewPassword' && (
          <CreateNewPasswordScreen
            onBack={() => setCurrentScreen('phoneVerification')}
            onPasswordCreated={() => {
              toast.success('Password changed successfully!');
              setCurrentScreen('login');
            }}
          />
        )}
        {currentScreen === 'home' && user && (
          <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
            {/* --- HEADER (Rectangle 1 & Frame 3894) --- */}
            <header className="sticky top-0 z-20 w-full h-[109px] bg-white border-b border-gray-100 px-6 pt-[52px]">
              <div className="flex justify-between items-center w-full">
                {/* Group 3893: Avatar + Journal Title */}
                <div className="flex items-center gap-[12px]">
                  <div className="w-[40px] h-[40px] bg-[#CDE5FF] rounded-full flex items-center justify-center text-[#2C638B] font-bold">
                    {user.displayName?.charAt(0) || "U"}
                  </div>
                  <h1 className="font-['Inter'] font-medium text-[20px] leading-[22px] tracking-[-0.408px] text-black">
                    Journal
                  </h1>
                </div>
                
                {/* Search Icon */}
                <button className="w-[29.2px] h-[27px] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
              </div>
            </header>

            {/* --- TABS (Community / Following etc.) --- */}
            <nav className="flex w-full bg-[#F7F9FF] border-b border-[#DEE3EB]">
              <button className="flex-1 py-3 text-center border-b-2 border-[#094B72] text-[#094B72] font-['Roboto'] font-medium text-[14px]">
                Community
              </button>
              <button className="flex-1 py-3 text-center text-[#084B72]/60 font-['Roboto'] font-medium text-[14px]">
                Following
              </button>
              <button className="flex-1 py-3 text-center text-[#084B72]/60 font-['Roboto'] font-medium text-[14px]">
                Local
              </button>
            </nav>

            {/* --- SCROLLABLE FEED --- */}
            <main className="flex-1 overflow-y-auto p-5 pb-24 space-y-6">
              {/* You can map through data here, but for now, we'll call your new component */}
              <JournalCard />
              <JournalCard />
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
