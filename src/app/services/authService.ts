import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
  linkWithCredential,
  User
} from 'firebase/auth';
import { auth } from '@/app/config/firebase';
import { createUserProfile } from '@/app/services/profileService';
import { SignUpFormData } from '@/app/components/SignUpScreen';

// Sign up with email and password
export const signUpWithEmail = async (formData: SignUpFormData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      formData.email, 
      formData.password
    );
    
    // Update user profile with display name
    const displayName = `${formData.firstName} ${formData.lastName}`;
    await updateProfile(userCredential.user, {
      displayName
    });

    await createUserProfile(userCredential.user.uid, displayName);

    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return { success: true, user: result.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Sign in with Facebook
export const signInWithFacebook = async () => {
  try {
    const provider = new FacebookAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return { success: true, user: result.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Check if email exists in Firebase
export const checkEmailExists = async (email: string) => {
  try {
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    return { success: true, exists: signInMethods.length > 0, methods: signInMethods };
  } catch (error: any) {
    return { success: false, error: error.message, exists: false };
  }
};

// Send password reset email
export const sendPasswordReset = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    console.error('Password reset error:', error);
    // Return success anyway for security reasons (don't reveal if email exists)
    return { success: true };
  }
};

// ============ PHONE VERIFICATION FUNCTIONS ============

// Store confirmation result globally
let confirmationResult: ConfirmationResult | null = null;

// Initialize reCAPTCHA verifier (invisible)
export const initializeRecaptcha = (elementId: string) => {
  try {
    const recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
        console.log('reCAPTCHA verified');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });
    return { success: true, verifier: recaptchaVerifier };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Send SMS verification code
export const sendPhoneVerificationCode = async (
  phoneNumber: string, 
  recaptchaVerifier: RecaptchaVerifier
) => {
  try {
    // Phone number must be in E.164 format: +14155552671
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
};

// Verify the SMS code
export const verifyPhoneCode = async (code: string) => {
  try {
    if (!confirmationResult) {
      return { success: false, error: 'No verification in progress' };
    }
    
    const result = await confirmationResult.confirm(code);
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error('Error verifying code:', error);
    return { success: false, error: error.message };
  }
};

// Link phone number to existing email account
export const linkPhoneToAccount = async (
  phoneNumber: string,
  verificationCode: string
) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'No user logged in' };
    }

    const credential = PhoneAuthProvider.credential(
      confirmationResult?.verificationId || '',
      verificationCode
    );
    
    await linkWithCredential(currentUser, credential);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Reset password using phone number
export const sendPasswordResetViaSMS = async (
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
) => {
  try {
    // Send SMS code
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
