export default function JournalCard() {
  return (
    <div className="w-[350px] bg-white rounded-[12px] border border-[#CAC4D0] shadow-md overflow-hidden mx-auto mb-6">
      {/* Header Area */}
      <div className="flex items-center p-4 gap-4">
        <div className="w-10 h-10 bg-[#DAECFF] rounded-full flex items-center justify-center text-[#2C638B] font-medium">
          T
        </div>
        <div>
          <h3 className="font-['Poppins'] font-medium text-[16px] text-[#1D1B20]">Teo Doe</h3>
          <p className="font-['Inter'] text-[14px] text-[#49454F]">2 hours ago</p>
        </div>
      </div>

      {/* Media / Image Area */}
      <div className="w-full h-[188px] bg-[#CDE5FF] flex items-center justify-center">
        {/* Replace with your <img> tag later */}
        <span className="text-blue-400">Travel Photo</span>
      </div>

      {/* Text Content */}
      <div className="p-4 space-y-4">
        <div>
          <h2 className="font-['Poppins'] font-semibold text-[24px] text-[#181C20]">Kyoto Temple</h2>
          <p className="font-['Poppins'] font-medium text-[14px] text-[#B3B3B3] uppercase">Japan</p>
        </div>
        
        <p className="font-['Roboto'] text-[14px] text-[#49454F]">
          Amazing experience exploring the historical sites...
        </p>

        {/* Interaction Bar */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-4 items-center">
            <span className="text-sm">❤️ 1.2k</span>
            <span className="text-sm">🔖 234</span>
          </div>
          <button className="bg-[#094B72] text-white px-6 py-2 rounded-full text-sm font-medium">
            Read More
          </button>
        </div>
      </div>
    </div>
  );
}