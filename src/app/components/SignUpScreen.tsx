import { useState, useEffect } from 'react';

const imgVector = "https://www.figma.com/api/mcp/asset/90336c2f-f3a7-4d22-a8f2-66f98df05882";
const imgAngleLeft = "https://www.figma.com/api/mcp/asset/1a3f9342-d6e1-494e-8825-82e9199de542";
const imgCaretDown = "https://www.figma.com/api/mcp/asset/b396ffcd-cced-4a3d-9c24-71435feaeac8";
const imgEye = "https://www.figma.com/api/mcp/asset/a6af9c4a-b252-47b0-aecc-6f4ebecbc5cd";

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

interface SignUpScreenProps {
  onBack?: () => void;
  onSignUp?: (data: SignUpFormData) => void;
}

export interface SignUpFormData {
  firstName: string;
  lastName: string;
  countryCode: string;
  phone: string;
  age: string;
  email: string;
  password: string;
  acceptTerms: boolean;
}

export default function SignUpScreen({ onBack, onSignUp }: SignUpScreenProps) {
  const [formData, setFormData] = useState<SignUpFormData>({
    firstName: '',
    lastName: '',
    countryCode: '+855',
    phone: '',
    age: '',
    email: '',
    password: '',
    acceptTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

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

  const handleInputChange = (field: keyof SignUpFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (onSignUp) {
      onSignUp(formData);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 relative size-full overflow-y-auto" data-name="Create account" data-node-id="1:2592">
      <div className="relative mx-auto w-full max-w-[390px] h-full">
        <button 
          onClick={onBack}
          className="absolute h-[46px] left-[24px] top-[53px] w-[25px] cursor-pointer z-10" 
          data-name="angle-left" 
          data-node-id="1:2643"
        >
          <img alt="Back" className="block max-w-none size-full dark:invert" src={imgAngleLeft} />
        </button>
        
        <div className="absolute content-stretch flex flex-col gap-[5px] items-start leading-[normal] left-[26px] not-italic top-[110px] tracking-[-0.165px] w-[323px]" data-node-id="1:2593">
          <p className="font-['Poppins:SemiBold',sans-serif] relative shrink-0 text-[18px] text-black dark:text-white" data-node-id="1:2594">
            Create account
          </p>
          <p className="font-['Poppins:Regular',sans-serif] min-w-full relative shrink-0 text-[12px] text-[rgba(0,0,0,0.8)] dark:text-gray-400 w-[min-content] whitespace-pre-wrap" data-node-id="1:2595">
            Get the best out of TravelLens by creating an account
          </p>
        </div>
        
        <div className="absolute content-stretch flex flex-col gap-[15px] items-start left-[26px] top-[173px] pb-20" data-name="Profile register file" data-node-id="1:2596">
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-[323px]" data-node-id="1:2597">
            {/* First Name */}
            <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full" data-name="name" data-node-id="1:2598">
              <label className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[10px] text-[rgba(0,0,0,0.8)] dark:text-gray-400" data-node-id="1:2599">
                First name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="John"
                className="border border-[rgba(0,0,0,0.1)] dark:border-gray-700 border-solid content-stretch flex h-[52px] items-center pl-[15px] py-[10px] relative rounded-[15px] shrink-0 w-full font-['Poppins:Regular',sans-serif] text-[12px] text-black dark:text-white dark:bg-gray-800 outline-none focus:border-[#0fa3e2]"
                data-node-id="1:2600"
              />
            </div>
            
            {/* Last Name */}
            <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full" data-name="name" data-node-id="1:2602">
              <label className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[10px] text-[rgba(0,0,0,0.8)] dark:text-gray-400" data-node-id="1:2603">
                Last name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Doe"
                className="border border-[rgba(0,0,0,0.1)] dark:border-gray-700 border-solid content-stretch flex h-[52px] items-center pl-[15px] py-[10px] relative rounded-[15px] shrink-0 w-full font-['Poppins:Regular',sans-serif] text-[12px] text-black dark:text-white dark:bg-gray-800 outline-none focus:border-[#0fa3e2]"
                data-node-id="1:2604"
              />
            </div>
            
            {/* Phone */}
            <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full" data-name="phone" data-node-id="1:2606">
              <label className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[10px] text-[rgba(0,0,0,0.8)] dark:text-gray-400" data-node-id="1:2607">
                Phone
              </label>
              <div className="content-stretch flex gap-[5px] items-start relative shrink-0 w-full" data-node-id="1:2608">
                {/* Country Code Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCountryDropdown(!showCountryDropdown);
                    }}
                    className="border border-[rgba(0,0,0,0.1)] dark:border-gray-700 border-solid flex h-[52px] items-center gap-2 pl-[15px] pr-[10px] py-[10px] rounded-[15px] min-w-[120px] hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800 transition-colors"
                    data-node-id="1:2609"
                  >
                    <span className="font-['Poppins:Regular',sans-serif] text-[12px] text-black dark:text-white">
                      {COUNTRY_CODES.find(c => c.code === formData.countryCode)?.country}
                    </span>
                    <span className="font-['Poppins:Regular',sans-serif] text-[12px] text-black dark:text-white">{formData.countryCode}</span>
                    <div className="h-[18px] w-[19px] ml-auto shrink-0" data-name="caret-down" data-node-id="1:2611">
                      <img alt="" className="block max-w-none size-full dark:invert" src={imgCaretDown} />
                    </div>
                  </button>
                  
                  {showCountryDropdown && (
                    <div className="absolute top-[calc(100%+4px)] left-0 bg-white dark:bg-gray-800 border border-[rgba(0,0,0,0.1)] dark:border-gray-700 rounded-[10px] shadow-lg z-50 w-[180px] max-h-[250px] overflow-y-auto">
                      {COUNTRY_CODES.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => {
                            handleInputChange('countryCode', item.code);
                            setShowCountryDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${
                            formData.countryCode === item.code ? 'bg-blue-50 dark:bg-blue-900' : ''
                          }`}
                        >
                          <span className="text-[16px]">{item.flag}</span>
                          <span className="font-['Poppins:Medium',sans-serif] text-[12px] text-black dark:text-white flex-1">{item.code}</span>
                          <span className="font-['Poppins:Regular',sans-serif] text-[10px] text-gray-500 dark:text-gray-400">{item.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Phone Input */}
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
                  placeholder="123 456 789"
                  className="border border-[rgba(0,0,0,0.1)] dark:border-gray-700 border-solid content-stretch flex flex-[1_0_0] h-[52px] items-center min-h-px min-w-px pl-[15px] py-[10px] relative rounded-[15px] font-['Poppins:Regular',sans-serif] text-[12px] text-black dark:text-white dark:bg-gray-800 outline-none focus:border-[#0fa3e2]"
                  data-node-id="1:2613"
                />
              </div>
            </div>
            
            {/* Age */}
            <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full" data-name="note" data-node-id="1:2615">
              <label className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[10px] text-[rgba(0,0,0,0.8)] dark:text-gray-400" data-node-id="1:2616">
                Age
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                placeholder="30"
                className="border border-[rgba(0,0,0,0.1)] dark:border-gray-700 border-solid content-stretch flex h-[52px] items-center pl-[15px] pr-[10px] py-[10px] relative rounded-[15px] shrink-0 w-full font-['Poppins:Regular',sans-serif] text-[12px] text-black dark:text-white dark:bg-gray-800 outline-none focus:border-[#0fa3e2]"
                data-node-id="1:2617"
              />
            </div>
            
            {/* Email */}
            <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full" data-name="phone" data-node-id="1:2619">
              <label className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[10px] text-[rgba(0,0,0,0.8)] dark:text-gray-400" data-node-id="1:2620">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="john.ux@gmail.com"
                className="border border-[rgba(0,0,0,0.1)] dark:border-gray-700 border-solid content-stretch flex h-[52px] items-center pl-[15px] py-[10px] relative rounded-[15px] shrink-0 w-full font-['Poppins:Regular',sans-serif] text-[12px] text-black dark:text-white dark:bg-gray-800 outline-none focus:border-[#0fa3e2]"
                data-node-id="1:2621"
              />
            </div>
            
            {/* Password */}
            <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full" data-name="note" data-node-id="1:2623">
              <label className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[10px] text-[rgba(0,0,0,0.8)] dark:text-gray-400" data-node-id="1:2624">
                Password
              </label>
              <div className="border border-[rgba(0,0,0,0.1)] dark:border-gray-700 border-solid content-stretch flex h-[52px] items-center justify-between px-[15px] py-[10px] relative rounded-[15px] shrink-0 w-full dark:bg-gray-800" data-node-id="1:2625">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 font-['Poppins:Regular',sans-serif] text-[12px] text-black dark:text-white outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="relative shrink-0 size-[19px] dark:invert"
                  data-name="eye"
                  data-node-id="1:2635"
                >
                  <img alt="Toggle password visibility" className="block max-w-none size-full" src={imgEye} />
                </button>
              </div>
            </div>
            
            {/* Terms and Conditions */}
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-[323px]" data-node-id="1:2637">
              <button
                type="button"
                onClick={() => handleInputChange('acceptTerms', !formData.acceptTerms)}
                className={`border border-[rgba(0,0,0,0.3)] dark:border-gray-600 border-solid content-stretch flex flex-col items-center justify-center px-[4px] py-[6px] relative rounded-[3px] shrink-0 w-[19px] h-[20px] cursor-pointer ${
                  formData.acceptTerms ? 'bg-[#0fa3e2]' : 'bg-white dark:bg-gray-800'
                }`}
              >
                {formData.acceptTerms && (
                  <div className="h-[8px] relative shrink-0 w-[11px]" data-name="Vector">
                    <img alt="" className="block max-w-none size-full" src={imgVector} />
                  </div>
                )}
              </button>
              <p className="[text-decoration-skip-ink:none] decoration-solid font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[11px] text-black dark:text-white underline cursor-pointer" data-node-id="1:2639">
                I accept term and condition
              </p>
            </div>
          </div>
          
          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!formData.acceptTerms}
            className={`content-stretch flex items-center justify-center px-[20px] py-[17px] relative rounded-[15px] shrink-0 w-full transition-colors ${
              formData.acceptTerms ? 'bg-[#0fa3e2] cursor-pointer hover:bg-[#0d8ec7]' : 'bg-gray-300 cursor-not-allowed'
            }`}
            data-name="button"
            data-node-id="1:2640"
          >
            <p className="flex-[1_0_0] font-['Poppins:Medium',sans-serif] leading-[18px] min-h-px min-w-px not-italic relative text-[14px] text-center text-white tracking-[-0.165px] whitespace-pre-wrap">
              Create Account
            </p>
          </button>
        </div>
        
        <button
          onClick={onBack}
          className="absolute block cursor-pointer font-['Poppins:Regular',sans-serif] leading-[0] left-[99px] not-italic text-[0px] text-black dark:text-white top-[764px] whitespace-nowrap hover:opacity-80"
          data-node-id="1:2641"
        >
          <p className="text-[10px]">
            <span className="leading-[normal] text-[rgba(0,0,0,0.6)] dark:text-gray-400">{`Already have an account? `}</span>
            <span className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic dark:text-white">Go back</span>
          </p>
        </button>
      </div>
    </div>
  );
}
