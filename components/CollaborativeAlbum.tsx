import React, { useState } from 'react';
import { Show } from '../types';

interface CollaborativeAlbumProps {
    shows: Show[];
}

const CollaborativeAlbum: React.FC<CollaborativeAlbumProps> = ({ shows }) => {
    const [selectedShow, setSelectedShow] = useState<Show | null>(shows.length > 0 ? shows[0] : null);
    const [albumName, setAlbumName] = useState('Noite Épica');
    const [friends, setFriends] = useState(['Alex', 'Bia']);
    const [newFriend, setNewFriend] = useState('');

    const addFriend = (e: React.FormEvent) => {
        e.preventDefault();
        if(newFriend && !friends.includes(newFriend)) {
            setFriends([...friends, newFriend]);
            setNewFriend('');
        }
    }
    
    if(shows.length === 0) {
         return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500">
            <h2 className="text-xl font-bold">Nenhum Show para Criar um Álbum</h2>
            <p>Adicione uma memória de show primeiro para iniciar um álbum colaborativo.</p>
          </div>
        );
    }

    return (
        <div className="p-4 space-y-6 text-gray-200">
            <h2 className="text-2xl font-bold text-center text-purple-400">Álbuns Colaborativos</h2>
            
            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 space-y-4">
                <div>
                    <label htmlFor="album-name" className="block text-sm font-medium text-gray-400">Nome do Álbum</label>
                    <input type="text" id="album-name" value={albumName} onChange={e => setAlbumName(e.target.value)} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm p-2" />
                </div>
                 <div>
                    <label htmlFor="show-select" className="block text-sm font-medium text-gray-400">Selecionar Show</label>
                    <select id="show-select" onChange={e => setSelectedShow(shows.find(s => s.id === e.target.value) || null)} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm p-2">
                        {shows.map(s => <option key={s.id} value={s.id}>{s.artist} em {s.location}</option>)}
                    </select>
                </div>
            </div>

            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <h3 className="font-bold text-lg text-orange-400">Compartilhar com Amigos</h3>
                <div className="flex flex-wrap gap-2 my-2">
                    {friends.map(friend => (
                        <span key={friend} className="flex items-center bg-gray-700 text-gray-200 text-sm font-medium px-2.5 py-1 rounded-full">
                           <img className="w-6 h-6 rounded-full mr-2 border-2 border-purple-500" src={`https://i.pravatar.cc/48?u=${friend}`} alt={friend} />
                            {friend}
                        </span>
                    ))}
                </div>
                <form onSubmit={addFriend} className="flex gap-2 mt-4">
                     <input type="text" value={newFriend} onChange={e => setNewFriend(e.target.value)} placeholder="Adicionar nome do amigo" className="block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm p-2" />
                     <button type="submit" className="px-4 py-2 bg-purple-600 rounded-md hover:bg-purple-700 text-sm">Adicionar</button>
                </form>
                <button className="w-full mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-teal-500">
                    Enviar Convites (Simulado)
                </button>
            </div>
            
            {selectedShow && (
                <div>
                    <h3 className="text-xl font-bold mb-2">Mídia de {selectedShow.artist}</h3>
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {selectedShow.media.map(media => (
                        <div key={media.id} className="rounded-lg overflow-hidden">
                            {media.type === 'image' ? (
                            <img src={media.url} alt={`${selectedShow.artist} memory`} className="object-cover h-32 w-full" />
                            ) : (
                            <video src={media.url} className="object-cover h-32 w-full" />
                            )}
                        </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollaborativeAlbum;