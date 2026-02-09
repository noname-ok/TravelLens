import { useState } from 'react';
import { toast } from 'sonner';
import { updatePassword } from 'firebase/auth';
import { auth } from '@/app/config/firebase';

const imgNotch = "https://www.figma.com/api/mcp/asset/d15057c3-f9ab-4f2d-926a-87f0b3686cd1";
const imgRightSide = "https://www.figma.com/api/mcp/asset/697478ad-25fc-4dc2-b2d6-778d9b5ec6f1";
const imgIcon1 = "https://www.figma.com/api/mcp/asset/9f1788a8-11dc-47ec-9768-cbe920deca16";
const imgAngleLeft = "https://www.figma.com/api/mcp/asset/9c3356ba-5e4f-4bf4-aea9-99cc828a0941";
const imgEye = "https://www.figma.com/api/mcp/asset/d7d3f672-f2dd-4bb5-b76c-09daffc97115";

function StatusBarIPhone({ className }: { className?: string }) {
  return (
    <div className={className || ""}>
      <div className="h-[47px] relative w-[390px]">
        <div className="-translate-x-1/2 absolute h-[32px] left-1/2 top-[-2px] w-[164px]">
          <img alt="" className="block max-w-none size-full" src={imgNotch} />
        </div>
        <div className="-translate-x-1/2 absolute contents left-[calc(16.67%-11px)] top-[14px]">
          <div className="-translate-x-1/2 absolute h-[21px] left-[calc(16.67%-11px)] rounded-[24px] top-[14px] w-[54px]">
            <p className="-translate-x-1/2 absolute font-['SF_Pro_Text:Semibold',sans-serif] h-[20px] leading-[22px] left-[27px] not-italic text-[17px] text-black text-center top-px tracking-[-0.408px] w-[54px] whitespace-pre-wrap">
              9:41
            </p>
          </div>
        </div>
        <div className="-translate-x-1/2 absolute h-[13px] left-[calc(83.33%-0.3px)] top-[19px] w-[77.401px]">
          <img alt="" className="block max-w-none size-full" src={imgRightSide} />
        </div>
      </div>
    </div>
  );
}

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
    <div className="bg-white relative size-full">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute h-[46px] left-[24px] top-[53px] w-[25px] cursor-pointer"
      >
        <img alt="Back" className="block max-w-none size-full" src={imgAngleLeft} />
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
            <p className="font-['Poppins',sans-serif] font-semibold relative text-[18px] text-black">
              Create new password
            </p>
            <p className="font-['Poppins',sans-serif] min-w-full relative text-[12px] text-[rgba(0,0,0,0.6)] w-[min-content] whitespace-pre-wrap">
              Keep your account secure by creating a strong password
            </p>
          </div>
        </div>

        {/* Password Input Section */}
        <div className="flex flex-col gap-[25px] items-start relative">
          <div className="flex flex-col gap-[15px] items-start relative w-[323px]">
            <div className="flex flex-col gap-[10px] items-start relative w-full">
              {/* Password Input with Eye Toggle */}
              <div className="border border-[rgba(0,0,0,0.1)] border-solid flex h-[52px] items-center justify-between px-[15px] py-[10px] relative rounded-[15px] w-full">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="flex-1 outline-none font-['Poppins',sans-serif] text-[14px] text-black placeholder:text-[rgba(0,0,0,0.3)]"
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
                  <img alt={showPassword ? "Hide password" : "Show password"} className="block max-w-none size-full" src={imgEye} />
                </button>
              </div>

              {/* Password Requirement Text */}
              <p className="font-['Poppins',sans-serif] leading-[normal] not-italic relative text-[10px] text-[rgba(0,0,0,0.4)]">
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

      {/* Status Bar */}
      <StatusBarIPhone className="-translate-x-1/2 absolute h-[47px] left-[calc(50%-0.5px)] overflow-clip top-0 w-[390px]" />
    </div>
  );
}
