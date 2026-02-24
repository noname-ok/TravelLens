import { useState } from 'react';
import { Camera, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { signInWithEmail, signInWithGoogle } from '@/app/services/authService';

const imgIcon1 = "https://www.figma.com/api/mcp/asset/3350b0c3-3072-4ea6-86d0-37a67f8115f8";
const imgEye = "https://www.figma.com/api/mcp/asset/e1e0e2ad-5130-408c-8bb0-aa43e9b978f1";
const imgGmail = "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg";

interface LoginScreenProps {
  onCreateAccount?: () => void;
  onForgetPassword?: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginScreen({ onCreateAccount, onForgetPassword, onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    const result = await signInWithEmail(email, password);
    setLoading(false);

    if (result.success) {
      // call optional success callback so parent can navigate immediately
      onLoginSuccess?.();
      return;
    }

    if (!result.success) {
      // Show more specific error messages
      if (result.error?.includes('user-not-found')) {
        toast.error('No account found with this email. Please sign up first.');
      } else if (result.error?.includes('wrong-password')) {
        toast.error('Incorrect password. Please try again.');
      } else if (result.error?.includes('invalid-email')) {
        toast.error('Invalid email address.');
      } else if (result.error?.includes('invalid-credential')) {
        toast.error('Invalid email or password.');
      } else {
        toast.error(result.error || 'Failed to sign in');
      }
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await signInWithGoogle();
    setLoading(false);

    if (!result.success) {
      toast.error(result.error || 'Failed to sign in');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 relative size-full" data-name="Login" data-node-id="1:2487">
      {loading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0fa3e2]"></div>
        </div>
      )}
      <div className="relative mx-auto w-full max-w-[390px] h-full">
        <div className="absolute content-stretch flex flex-col gap-[13px] items-center left-[33px] top-[80px] w-[323px]" data-node-id="1:2491">
          <div className="relative shrink-0 size-[114px]" data-name="icon 1" data-node-id="1:2492">
            <div className="absolute inset-0 rounded-full bg-[#e7f4fb] flex items-center justify-center">
              <Camera size={48} className="text-[#0fa3e2]" />
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[30px] items-center relative shrink-0 w-full" data-node-id="1:2493">
            <div className="content-stretch flex flex-col items-center relative shrink-0" data-node-id="1:2494">
              <div className="content-stretch flex flex-col items-center justify-center leading-[normal] not-italic relative shrink-0 text-center" data-node-id="1:2495">
                <p className="font-['Poppins:SemiBold',sans-serif] relative shrink-0 text-[22px] text-black dark:text-white" data-node-id="1:2496">
                  Welcome to TravelLens
                </p>
                <p className="font-['Poppins:Regular',sans-serif] relative shrink-0 text-[12px] text-[rgba(0,0,0,0.8)] dark:text-gray-400" data-node-id="1:2497">
                  Please choose your login option below
                </p>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-[323px]" data-node-id="1:2498">
              <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0" data-node-id="1:2499">
                <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0" data-node-id="1:2500">
                  <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0" data-name="email" data-node-id="1:2501">
                    <label className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[12px] text-[rgba(0,0,0,0.6)] dark:text-gray-400" data-node-id="1:2502">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="border border-[rgba(0,0,0,0.1)] dark:border-gray-700 border-solid content-stretch flex h-[52px] items-center pl-[15px] py-[10px] relative rounded-[15px] shrink-0 w-[323px] font-['Poppins:Regular',sans-serif] text-[10px] text-black dark:text-white dark:bg-gray-800 outline-none focus:border-[#0fa3e2]"
                      data-node-id="1:2503"
                    />
                  </div>
                  <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0" data-name="password" data-node-id="1:2505">
                    <label className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[12px] text-[rgba(0,0,0,0.6)] dark:text-gray-400" data-node-id="1:2506">
                      Password
                    </label>
                    <div className="border border-[rgba(0,0,0,0.1)] dark:border-gray-700 border-solid content-stretch flex h-[52px] items-center px-[15px] py-[10px] relative rounded-[15px] shrink-0 w-[323px] dark:bg-gray-800" data-node-id="1:2507">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="content-stretch flex-[1_0_0] font-['Poppins:Regular',sans-serif] text-[10px] text-black dark:text-white outline-none bg-transparent"
                        data-node-id="1:2509"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="relative shrink-0 size-[19px] cursor-pointer dark:invert"
                        data-name="eye"
                        data-node-id="1:2510"
                      >
                        {showPassword ? (
                          <EyeOff size={19} className="text-black dark:text-white" />
                        ) : (
                          <Eye size={19} className="text-black dark:text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onForgetPassword}
                  className="block cursor-pointer font-['Poppins:Regular',sans-serif] leading-[0] min-w-full not-italic relative shrink-0 text-[#0061d2] text-[12px] text-right w-[min-content] hover:opacity-80" 
                  data-node-id="1:2512"
                >
                  <p className="[text-decoration-skip-ink:none] decoration-solid leading-[normal] underline whitespace-pre-wrap">Forgot password?</p>
                </button>
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className={`content-stretch flex items-center justify-center px-[20px] py-[17px] relative rounded-[15px] shrink-0 w-full transition-colors ${
                    loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#0fa3e2] cursor-pointer hover:bg-[#0d8ec7]'
                  }`}
                  data-name="button"
                  data-node-id="1:2513"
                >
                  <p className="flex-[1_0_0] font-['Poppins:Medium',sans-serif] leading-[18px] min-h-px min-w-px not-italic relative text-[14px] text-center text-white tracking-[-0.165px] whitespace-pre-wrap" data-node-id="I1:2513;4:228">
                    {loading ? 'Logging in...' : 'Login'}
                  </p>
                </button>
              </div>
              <div className="content-stretch flex items-center justify-center relative shrink-0 w-full" data-node-id="1:2514">
                <div className="bg-[rgba(0,0,0,0.1)] dark:bg-gray-700 flex-[1_0_0] h-px min-h-px min-w-px" data-node-id="1:2515" />
                <p className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[12px] text-[rgba(0,0,0,0.6)] dark:text-gray-400 text-center w-[103px] whitespace-pre-wrap" data-node-id="1:2516">
                  Or login with
                </p>
                <div className="bg-[rgba(0,0,0,0.1)] dark:bg-gray-700 flex-[1_0_0] h-px min-h-px min-w-px" data-node-id="1:2517" />
              </div>
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="1:2518">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="bg-white dark:bg-gray-800 border border-[rgba(0,0,0,0.1)] dark:border-gray-700 border-solid content-stretch flex flex-row h-[52px] items-center justify-center gap-[12px] px-[20px] py-[10px] relative rounded-[15px] shrink-0 w-full cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-name="login method"
                >
                  <div className="relative shrink-0 size-[24px]">
                    <img alt="Gmail" className="block max-w-none size-full" src={imgGmail} />
                  </div>
                  <span className="font-['Poppins:Medium',sans-serif] text-[14px] text-black dark:text-white">
                    Gmail
                  </span>
                </button>
                <div className="content-stretch flex items-center justify-center relative shrink-0 w-full mt-4">
                  <p className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic text-[12px] text-[rgba(0,0,0,0.6)] dark:text-gray-400 text-center">
                    Doesn't have account yet?{' '}
                    <button 
                      onClick={onCreateAccount}
                      className="font-['Poppins:SemiBold',sans-serif] text-[12px] text-black dark:text-white cursor-pointer hover:underline"
                    >
                      Create Account
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
