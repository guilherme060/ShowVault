import React, { useState, useEffect } from 'react';
import { Show } from '../types';

interface TimelineProps {
  shows: Show[];
}

const Timeline: React.FC<TimelineProps> = ({ shows }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredShows, setFilteredShows] = useState<Show[]>([]);

  useEffect(() => {
    const sortedShows = [...shows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (searchTerm.trim() === '') {
      setFilteredShows(sortedShows);
      return;
    }

    const lowercasedFilter = searchTerm.toLowerCase();
    const results = sortedShows.filter(show =>
      show.artist.toLowerCase().includes(lowercasedFilter) ||
      show.location.toLowerCase().includes(lowercasedFilter) ||
      new Date(show.date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' }).toLowerCase().includes(lowercasedFilter)
    );
    setFilteredShows(results);
  }, [searchTerm, shows]);

  if (shows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500">
        <h2 className="text-xl font-bold">Seu Cofre está Vazio</h2>
        <p>Vá para a aba 'Adicionar' para começar a salvar suas memórias de shows!</p>
      </div>
    );
  }

  return (
    <div>
        <div className="p-4 sticky top-[88px] z-10 bg-black/80 backdrop-blur-md">
            <input
                type="text"
                placeholder="Buscar por artista, local, data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-full focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-gray-500 text-white"
            />
        </div>

        {filteredShows.length > 0 ? (
            <div className="p-4 space-y-8">
            {filteredShows.map(show => (
                <div key={show.id} className="relative pl-8 border-l-2 border-purple-700/50">
                <div className="absolute -left-[11px] top-1 w-5 h-5 bg-orange-500 rounded-full border-4 border-gray-900 shadow-[0_0_10px_#f97316]"></div>
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 ml-4 shadow-lg hover:border-purple-500 transition-all duration-300">
                    <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs text-gray-400">{new Date(show.date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-orange-400">{show.artist}</h3>
                        <p className="text-sm text-gray-300">{show.location}</p>
                        <span className="inline-block mt-2 bg-blue-500/20 text-blue-300 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">{show.vibe}</span>
                    </div>
                    </div>
                    {show.media.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {show.media.slice(0, 3).map(media => (
                        <div key={media.id} className="rounded-lg overflow-hidden">
                            {media.type === 'image' ? (
                            <img src={media.url} alt={`${show.artist} memory`} className="object-cover h-32 w-full" />
                            ) : (
                            <video src={media.url} className="object-cover h-32 w-full" />
                            )}
                        </div>
                        ))}
                    </div>
                    )}
                </div>
                </div>
            ))}
            </div>
        ) : (
             <div className="text-center p-8 text-gray-500">
                <h2 className="text-xl font-bold">Nenhum Resultado Encontrado</h2>
                <p>Tente ajustar os termos da sua busca.</p>
            </div>
        )}
    </div>
  );
};

export default Timeline;