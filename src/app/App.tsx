import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/app/config/firebase';
import LoginScreen from '@/app/components/LoginScreen';
import SignUpScreen, { SignUpFormData } from '@/app/components/SignUpScreen';
import ForgetPasswordScreen from '@/app/components/ForgetPasswordScreen';
import PhoneVerificationScreen from '@/app/components/PhoneVerificationScreen';
import OnboardingScreen from '@/app/components/OnboardingScreen';
import CreateNewPasswordScreen from '@/app/components/CreateNewPasswordScreen';
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
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-24 h-24 bg-[#0fa3e2] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-4xl font-['Poppins:SemiBold',sans-serif]">
                    {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h1 className="font-['Poppins:SemiBold',sans-serif] text-2xl text-black mb-2">
                  Welcome to TravelLens!
                </h1>
                <p className="font-['Poppins:Regular',sans-serif] text-lg text-black mb-1">
                  {user.displayName}
                </p>
                <p className="font-['Poppins:Regular',sans-serif] text-sm text-[rgba(0,0,0,0.6)]">
                  {user.email}
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-red-500 text-white px-8 py-3 rounded-[15px] font-['Poppins:Medium',sans-serif] text-[14px] hover:bg-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
