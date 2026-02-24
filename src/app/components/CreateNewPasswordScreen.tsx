import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { updatePassword } from 'firebase/auth';
import { auth } from '@/app/config/firebase';

interface CreateNewPasswordScreenProps {
  onBack?: () => void;
  onPasswordCreated?: () => void;
}

export default function CreateNewPasswordScreen({ onBack, onPasswordCreated }: CreateNewPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleCreatePassword = async () => {
    // Validate password
    const validationError = validatePassword(password);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('No authenticated user found');
        setLoading(false);
        return;
      }

      await updatePassword(user, password);
      toast.success('Password updated successfully!');
      onPasswordCreated?.();
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please log in again to update your password');
      } else {
        toast.error(error.message || 'Failed to update password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 relative size-full">
      <div className="relative mx-auto w-full max-w-[390px] h-full">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute h-[46px] left-[24px] top-[53px] w-[25px] cursor-pointer"
        >
          <img alt="Back" className="block max-w-none size-full dark:invert" src={imgAngleLeft} />
        </button>

        {/* Main Content */}
        <div className="absolute flex flex-col gap-[25px] items-start left-[26px] top-[164px]">
          {/* Header Section */}
          <div className="flex flex-col gap-[20px] items-start relative">
            {/* App Icon */}
            <div className="relative size-[114px]">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img alt="TravelLens Logo" className="absolute left-[-22.5%] max-w-none size-[145%] top-[-13.75%]" src={imgIcon1} />
              </div>
            </div>

            {/* Title and Subtitle */}
            <div className="flex flex-col gap-[5px] items-start leading-[normal] not-italic relative tracking-[-0.165px] w-[323px]">
              <p className="font-['Poppins',sans-serif] font-semibold relative text-[18px] text-black dark:text-white">
                Create new password
              </p>
              <p className="font-['Poppins',sans-serif] min-w-full relative text-[12px] text-[rgba(0,0,0,0.6)] dark:text-gray-400 w-[min-content] whitespace-pre-wrap">
                Keep your account secure by creating a strong password
              </p>
            </div>
          </div>

          {/* Password Input Section */}
          <div className="flex flex-col gap-[25px] items-start relative">
            <div className="flex flex-col gap-[15px] items-start relative w-[323px]">
              <div className="flex flex-col gap-[10px] items-start relative w-full">
                {/* Password Input with Eye Toggle */}
                <div className="border border-[rgba(0,0,0,0.1)] dark:border-gray-700 border-solid flex h-[52px] items-center justify-between px-[15px] py-[10px] relative rounded-[15px] w-full dark:bg-gray-800">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="flex-1 outline-none font-['Poppins',sans-serif] text-[14px] text-black dark:text-white placeholder:text-[rgba(0,0,0,0.3)] dark:placeholder:text-gray-500 bg-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreatePassword();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="relative size-[19px] cursor-pointer flex-shrink-0"
                  >
                    {showPassword ? (
                      <Eye size={19} className="text-black dark:text-white" />
                    ) : (
                      <EyeOff size={19} className="text-black dark:text-white" />
                    )}
                  </button>
                </div>

                {/* Password Requirement Text */}
                <p className="font-['Poppins',sans-serif] leading-[normal] not-italic relative text-[10px] text-[rgba(0,0,0,0.4)] dark:text-gray-500">
                  Your password should be at least contain upper character
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleCreatePassword}
              disabled={loading || !password}
              className="bg-[#0fa3e2] hover:bg-[#0c8ec7] active:bg-[#0a7aaa] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center px-[20px] py-[17px] relative rounded-[15px] w-full"
            >
              {loading ? (
                <div className="size-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <p className="flex-[1_0_0] font-['Poppins',sans-serif] font-medium leading-[18px] not-italic text-[14px] text-center text-white tracking-[-0.165px]">
                  Create new password
                </p>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
