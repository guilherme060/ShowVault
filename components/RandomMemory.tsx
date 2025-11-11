import React, { useState, useEffect } from 'react';
import { Show } from '../types';

interface RandomMemoryProps {
  shows: Show[];
}

const RandomMemory: React.FC<RandomMemoryProps> = ({ shows }) => {
  const [randomShow, setRandomShow] = useState<Show | null>(null);

  const pickRandomShow = () => {
    if (shows.length > 0) {
      const randomIndex = Math.floor(Math.random() * shows.length);
      setRandomShow(shows[randomIndex]);
    }
  };

  useEffect(() => {
    pickRandomShow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shows]);

  if (shows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500">
        <h2 className="text-xl font-bold">Nenhuma Memória Ainda</h2>
        <p>Adicione alguns shows ao seu cofre para ver memórias aleatórias aqui.</p>
      </div>
    );
  }

  if (!randomShow) {
    return (
       <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500">
        <p>Clique no botão para obter uma memória aleatória.</p>
      </div>
    )
  }

  return (
    <div className="p-4 flex flex-col items-center space-y-6">
      <h2 className="text-2xl font-bold text-center text-purple-400 drop-shadow-[0_0_8px_#a855f7]">Memória Aleatória</h2>
      
      <div className="w-full max-w-sm bg-gray-900 border border-purple-800/50 rounded-2xl shadow-2xl shadow-purple-900/40 p-6 text-center animate-fade-in-up">
        <p className="text-sm text-gray-400">Lembra dessa noite?</p>
        <p className="text-lg font-bold text-gray-200">{new Date(randomShow.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        
        {randomShow.media[0] && (
          <div className="my-4 rounded-lg overflow-hidden aspect-square">
             {randomShow.media[0].type === 'image' ? (
                <img src={randomShow.media[0].url} alt="random memory" className="object-cover h-full w-full" />
              ) : (
                <video src={randomShow.media[0].url} controls className="object-cover h-full w-full" />
              )}
          </div>
        )}
        
        <h3 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-orange-400">{randomShow.artist}</h3>
        <p className="text-gray-300">{randomShow.location}</p>
        <p className="mt-4 text-lg">A vibe foi <span className="font-bold text-blue-400">{randomShow.vibe}</span></p>
      </div>
      
      <button 
        onClick={pickRandomShow}
        className="py-3 px-6 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
      >
        Mostrar Outra Memória
      </button>
    </div>
  );
};

export default RandomMemory;