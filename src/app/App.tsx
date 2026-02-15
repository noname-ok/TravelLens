import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './config/firebase';
import LoginScreen from './components/LoginScreen';
import SignUpScreen, { SignUpFormData } from './components/SignUpScreen';
import ForgetPasswordScreen from './components/ForgetPasswordScreen';
import PhoneVerificationScreen from './components/PhoneVerificationScreen';
import OnboardingScreen from './components/OnboardingScreen';
import CreateNewPasswordScreen from './components/CreateNewPasswordScreen';
import JournalScreen, { JournalEntry, JournalTab } from './components/JournalScreen';
import MapViewScreen from './components/MapViewScreen';
import AILensScreen from './components/AILensScreen';
import ProfileScreen from './components/ProfileScreen';
import JournalDetailScreen from './components/JournalDetailScreen';
import CreateJournalScreen from './components/CreateJournalScreen';
import EditProfileScreen from './components/EditProfileScreen';
import LanguageScreen from './components/LanguageScreen';
import TermsScreen from './components/TermsScreen';
import PrivacyScreen from './components/PrivacyScreen';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { signUpWithEmail, logOut } from './services/authService';
import { getUserProfile, updateUserProfile, uploadAvatar, UserProfile } from './services/userProfileService';

type Screen = 'login' | 'signup' | 'forgetPassword' | 'phoneVerification' | 'onboarding' | 'createNewPassword' | 'home' | 'mapview' | 'ailens' | 'profile' | 'journalDetail' | 'createJournal' | 'editProfile' | 'language' | 'terms' | 'privacy';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+855');
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const [pendingJournal, setPendingJournal] = useState<JournalEntry | null>(null);
  const [journalInitialTab, setJournalInitialTab] = useState<JournalTab>('community');
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);
  const [deletedJournalId, setDeletedJournalId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Listen to auth state changes
  useEffect(() => {
    // Only run if auth actually exists to prevent the crash
    if (!auth) {
      console.error("Firebase Auth is null! Check your firebase.ts file.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Load user profile from Firestore
        setProfileLoading(true);
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Create a basic profile if none exists
          const basicProfile: UserProfile = {
            uid: user.uid,
            name: user.displayName || 'User',
            location: '',
            preferences: {
              privateAccount: false,
              shareGpsData: false,
              darkMode: false,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setUserProfile(basicProfile);
        } finally {
          setProfileLoading(false);
        }
        setCurrentScreen('home');
      } else {
        setUserProfile(null);
        setCurrentScreen('login');
      }
      setLoading(false);
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
      <div className="w-full h-full max-w-[390px] mx-auto border-x border-border shadow-2xl flex flex-col">
        <Toaster position="top-center" />
        {currentScreen === 'login' && (
          <LoginScreen 
            onCreateAccount={() => setCurrentScreen('signup')}
            onForgetPassword={() => setCurrentScreen('forgetPassword')}
            onLoginSuccess={() => setCurrentScreen('home')}
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
          <JournalScreen
            userName={user.displayName || ''}
            userEmail={user.email || ''}
            onLogout={handleLogout}
            currentScreen={currentScreen}
            onNavigate={(screen: Screen) => setCurrentScreen(screen)}
            onCreateJournal={() => setCurrentScreen('createJournal')}
            onEditJournal={(journal) => {
              setEditingJournal(journal);
              setJournalInitialTab('myJournal');
              setCurrentScreen('createJournal');
            }}
            onOpenJournal={(journal) => {
              setSelectedJournal(journal);
              setCurrentScreen('journalDetail');
            }}
            initialTab={journalInitialTab}
            pendingJournal={pendingJournal}
            onConsumePendingJournal={() => setPendingJournal(null)}
            deletedJournalId={deletedJournalId}
            onConsumeDeletedJournal={() => setDeletedJournalId(null)}
          />
        )}
        {currentScreen === 'journalDetail' && user && selectedJournal && (
          <JournalDetailScreen
            onBack={() => setCurrentScreen('home')}
            currentScreen={currentScreen === 'journalDetail' ? 'home' : currentScreen}
            onNavigate={(screen: Screen) => setCurrentScreen(screen)}
            userInitial={(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            title={selectedJournal.title}
            location={selectedJournal.location}
            description={selectedJournal.description}
            author={selectedJournal.author || user.displayName || user.email || 'User'}
            timeAgo={selectedJournal.timeAgo}
            likes={selectedJournal.likes}
            bookmarks={selectedJournal.bookmarks}
            imageUrl={selectedJournal.imageUrl}
          />
        )}
        {currentScreen === 'createJournal' && user && (
          <CreateJournalScreen
            onBack={() => {
              setEditingJournal(null);
              setCurrentScreen('home');
            }}
            mode={editingJournal ? 'edit' : 'create'}
            initialEntry={
              editingJournal
                ? {
                    title: editingJournal.title,
                    location: editingJournal.location,
                    description: editingJournal.description,
                    imageUrl: editingJournal.imageUrl,
                  }
                : undefined
            }
            onSubmit={(entry) => {
              const author = user.displayName || user.email || 'User';
              const existing = editingJournal;
              setPendingJournal({
                id: existing ? existing.id : `my-${Date.now()}`,
                timeAgo: existing ? existing.timeAgo : 'just now',
                title: entry.title,
                location: entry.location,
                description: entry.description,
                imageUrl: entry.imageUrl,
                likes: existing ? existing.likes : 0,
                bookmarks: existing ? existing.bookmarks : 0,
                views: existing ? existing.views : 0,
                isLiked: existing ? existing.isLiked : false,
                isSaved: existing ? existing.isSaved : false,
                author: existing ? existing.author || author : author,
              });
              setJournalInitialTab('myJournal');
              toast.success(existing ? 'Journal updated successfully' : 'Journal posted successfully');
              setEditingJournal(null);
              setCurrentScreen('home');
            }}
            onDelete={() => {
              if (editingJournal) {
                setDeletedJournalId(editingJournal.id);
                toast.success('Journal deleted');
                setEditingJournal(null);
              } else {
                toast.success('Draft discarded');
              }
              setJournalInitialTab('myJournal');
              setCurrentScreen('home');
            }}
          />
        )}
        {currentScreen === 'mapview' && user && (
          <MapViewScreen
            currentScreen={currentScreen}
            onNavigate={(screen: Screen) => setCurrentScreen(screen)}
          />
        )}
        {currentScreen === 'ailens' && user && (
          <AILensScreen
            currentScreen={currentScreen}
            onNavigate={(screen: Screen) => setCurrentScreen(screen)}
          />
        )}
        {currentScreen === 'profile' && user && userProfile && (
          <ProfileScreen
            currentScreen={currentScreen}
            onNavigate={(screen: Screen) => setCurrentScreen(screen)}
            onEditProfile={() => setCurrentScreen('editProfile')}
            onChangeLanguage={() => setCurrentScreen('language')}
            onOpenTerms={() => setCurrentScreen('terms')}
            onOpenPrivacy={() => setCurrentScreen('privacy')}
            onLogout={handleLogout}
            userName={userProfile.name}
            userLocation={userProfile.location}
            userAvatarUrl={userProfile.avatarUrl}
            privateAccountEnabled={userProfile.preferences.privateAccount}
            gpsEnabled={userProfile.preferences.shareGpsData}
            darkModeEnabled={userProfile.preferences.darkMode}
            onPrivateAccountToggle={async (enabled) => {
              const success = await updateUserProfile(user.uid, {
                preferences: { privateAccount: enabled }
              });
              if (success && userProfile) {
                setUserProfile({
                  ...userProfile,
                  preferences: { ...userProfile.preferences, privateAccount: enabled }
                });
              }
            }}
            onGpsToggle={async (enabled) => {
              const success = await updateUserProfile(user.uid, {
                preferences: { shareGpsData: enabled }
              });
              if (success && userProfile) {
                setUserProfile({
                  ...userProfile,
                  preferences: { ...userProfile.preferences, shareGpsData: enabled }
                });
              }
            }}
            onDarkModeToggle={async (enabled) => {
              const success = await updateUserProfile(user.uid, {
                preferences: { darkMode: enabled }
              });
              if (success && userProfile) {
                setUserProfile({
                  ...userProfile,
                  preferences: { ...userProfile.preferences, darkMode: enabled }
                });
              }
            }}
          />
        )}
        {currentScreen === 'profile' && user && !userProfile && (
          <div className="h-screen flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0fa3e2] mx-auto mb-4"></div>
              <p className="font-['Poppins:Regular',sans-serif] text-[14px] text-[rgba(0,0,0,0.6)]">
                {profileLoading ? 'Loading profile...' : 'Setting up your profile...'}
              </p>
              {!profileLoading && (
                <button
                  onClick={async () => {
                    // Try to create a basic profile if loading failed
                    setProfileLoading(true);
                    try {
                      const basicProfile: UserProfile = {
                        uid: user.uid,
                        name: user.displayName || 'User',
                        location: '',
                        preferences: {
                          privateAccount: false,
                          shareGpsData: false,
                          darkMode: false,
                        },
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      };
                      setUserProfile(basicProfile);
                    } catch (error) {
                      console.error('Error creating basic profile:', error);
                    } finally {
                      setProfileLoading(false);
                    }
                  }}
                  className="mt-4 px-4 py-2 bg-[#0fa3e2] text-white rounded-lg"
                >
                  Continue with Basic Profile
                </button>
              )}
            </div>
          </div>
        )}
        {currentScreen === 'profile' && !user && (
          <div className="h-screen flex items-center justify-center bg-white">
            <div className="text-center">
              <p className="font-['Poppins:Regular',sans-serif] text-[16px] text-[rgba(0,0,0,0.6)]">Please log in to view your profile</p>
              <button
                onClick={() => setCurrentScreen('login')}
                className="mt-4 px-4 py-2 bg-[#0fa3e2] text-white rounded-lg"
              >
                Go to Login
              </button>
            </div>
          </div>
        )}
        {currentScreen === 'editProfile' && user && userProfile && (
          <EditProfileScreen
            currentScreen="profile"
            onNavigate={(screen: Screen) => setCurrentScreen(screen)}
            onBack={() => setCurrentScreen('profile')}
            initialName={userProfile.name}
            initialLocation={userProfile.location}
            initialAvatarUrl={userProfile.avatarUrl}
            onSave={async (data) => {
              const success = await updateUserProfile(user.uid, {
                name: data.name,
                location: data.location,
                avatarUrl: data.avatarUrl,
              });

              if (success) {
                setUserProfile({
                  ...userProfile,
                  name: data.name,
                  location: data.location,
                  avatarUrl: data.avatarUrl,
                  updatedAt: new Date(),
                });
                toast.success('Profile updated successfully');
              } else {
                toast.error('Failed to update profile');
              }

              setCurrentScreen('profile');
            }}
          />
        )}
        {currentScreen === 'language' && user && (
          <LanguageScreen
            currentScreen="profile"
            onNavigate={(screen: Screen) => setCurrentScreen(screen)}
            onBack={() => setCurrentScreen('profile')}
          />
        )}
        {currentScreen === 'terms' && user && (
          <TermsScreen
            currentScreen="profile"
            onNavigate={(screen: Screen) => setCurrentScreen(screen)}
            onBack={() => setCurrentScreen('profile')}
          />
        )}
        {currentScreen === 'privacy' && user && (
          <PrivacyScreen
            currentScreen="profile"
            onNavigate={(screen: Screen) => setCurrentScreen(screen)}
            onBack={() => setCurrentScreen('profile')}
          />
        )}
      </div>
    </div>
  );
}
