import { useState, useEffect, useRef } from 'react';
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
import PublicProfileScreen from './components/PublicProfileScreen';
import JournalDetailScreen from './components/JournalDetailScreen';
import CreateJournalScreen from './components/CreateJournalScreen';
import EditProfileScreen from './components/EditProfileScreen';
import LanguageScreen from './components/LanguageScreen';
import TermsScreen from './components/TermsScreen';
import PrivacyScreen from './components/PrivacyScreen';
import ItineraryViewScreen from './components/ItineraryViewScreen';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { signUpWithEmail, logOut } from './services/authService';
import { getUserProfile, updateUserProfile, uploadAvatar, UserProfile } from './services/userProfileService';
import { TripItinerary } from './types/tripPlanning';
import { deleteTripFromStorage, updateTripInStorage } from './services/tripPlannerService';
import {
  createJournal,
  deleteJournal,
  incrementJournalViews,
  recordUserJournalInterest,
  syncAuthorAvatarAcrossContent,
  updateJournal,
  uploadJournalImage,
} from './services/journalService';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

type Screen = 'login' | 'signup' | 'forgetPassword' | 'phoneVerification' | 'onboarding' | 'createNewPassword' | 'home' | 'mapview' | 'ailens' | 'profile' | 'userProfileView' | 'journalDetail' | 'createJournal' | 'editProfile' | 'language' | 'terms' | 'privacy' | 'itinerary';

export default function App() {
  const { t } = useTranslation();
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+855');
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const [journalInitialTab, setJournalInitialTab] = useState<JournalTab>('community');
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripItinerary | null>(null);
  const [selectedProfileUser, setSelectedProfileUser] = useState<{ userId: string; userName?: string; userAvatarUrl?: string } | null>(null);
  const [profileBackScreen, setProfileBackScreen] = useState<'home' | 'journalDetail'>('home');
  const [termsReturnScreen, setTermsReturnScreen] = useState<Screen>('profile');
  const [termsShowBottomNav, setTermsShowBottomNav] = useState(true);
  const [termsAcceptedSignal, setTermsAcceptedSignal] = useState(0);
  const interestViewedJournalIds = useRef<Set<string>>(new Set());

  const handleNavigate = (screen: Screen) => {
    if (screen === 'home') {
      setJournalInitialTab('community');
    }
    setCurrentScreen(screen);
  };

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
          let profile = await getUserProfile(user.uid);
          
          // If profile doesn't exist, create a basic one in Firebase
          if (!profile) {
            console.log('No profile found, creating basic profile...');
            const basicProfile: UserProfile = {
              uid: user.uid,
              name: user.displayName || 'User',
              bio: '',
              preferences: {
                privateAccount: false,
                shareGpsData: false,
                darkMode: false,
                language: 'en',
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            // Save to Firebase
            await updateUserProfile(user.uid, {
              name: basicProfile.name,
              bio: basicProfile.bio,
              preferences: basicProfile.preferences,
            });
            
            profile = basicProfile;
          }
          
          setUserProfile(profile);
          const preferredLanguage = profile.preferences?.language || 'en';
          localStorage.setItem('appLanguage', preferredLanguage);
          i18n.changeLanguage(preferredLanguage);
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Create a basic profile if error occurs
          const basicProfile: UserProfile = {
            uid: user.uid,
            name: user.displayName || 'User',
            bio: '',
            preferences: {
              privateAccount: false,
              shareGpsData: false,
              darkMode: false,
              language: 'en',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          setUserProfile(basicProfile);
        } finally {
          setProfileLoading(false);
        }
        setJournalInitialTab('community');
        setCurrentScreen('home');
      } else {
        setUserProfile(null);
        setCurrentScreen('login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (userProfile?.preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [userProfile?.preferences.darkMode]);

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

  const handleViewTrip = (trip: TripItinerary) => {
    setSelectedTrip(trip);
    setCurrentScreen('itinerary');
  };

  const handleDeleteTrip = (tripId: string) => {
    deleteTripFromStorage(tripId);
    setSelectedTrip(null);
    toast.success('Trip deleted successfully');
  };

  const handleUpdateTrip = (trip: TripItinerary) => {
    updateTripInStorage(trip);
    setSelectedTrip(trip);
    toast.success('Trip updated successfully');
  };

  const handleOpenUserProfile = (
    target: { userId: string; userName?: string; userAvatarUrl?: string },
    source: 'home' | 'journalDetail' = 'home',
  ) => {
    if (!target.userId || !user) return;

    if (target.userId === user.uid) {
      setCurrentScreen('profile');
      return;
    }

    setSelectedProfileUser(target);
    setProfileBackScreen(source);
    setCurrentScreen('userProfileView');
  };
  useEffect(() => {
    if (!user || !selectedJournal || currentScreen !== 'journalDetail') {
      return;
    }

    const key = `${user.uid}:${selectedJournal.id}`;
    if (interestViewedJournalIds.current.has(key)) {
      return;
    }

    const timer = setTimeout(() => {
      interestViewedJournalIds.current.add(key);

      void recordUserJournalInterest(user.uid, selectedJournal.id, 'view').then((nextVector) => {
        if (!nextVector) return;
        setUserProfile((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            userInterestVector: nextVector,
            updatedAt: new Date(),
          };
        });
      });
    }, 10_000);

    return () => {
      clearTimeout(timer);
    };
  }, [currentScreen, selectedJournal, user]);

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
            onLoginSuccess={() => {
              setJournalInitialTab('community');
              setCurrentScreen('home');
            }}
          />
        )}
        {currentScreen === 'signup' && (
          <SignUpScreen 
            onBack={() => setCurrentScreen('login')} 
            onSignUp={handleSignUp}
            acceptTermsSignal={termsAcceptedSignal}
            onOpenTerms={() => {
              setTermsReturnScreen('signup');
              setTermsShowBottomNav(false);
              setCurrentScreen('terms');
            }}
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
            userAvatarUrl={userProfile?.avatarUrl}
            currentUserId={user.uid}
            onLogout={handleLogout}
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onCreateJournal={() => setCurrentScreen('createJournal')}
            userInterestVector={userProfile?.userInterestVector}
            onPositiveInteraction={(journalId, signal) => {
              void recordUserJournalInterest(user.uid, journalId, signal).then((nextVector) => {
                if (!nextVector) return;
                setUserProfile((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    userInterestVector: nextVector,
                    updatedAt: new Date(),
                  };
                });
              });
            }}
            onEditJournal={(journal) => {
              setEditingJournal(journal);
              setJournalInitialTab('myJournal');
              setCurrentScreen('createJournal');
            }}
            onOpenUserProfile={(target) => handleOpenUserProfile(target, 'home')}
            onOpenJournal={async (journal) => {
              const success = await incrementJournalViews(journal.id);
              const nextViews = (journal.views ?? 0) + (success ? 1 : 0);
              setSelectedJournal({
                ...journal,
                views: nextViews,
              });
              setCurrentScreen('journalDetail');
            }}
            initialTab={journalInitialTab}
          />
        )}
        {currentScreen === 'journalDetail' && user && selectedJournal && (
          <JournalDetailScreen
            onBack={() => setCurrentScreen('home')}
            currentScreen={currentScreen === 'journalDetail' ? 'home' : currentScreen}
            onNavigate={handleNavigate}
            journalId={selectedJournal.id}
            currentUserId={user.uid}
            currentUserName={userProfile?.name || user.displayName || user.email || 'User'}
            currentUserAvatarUrl={userProfile?.avatarUrl}
            userInitial={(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            title={selectedJournal.title}
            location={selectedJournal.location}
            description={selectedJournal.description}
            author={selectedJournal.author || user.displayName || user.email || 'User'}
            authorId={selectedJournal.authorId}
            authorAvatarUrl={selectedJournal.authorAvatarUrl}
            timeAgo={selectedJournal.timeAgo}
            likes={selectedJournal.likes}
            bookmarks={selectedJournal.bookmarks}
            imageUrl={selectedJournal.imageUrl}
            onOpenUserProfile={(target) => handleOpenUserProfile(target, 'journalDetail')}
          />
        )}
        {currentScreen === 'userProfileView' && user && selectedProfileUser && (
          <PublicProfileScreen
            viewedUserId={selectedProfileUser.userId}
            currentUserId={user.uid}
            fallbackName={selectedProfileUser.userName}
            fallbackAvatarUrl={selectedProfileUser.userAvatarUrl}
            onBack={() => setCurrentScreen(profileBackScreen)}
            onOpenJournal={async (journal) => {
              const success = await incrementJournalViews(journal.id);
              const nextViews = (journal.views ?? 0) + (success ? 1 : 0);
              setSelectedJournal({
                ...journal,
                views: nextViews,
              });
              setCurrentScreen('journalDetail');
            }}
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
            onSubmit={async (entry) => {
              const author = userProfile?.name || user.displayName || user.email || 'User';
              const existing = editingJournal;

              let imageUrl = entry.imageUrl;
              if (entry.imageFile) {
                const uploaded = await uploadJournalImage(user.uid, entry.imageFile);
                if (!uploaded) {
                  toast.error('Failed to upload image. Check Firebase Storage bucket/rules, then try again.');
                  return;
                }
                imageUrl = uploaded;
              }

              if (existing) {
                const success = await updateJournal(existing.id, {
                  title: entry.title,
                  location: entry.location,
                  description: entry.description,
                  imageUrl,
                });
                if (!success) {
                  toast.error('Failed to update journal');
                  return;
                }
                toast.success('Journal updated successfully');
              } else {
                const createdId = await createJournal({
                  title: entry.title,
                  location: entry.location,
                  description: entry.description,
                  imageUrl,
                  author,
                  authorId: user.uid,
                  authorAvatarUrl: userProfile?.avatarUrl,
                });
                if (!createdId) {
                  toast.error('Failed to post journal');
                  return;
                }
                toast.success('Journal posted successfully');
              }

              setJournalInitialTab('myJournal');
              setEditingJournal(null);
              setCurrentScreen('home');
            }}
            onDelete={async () => {
              if (editingJournal) {
                const success = await deleteJournal(editingJournal.id);
                if (!success) {
                  toast.error('Failed to delete journal');
                  return;
                }
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
            onViewTrip={(trip: TripItinerary) => {
              setSelectedTrip(trip);
              setCurrentScreen('itinerary');
            }}
            onNavigate={handleNavigate}
          />
        )}
        {currentScreen === 'ailens' && user && (
          <AILensScreen
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            preferredLanguageCode={userProfile?.preferences.language}
          />
        )}
        {currentScreen === 'profile' && user && userProfile && (
          <ProfileScreen
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onEditProfile={() => setCurrentScreen('editProfile')}
            onChangeLanguage={() => setCurrentScreen('language')}
            onOpenTerms={() => {
              setTermsReturnScreen('profile');
              setTermsShowBottomNav(true);
              setCurrentScreen('terms');
            }}
            onOpenPrivacy={() => setCurrentScreen('privacy')}
            onLogout={handleLogout}
            userName={userProfile.name}
            userBio={userProfile.bio}
            userAvatarUrl={userProfile.avatarUrl}
            privateAccountEnabled={userProfile.preferences.privateAccount}
            darkModeEnabled={userProfile.preferences.darkMode}
            onPrivateAccountToggle={async (enabled) => {
              // Optimistic update - update UI immediately
              const previousState = userProfile.preferences.privateAccount;
              setUserProfile({
                ...userProfile,
                preferences: { ...userProfile.preferences, privateAccount: enabled }
              });
              
              // Try to update Firebase
              const success = await updateUserProfile(user.uid, {
                preferences: { privateAccount: enabled }
              });
              
              if (!success) {
                // Revert on failure
                setUserProfile({
                  ...userProfile,
                  preferences: { ...userProfile.preferences, privateAccount: previousState }
                });
                toast.error('Failed to update settings. Please try again.');
              }
            }}
            onDarkModeToggle={async (enabled) => {
              // Optimistic update - update UI immediately
              const previousState = userProfile.preferences.darkMode;
              setUserProfile({
                ...userProfile,
                preferences: { ...userProfile.preferences, darkMode: enabled }
              });
              
              // Show toast
              toast.success(enabled ? t('toast.darkModeEnabled') : t('toast.darkModeDisabled'));
              
              // Try to update Firebase
              const success = await updateUserProfile(user.uid, {
                preferences: { darkMode: enabled }
              });
              
              if (!success) {
                // Revert on failure
                setUserProfile({
                  ...userProfile,
                  preferences: { ...userProfile.preferences, darkMode: previousState }
                });
                toast.error('Failed to update settings. Please try again.');
              }
            }}
          />
        )}
        {currentScreen === 'itinerary' && selectedTrip && (
          <ItineraryViewScreen
            trip={selectedTrip}
            onBack={() => {
              setSelectedTrip(null);
              setCurrentScreen('mapview');
            }}
            onDelete={handleDeleteTrip}
            onUpdate={handleUpdateTrip}
            onReplan={() => {
              setSelectedTrip(null);
              setCurrentScreen('mapview');
            }}
          />
        )}
        {currentScreen === 'profile' && user && !userProfile && (
          <div className="h-screen flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0fa3e2] mx-auto mb-4"></div>
              <p className="font-['Poppins:Regular',sans-serif] text-[14px] text-[rgba(0,0,0,0.6)]">
                Setting up your profile...
              </p>
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
            onNavigate={handleNavigate}
            onBack={() => setCurrentScreen('profile')}
            initialName={userProfile.name}
            initialBio={userProfile.bio}
            initialAvatarUrl={userProfile.avatarUrl}
            onSave={async (data) => {
              let nextAvatarUrl = userProfile.avatarUrl;

              if (data.avatarFile) {
                const uploadedAvatarUrl = await uploadAvatar(user.uid, data.avatarFile);
                if (!uploadedAvatarUrl) {
                  throw new Error('Failed to upload avatar');
                }
                nextAvatarUrl = uploadedAvatarUrl;
              }

              const success = await updateUserProfile(user.uid, {
                name: data.name,
                bio: data.bio,
                avatarUrl: nextAvatarUrl,
              });

              if (success) {
                setUserProfile({
                  ...userProfile,
                  name: data.name,
                  bio: data.bio,
                  avatarUrl: nextAvatarUrl,
                  updatedAt: new Date(),
                });

                void syncAuthorAvatarAcrossContent(user.uid, nextAvatarUrl);
                setCurrentScreen('profile');
              } else {
                throw new Error('Failed to update profile');
              }
            }}
          />
        )}
        {currentScreen === 'language' && user && (
          <LanguageScreen
            currentScreen="profile"
            onNavigate={handleNavigate}
            onBack={() => setCurrentScreen('profile')}
            onLanguageChange={async (languageCode) => {
              if (!userProfile) return;
              const success = await updateUserProfile(user.uid, {
                preferences: { language: languageCode },
              });

              if (success) {
                setUserProfile({
                  ...userProfile,
                  preferences: {
                    ...userProfile.preferences,
                    language: languageCode,
                  },
                });
              }
            }}
          />
        )}
        {currentScreen === 'terms' && (
          <TermsScreen
            currentScreen={termsReturnScreen === 'profile' ? 'profile' : 'home'}
            onNavigate={handleNavigate}
            onBack={() => setCurrentScreen(termsReturnScreen)}
            showBottomNav={termsShowBottomNav}
            onAccept={() => {
              if (termsReturnScreen === 'signup') {
                setTermsAcceptedSignal((prev) => prev + 1);
              }
            }}
          />
        )}
        {currentScreen === 'privacy' && user && (
          <PrivacyScreen
            currentScreen="profile"
            onNavigate={handleNavigate}
            onBack={() => setCurrentScreen('profile')}
          />
        )}
      </div>
    </div>
  );
}
