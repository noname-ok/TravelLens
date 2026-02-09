import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { initializeRecaptcha, sendPhoneVerificationCode, verifyPhoneCode } from '@/app/services/authService';
import { RecaptchaVerifier } from 'firebase/auth';

const imgNotch = "https://www.figma.com/api/mcp/asset/f253bd1d-f8f7-4e3e-a85c-75dc10cd4849";
const imgRightSide = "https://www.figma.com/api/mcp/asset/dd4c1885-54a0-4e58-8757-354edd73ec7a";
const imgIcon1 = "https://www.figma.com/api/mcp/asset/e98ba141-d4aa-4f2b-84c3-0c2bca3e7684";
const imgAngleLeft = "https://www.figma.com/api/mcp/asset/db9dbf19-8dfd-49d3-bfa3-8f7589dc2555";

function StatusBarIPhone({ className }: { className?: string }) {
  return (
    <div className={className || ""} data-name="StatusBar / iPhone 13">
      <div className="h-[47px] relative w-[390px]" data-name="Dark Mode=False, Type=Default">
        <div className="-translate-x-1/2 absolute h-[32px] left-1/2 top-[-2px] w-[164px]" data-name="Notch">
          <img alt="" className="block max-w-none size-full" src={imgNotch} />
        </div>
        <div className="-translate-x-1/2 absolute contents left-[calc(16.67%-11px)] top-[14px]" data-name="Left Side">
          <div className="-translate-x-1/2 absolute h-[21px] left-[calc(16.67%-11px)] rounded-[24px] top-[14px] w-[54px]" data-name="_StatusBar-time">
            <p className="-translate-x-1/2 absolute font-['SF_Pro_Text:Semibold',sans-serif] h-[20px] leading-[22px] left-[27px] not-italic text-[17px] text-black text-center top-px tracking-[-0.408px] w-[54px] whitespace-pre-wrap">
              9:41
            </p>
          </div>
        </div>
        <div className="-translate-x-1/2 absolute h-[13px] left-[calc(83.33%-0.3px)] top-[19px] w-[77.401px]" data-name="Right Side">
          <img alt="" className="block max-w-none size-full" src={imgRightSide} />
        </div>
      </div>
    </div>
  );
}

interface PhoneVerificationScreenProps {
  phoneNumber: string;
  countryCode: string;
  onVerified: () => void;
  onBack: () => void;
}

export default function PhoneVerificationScreen({ 
  phoneNumber, 
  countryCode, 
  onVerified, 
  onBack 
}: PhoneVerificationScreenProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [timer, setTimer] = useState(60);

  // Initialize reCAPTCHA on mount
  useEffect(() => {
    const result = initializeRecaptcha('recaptcha-container');
    if (result.success && result.verifier) {
      setRecaptchaVerifier(result.verifier);
    } else {
      toast.error('Failed to initialize reCAPTCHA. Please refresh the page.');
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (codeSent && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [codeSent, timer]);

  const handleSendCode = async () => {
    if (!recaptchaVerifier) {
      toast.error('reCAPTCHA not initialized. Please refresh the page.');
      return;
    }

    setLoading(true);
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    
    const result = await sendPhoneVerificationCode(fullPhoneNumber, recaptchaVerifier);
    setLoading(false);

    if (result.success) {
      toast.success('Verification code sent to your phone!');
      setCodeSent(true);
      setTimer(60);
    } else {
      toast.error(result.error || 'Failed to send code. Please try again.');
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    const result = await verifyPhoneCode(verificationCode);
    setLoading(false);

    if (result.success) {
      toast.success('Phone verified successfully!');
      setTimeout(() => {
        onVerified();
      }, 1000);
    } else {
      toast.error(result.error || 'Invalid code. Please try again.');
      setVerificationCode('');
    }
  };

  return (
    <div className="bg-white relative size-full" data-name="Phone Verification">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0fa3e2]"></div>
        </div>
      )}

      <button 
        onClick={onBack}
        className="absolute cursor-pointer h-[46px] left-[24px] top-[53px] w-[25px] z-10" 
        data-name="angle-left"
      >
        <img alt="Back" className="block max-w-none size-full" src={imgAngleLeft} />
      </button>
      
      <div className="absolute content-stretch flex flex-col gap-[25px] items-start left-[26px] top-[164px]">
        <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0">
          <div className="relative shrink-0 size-[114px]" data-name="icon 1">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img alt="" className="absolute left-[-22.5%] max-w-none size-[145%] top-[-10.75%]" src={imgIcon1} />
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[5px] items-start leading-[normal] not-italic relative shrink-0 tracking-[-0.165px] w-[323px]">
            <p className="font-['Poppins:SemiBold',sans-serif] relative shrink-0 text-[18px] text-black">
              Verify Phone Number
            </p>
            <p className="font-['Poppins:Regular',sans-serif] min-w-full relative shrink-0 text-[12px] text-[rgba(0,0,0,0.6)] w-[min-content] whitespace-pre-wrap">
              {!codeSent 
                ? `We'll send a verification code to ${countryCode} ${phoneNumber}`
                : `Enter the 6-digit code sent to ${countryCode} ${phoneNumber}`
              }
            </p>
          </div>
        </div>
        
        <div className="content-stretch flex flex-col gap-[25px] items-start relative shrink-0 w-[323px]">
          {!codeSent ? (
            <button
              onClick={handleSendCode}
              disabled={loading || !recaptchaVerifier}
              className={`content-stretch flex items-center justify-center px-[20px] py-[17px] relative rounded-[15px] shrink-0 w-full transition-colors ${
                loading || !recaptchaVerifier ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#0fa3e2] cursor-pointer hover:bg-[#0d8ec7]'
              }`}
            >
              <p className="flex-[1_0_0] font-['Poppins:Medium',sans-serif] leading-[18px] min-h-px min-w-px not-italic relative text-[14px] text-center text-white tracking-[-0.165px] whitespace-pre-wrap">
                {loading ? 'Sending Code...' : 'Send Verification Code'}
              </p>
            </button>
          ) : (
            <>
              {/* Verification Code Input */}
              <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full">
                <label className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[12px] text-[rgba(0,0,0,0.6)]">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="border border-[rgba(0,0,0,0.1)] border-solid content-stretch flex h-[52px] items-center pl-[15px] py-[10px] relative rounded-[15px] shrink-0 w-full font-['Poppins:Regular',sans-serif] text-[14px] text-black outline-none focus:border-[#0fa3e2] tracking-[0.5em] text-center"
                />
              </div>

              {/* Verify Button */}
              <button
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                className={`content-stretch flex items-center justify-center px-[20px] py-[17px] relative rounded-[15px] shrink-0 w-full transition-colors ${
                  loading || verificationCode.length !== 6 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#0fa3e2] cursor-pointer hover:bg-[#0d8ec7]'
                }`}
              >
                <p className="flex-[1_0_0] font-['Poppins:Medium',sans-serif] leading-[18px] min-h-px min-w-px not-italic relative text-[14px] text-center text-white tracking-[-0.165px] whitespace-pre-wrap">
                  {loading ? 'Verifying...' : 'Verify Code'}
                </p>
              </button>

              {/* Resend Code */}
              <button
                onClick={handleSendCode}
                disabled={timer > 0 || loading}
                className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0061d2] text-[12px] cursor-pointer hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {timer > 0 ? `Resend code in ${timer}s` : 'Resend verification code'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* reCAPTCHA container (invisible) */}
      <div id="recaptcha-container"></div>
      
      <StatusBarIPhone className="-translate-x-1/2 absolute h-[47px] left-[calc(50%-0.5px)] overflow-clip top-0 w-[390px]" />
    </div>
  );
}
