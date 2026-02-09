const imgNotch = "https://www.figma.com/api/mcp/asset/ee2a526a-538d-4916-92d6-2e0ff6846f5f";
const imgRightSide = "https://www.figma.com/api/mcp/asset/55d3e1b0-b3df-4c65-a4f5-b39410a602db";
const imgIcon1 = "https://www.figma.com/api/mcp/asset/3350b0c3-3072-4ea6-86d0-37a67f8115f8";
const imgEye = "https://www.figma.com/api/mcp/asset/e1e0e2ad-5130-408c-8bb0-aa43e9b978f1";
const imgEmail = "https://www.figma.com/api/mcp/asset/827cfffd-a921-435f-978f-ffaf94e23b3c";

function StatusBarIPhone({ className }: { className?: string }) {
  return (
    <div className={className || ""} data-name="StatusBar / iPhone 13" data-node-id="1:64">
      <div className="h-[47px] relative w-[390px]" data-name="Dark Mode=False, Type=Default" data-node-id="1:65">
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

export default function LoginScreen() {
  return (
    <div className="bg-white relative size-full" data-name="Login" data-node-id="1:2487">
      <a className="absolute content-stretch cursor-pointer flex items-start left-[51px] p-[10px] top-[724px]" data-node-id="1:2489">
        <p className="font-['Poppins:Regular',sans-serif] leading-[0] not-italic relative shrink-0 text-[0px] text-[10px] text-black text-left" data-node-id="1:2490">
          <span className="leading-[normal] text-[rgba(0,0,0,0.6)]">{`Doesn't have account on dicover? `}</span>
          <span className="font-['Poppins:SemiBold',sans-serif] leading-[normal]">Create Account</span>
        </p>
      </a>
      <div className="absolute content-stretch flex flex-col gap-[13px] items-center left-[33px] top-[80px] w-[323px]" data-node-id="1:2491">
        <div className="relative shrink-0 size-[114px]" data-name="icon 1" data-node-id="1:2492">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img alt="" className="absolute left-[-22.5%] max-w-none size-[145%] top-[-13.75%]" src={imgIcon1} />
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[30px] items-center relative shrink-0 w-full" data-node-id="1:2493">
          <div className="content-stretch flex flex-col items-center relative shrink-0" data-node-id="1:2494">
            <div className="content-stretch flex flex-col items-center justify-center leading-[normal] not-italic relative shrink-0 text-center" data-node-id="1:2495">
              <p className="font-['Poppins:SemiBold',sans-serif] relative shrink-0 text-[22px] text-black" data-node-id="1:2496">
                Welcome to TravelLens
              </p>
              <p className="font-['Poppins:Regular',sans-serif] relative shrink-0 text-[12px] text-[rgba(0,0,0,0.8)]" data-node-id="1:2497">
                Please choose your login option below
              </p>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-[323px]" data-node-id="1:2498">
            <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0" data-node-id="1:2499">
              <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0" data-node-id="1:2500">
                <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0" data-name="email" data-node-id="1:2501">
                  <p className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[12px] text-[rgba(0,0,0,0.6)]" data-node-id="1:2502">
                    Email
                  </p>
                  <div className="border border-[rgba(0,0,0,0.1)] border-solid content-stretch flex h-[52px] items-center pl-[15px] py-[10px] relative rounded-[15px] shrink-0 w-[323px]" data-node-id="1:2503">
                    <p className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[10px] text-[rgba(0,0,0,0.6)]" data-node-id="1:2504">{`Enter your  email address`}</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0" data-name="email" data-node-id="1:2505">
                  <p className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[12px] text-[rgba(0,0,0,0.6)]" data-node-id="1:2506">
                    Password
                  </p>
                  <div className="border border-[rgba(0,0,0,0.1)] border-solid content-stretch flex h-[52px] items-center px-[15px] py-[10px] relative rounded-[15px] shrink-0 w-[323px]" data-node-id="1:2507">
                    <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-h-px min-w-px relative" data-node-id="1:2508">
                      <p className="font-['Poppins:Regular','Noto_Sans_Khmer:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[10px] text-[rgba(0,0,0,0.6)]" data-node-id="1:2509">
                        Enter your password
                      </p>
                      <div className="relative shrink-0 size-[19px]" data-name="eye" data-node-id="1:2510">
                        <img alt="" className="block max-w-none size-full" src={imgEye} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <a className="block cursor-pointer font-['Poppins:Regular',sans-serif] leading-[0] min-w-full not-italic relative shrink-0 text-[#0061d2] text-[12px] text-right w-[min-content]" data-node-id="1:2512">
                <p className="[text-decoration-skip-ink:none] decoration-solid leading-[normal] underline whitespace-pre-wrap">Forgot password?</p>
              </a>
              <div className="bg-[#0fa3e2] content-stretch flex items-center justify-center px-[20px] py-[17px] relative rounded-[15px] shrink-0 w-full" data-name="button" data-node-id="1:2513">
                <p className="flex-[1_0_0] font-['Poppins:Medium',sans-serif] leading-[18px] min-h-px min-w-px not-italic relative text-[14px] text-center text-white tracking-[-0.165px] whitespace-pre-wrap" data-node-id="I1:2513;4:228">
                  Next
                </p>
              </div>
            </div>
            <div className="content-stretch flex items-center justify-center relative shrink-0 w-full" data-node-id="1:2514">
              <div className="bg-[rgba(0,0,0,0.1)] flex-[1_0_0] h-px min-h-px min-w-px" data-node-id="1:2515" />
              <p className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[12px] text-[rgba(0,0,0,0.6)] text-center w-[103px] whitespace-pre-wrap" data-node-id="1:2516">
                Or login with
              </p>
              <div className="bg-[rgba(0,0,0,0.1)] flex-[1_0_0] h-px min-h-px min-w-px" data-node-id="1:2517" />
            </div>
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="1:2518">
              <div className="content-stretch flex gap-[8px] h-[52px] items-start relative shrink-0 w-full" data-node-id="1:2519">
                <div className="bg-white border border-[rgba(0,0,0,0.1)] border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-center min-h-px min-w-px p-[15px] relative rounded-[3px]" data-name="login method" data-node-id="1:2520">
                  <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I1:2520;4:644">
                    <div className="relative shrink-0 size-[20px]" data-name="Email" data-node-id="I1:2520;4:645">
                      <img alt="" className="block max-w-none size-full" src={imgEmail} />
                    </div>
                    <p className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[12px] text-black text-center" data-node-id="I1:2520;4:659">
                      Continue with Derleng account
                    </p>
                  </div>
                </div>
                <div className="bg-white border border-[rgba(0,0,0,0.1)] border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-center min-h-px min-w-px p-[15px] relative rounded-[3px]" data-name="login method" data-node-id="1:2521">
                  <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I1:2521;4:644">
                    <div className="relative shrink-0 size-[20px]" data-name="Email" data-node-id="I1:2521;4:645">
                      <img alt="" className="block max-w-none size-full" src={imgEmail} />
                    </div>
                    <p className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[12px] text-black text-center" data-node-id="I1:2521;4:659">
                      Continue with Derleng account
                    </p>
                  </div>
                </div>
                <div className="bg-white border border-[rgba(0,0,0,0.1)] border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-center min-h-px min-w-px p-[15px] relative rounded-[3px]" data-name="login method" data-node-id="1:2522">
                  <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I1:2522;4:644">
                    <div className="relative shrink-0 size-[20px]" data-name="Email" data-node-id="I1:2522;4:645">
                      <img alt="" className="block max-w-none size-full" src={imgEmail} />
                    </div>
                    <p className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[12px] text-black text-center" data-node-id="I1:2522;4:659">
                      Continue with Derleng account
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <StatusBarIPhone className="-translate-x-1/2 absolute h-[47px] left-[calc(50%-0.5px)] overflow-clip top-0 w-[390px]" />
    </div>
  );
}
