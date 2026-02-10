import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { sendPasswordReset } from '@/app/services/authService';

const imgNotch = "https://www.figma.com/api/mcp/asset/f253bd1d-f8f7-4e3e-a85c-75dc10cd4849";
const imgRightSide = "https://www.figma.com/api/mcp/asset/dd4c1885-54a0-4e58-8757-354edd73ec7a";
const imgIcon1 = "https://www.figma.com/api/mcp/asset/e98ba141-d4aa-4f2b-84c3-0c2bca3e7684";
const imgAngleLeft = "https://www.figma.com/api/mcp/asset/db9dbf19-8dfd-49d3-bfa3-8f7589dc2555";

// Common country codes
const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+60', country: 'MY', flag: '🇲🇾' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+82', country: 'KR', flag: '🇰🇷' },
  { code: '+84', country: 'VN', flag: '🇻🇳' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+855', country: 'KH', flag: '🇰🇭' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
];

function StatusBarIPhone({ className }: { className?: string }) {
  return (
    <div className={className || ""} data-name="StatusBar / iPhone 13" data-node-id="1:64">
      <div className="h-[47px] relative w-full" data-name="Dark Mode=False, Type=Default" data-node-id="1:65">
        <div className="-translate-x-1/2 absolute h-[32px] left-1/2 top-[-2px] w-[164px]" data-name="Notch" data-node-id="1:66">
          <img alt="" className="block max-w-none size-full" src={imgNotch} />
        </div>
        <div className="-translate-x-1/2 absolute contents left-[calc(16.67%-11px)] top-[14px]" data-name="Left Side" data-node-id="1:68">
          <div className="-translate-x-1/2 absolute h-[21px] left-[calc(16.67%-11px)] rounded-[24px] top-[14px] w-[54px]" data-name="_StatusBar-time" data-node-id="1:69">
            <p className="-translate-x-1/2 absolute font-['SF_Pro_Text:Semibold',sans-serif] h-[20px] leading-[22px] left-[27px] not-italic text-[17px] text-black text-center top-px tracking-[-0.408px] w-[54px] whitespace-pre-wrap" data-node-id="I1:69;839:7100">
              9:41
            </p>
          </div>
        </div>
        <div className="-translate-x-1/2 absolute h-[13px] left-[calc(83.33%-0.3px)] top-[19px] w-[77.401px]" data-name="Right Side" data-node-id="1:70">
          <img alt="" className="block max-w-none size-full" src={imgRightSide} />
        </div>
      </div>
    </div>
  );
}

interface ForgetPasswordScreenProps {
  onBack?: () => void;
  onPhoneVerification?: (phone: string, countryCode: string) => void;
}

export default function ForgetPasswordScreen({ onBack, onPhoneVerification }: ForgetPasswordScreenProps) {
  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+855');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Check if phone auth is enabled (requires Blaze plan)
  const phoneAuthEnabled = false; // Set to true after upgrading to Blaze plan

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showCountryDropdown) {
        setShowCountryDropdown(false);
      }
    };

    if (showCountryDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showCountryDropdown]);

  const handleSendResetCode = async () => {
    if (resetMethod === 'email') {
      if (!email) {
        toast.error('Please enter your email address');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Please enter a valid email address');
        return;
      }

      setLoading(true);

      // Send password reset email
      const resetResult = await sendPasswordReset(email);
      setLoading(false);

      if (resetResult.success) {
        toast.success('If this email is registered, a password reset link will be sent. Please check your inbox.');
        setTimeout(() => {
          if (onBack) onBack();
        }, 2000);
      } else {
        toast.error('Failed to send reset email. Please try again.');
      }
    } else {
      // Phone number reset
      if (!phoneAuthEnabled) {
        toast.error('Phone authentication requires Firebase Blaze plan. Please use email reset.');
        return;
      }
      
      if (!phone) {
        toast.error('Please enter your phone number');
        return;
      }

      // Validate phone number (basic check)
      if (phone.length < 6) {
        toast.error('Please enter a valid phone number');
        return;
      }

      // Navigate to phone verification screen
      if (onPhoneVerification) {
        onPhoneVerification(phone, countryCode);
      } else {
        toast.error('Phone verification not configured');
      }
    }
  };

  return (
    <div className="bg-white relative size-full" data-name="Forgot password- Reset password" data-node-id="1:2523">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0fa3e2]"></div>
        </div>
      )}
      <div className="relative mx-auto w-full max-w-[390px] h-full">
        <button 
          onClick={onBack}
          className="absolute cursor-pointer h-[46px] left-[24px] top-[53px] w-[25px] z-10" 
          data-name="angle-left" 
          data-node-id="1:2525"
        >
          <img alt="Back" className="block max-w-none size-full" src={imgAngleLeft} />
        </button>
        
        <div className="absolute content-stretch flex flex-col gap-[25px] items-start left-[26px] top-[164px]" data-node-id="1:2527">
        <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0" data-node-id="1:2528">
          <div className="relative shrink-0 size-[114px]" data-name="icon 1" data-node-id="1:2529">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img alt="" className="absolute left-[-22.5%] max-w-none size-[145%] top-[-10.75%]" src={imgIcon1} />
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[5px] items-start leading-[normal] not-italic relative shrink-0 tracking-[-0.165px] w-[323px]" data-node-id="1:2530">
            <p className="font-['Poppins:SemiBold',sans-serif] relative shrink-0 text-[18px] text-black" data-node-id="1:2531">
              Forget password
            </p>
            <p className="font-['Poppins:Regular',sans-serif] min-w-full relative shrink-0 text-[12px] text-[rgba(0,0,0,0.6)] w-[min-content] whitespace-pre-wrap" data-node-id="1:2532">
              Enter your email or phone we will send the verification code to reset your password
            </p>
          </div>
        </div>
        
        <div className="content-stretch flex flex-col gap-[25px] items-start relative shrink-0" data-name="reset-code-method" data-node-id="1:2533">
          <div className="content-stretch flex flex-col gap-[15px] items-start relative shrink-0 w-[323px]" data-name="email" data-node-id="1:2534">
            <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-node-id="1:2536">
              {resetMethod === 'email' ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="border border-[rgba(0,0,0,0.1)] border-solid content-stretch flex h-[52px] items-center pl-[15px] py-[10px] relative rounded-[15px] shrink-0 w-full font-['Poppins:Regular',sans-serif] text-[12px] text-black outline-none focus:border-[#0fa3e2]"
                  data-node-id="1:2537"
                />
              ) : (
                <div className="relative w-full">
                  <div className="border border-[rgba(0,0,0,0.1)] border-solid content-stretch flex h-[52px] items-center relative rounded-[15px] shrink-0 w-full" data-node-id="1:2537">
                    {/* Country Code Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCountryDropdown(!showCountryDropdown);
                        }}
                        className="flex items-center gap-2 pl-3 pr-2 h-full border-r border-[rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors min-w-[110px]"
                      >
                        <span className="font-['Poppins:Regular',sans-serif] text-[12px] text-black">
                          {COUNTRY_CODES.find(c => c.code === countryCode)?.country}
                        </span>
                        <span className="font-['Poppins:Regular',sans-serif] text-[12px] text-black">{countryCode}</span>
                        <span className="text-[10px] text-gray-500 ml-auto">▼</span>
                      </button>
                      
                      {/* Dropdown Menu */}
                      {showCountryDropdown && (
                        <div className="absolute top-[calc(100%+4px)] left-0 bg-white border border-[rgba(0,0,0,0.1)] rounded-[10px] shadow-lg z-50 w-[180px] max-h-[250px] overflow-y-auto">
                          {COUNTRY_CODES.map((item) => (
                            <button
                              key={item.code}
                              type="button"
                              onClick={() => {
                                setCountryCode(item.code);
                                setShowCountryDropdown(false);
                              }}
                              className={`w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left ${
                                countryCode === item.code ? 'bg-blue-50' : ''
                              }`}
                            >
                              <span className="text-[16px]">{item.flag}</span>
                              <span className="font-['Poppins:Medium',sans-serif] text-[12px] text-black flex-1">{item.code}</span>
                              <span className="font-['Poppins:Regular',sans-serif] text-[10px] text-gray-500">{item.country}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Phone Input */}
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="123 456 789"
                      className="flex-1 h-full px-3 font-['Poppins:Regular',sans-serif] text-[12px] text-black outline-none bg-transparent"
                    />
                  </div>
                </div>
              )}
              
              {phoneAuthEnabled && (
                <button
                  onClick={() => setResetMethod(resetMethod === 'email' ? 'phone' : 'email')}
                  className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0061d2] text-[10px] cursor-pointer hover:underline"
                  data-node-id="1:2539"
                >
                  {resetMethod === 'email' ? 'Reset with phone number' : 'Reset with email'}
                </button>
              )}
            </div>
          </div>
          
          <button
            onClick={handleSendResetCode}
            disabled={loading}
            className={`content-stretch flex items-center justify-center px-[20px] py-[17px] relative rounded-[15px] shrink-0 w-full transition-colors ${
              loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#0fa3e2] cursor-pointer hover:bg-[#0d8ec7]'
            }`}
            data-name="button"
            data-node-id="1:2551"
          >
            <p className="flex-[1_0_0] font-['Poppins:Medium',sans-serif] leading-[18px] min-h-px min-w-px not-italic relative text-[14px] text-center text-white tracking-[-0.165px] whitespace-pre-wrap" data-node-id="I1:2551;4:228">
              {loading ? 'Sending...' : 'Next'}
            </p>
          </button>
        </div>
        </div>
        
        <StatusBarIPhone className="absolute h-[47px] left-0 right-0 overflow-clip top-0" />
      </div>
    </div>
  );
}
