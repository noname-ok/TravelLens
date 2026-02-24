const imgIcon1 = "https://www.figma.com/api/mcp/asset/d8ce4cba-6cf7-4b7b-9448-e15358a9d6a8";

interface OnboardingScreenProps {
  onNext?: () => void;
}

export default function OnboardingScreen({ onNext }: OnboardingScreenProps) {
  return (
    <div className="bg-[#2c638b] relative size-full">
      <div className="relative mx-auto w-full max-w-[390px] h-full">
        {/* App Icon */}
        <div className="absolute left-[131px] top-[296px] size-[114px]">
          <div className="absolute inset-0 mix-blend-plus-lighter overflow-hidden pointer-events-none">
            <img alt="TravelLens Logo" className="absolute h-[163.66%] left-[-40.13%] max-w-none top-[-33.25%] w-[174.91%]" src={imgIcon1} />
          </div>
        </div>

        {/* Content Card */}
        <div className="absolute flex flex-col items-start left-[28px] top-[390px]">
          <div className="flex h-[372px] items-start px-[20px] relative rounded-[15px]">
            <div className="flex flex-col h-full items-center justify-between relative">
              {/* Text Content */}
              <div className="flex flex-col items-start not-italic relative text-center tracking-[-0.165px] w-[295px] whitespace-pre-wrap">
                <div className="flex flex-col font-['Poppins',sans-serif] font-bold items-start leading-[40px] pb-[4px] relative text-white">
                  <p className="relative text-[29px] w-[295px]">
                    Successfully
                  </p>
                  <p className="relative text-[25px] w-[295px]">
                    created an account
                  </p>
                </div>
                <p className="font-['Poppins',sans-serif] leading-[normal] min-w-full relative text-[14px] text-[rgba(255,255,255,0.8)] w-[min-content]">
                  After this you can explore any place you want enjoy it!
                </p>
              </div>

              {/* Button */}
              <button
                onClick={onNext}
                className="bg-white hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center px-[20px] py-[17px] relative rounded-[15px] w-full"
              >
                <p className="flex-[1_0_0] font-['Poppins',sans-serif] font-medium leading-[18px] not-italic text-[14px] text-center text-[#2c638b] tracking-[-0.165px]">
                  Let's Explore
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
