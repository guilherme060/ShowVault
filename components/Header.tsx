import React from 'react';

const Header = () => (
  <header className="p-4 text-center sticky top-0 bg-black/50 backdrop-blur-md z-10">
    <div className="flex items-center justify-center gap-3">
      <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-orange-500 rounded-full flex items-center justify-center shadow-[0_0_15px_#f97316]">
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-12c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12 3" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-orange-400 drop-shadow-[0_0_8px_#4f46e5]">
        ShowVault
      </h1>
    </div>
     <p className="text-xs text-gray-400 mt-1">Nomes Alternativos: Backstage, AfterVibe, NoiteViva, LembrançaSonora</p>
  </header>
);

export default Header;