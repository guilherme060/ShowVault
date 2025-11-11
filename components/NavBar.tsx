import React from 'react';
import { TimelineIcon, RandomIcon, AddIcon, AlbumIcon, AiFeaturesIcon } from './icons';

type View = 'timeline' | 'random' | 'add' | 'album' | 'ai';

interface NavBarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavButton: React.FC<{
  label: string;
  // FIX: Replaced JSX.Element with React.ReactElement to resolve the "Cannot find namespace 'JSX'" error.
  icon: React.ReactElement;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  const activeClasses = "text-purple-400 drop-shadow-[0_0_5px_#a855f7]";
  const inactiveClasses = "text-gray-500 hover:text-purple-400";
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full transition-all duration-300 ${isActive ? activeClasses : inactiveClasses}`}>
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
};


const NavBar: React.FC<NavBarProps> = ({ currentView, setCurrentView }) => {
  const navItems = [
    { view: 'timeline', label: 'Linha do Tempo', icon: <TimelineIcon /> },
    { view: 'random', label: 'Aleatório', icon: <RandomIcon /> },
    { view: 'add', label: 'Adicionar', icon: <AddIcon /> },
    { view: 'album', label: 'Álbuns', icon: <AlbumIcon /> },
    { view: 'ai', label: 'IA Criativa', icon: <AiFeaturesIcon /> },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-gray-900/80 backdrop-blur-lg border-t border-purple-800/50 shadow-[0_-5px_20px_-5px_rgba(79,70,229,0.3)] z-20">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        {navItems.map(item => (
          <NavButton 
            key={item.view}
            label={item.label}
            icon={item.icon}
            isActive={currentView === item.view}
            onClick={() => setCurrentView(item.view as View)}
          />
        ))}
      </div>
    </nav>
  );
};

export default NavBar;