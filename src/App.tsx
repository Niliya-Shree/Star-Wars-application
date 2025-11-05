import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faArrowRight, faArrowLeft, faTimes, faJedi, faFilter, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import './App.css';

interface Character {
  name: string;
  height: string;
  mass: string;
  created: string;
  films: string[];
  birth_year: string;
  homeworld: string;
  species: string[];
  url: string;
  homeworldDetails?: {
    name: string;
    terrain: string;
    climate: string;
    population: string;
  };
  speciesNames?: string[];
}

const ITEMS_PER_PAGE = 10;

const AppContent: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  // Move all hooks to the top, before any conditional returns
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [filteredCharacters, setFilteredCharacters] = useState<Character[]>([]);
  const [displayedCharacters, setDisplayedCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);

  // Close filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  const [filters, setFilters] = useState({
    homeworld: '',
    film: '',
    species: ''
  });
  const [availableFilters, setAvailableFilters] = useState({
    homeworlds: new Set<string>(),
    films: new Set<string>(),
    species: new Set<string>()
  });

  // Fetch all characters on component mount
  useEffect(() => {
    const fetchAllCharacters = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First, get the total count of characters to know how many pages to fetch
        const firstPage = await axios.get('https://swapi.dev/api/people/');
        const totalCount = firstPage.data.count;
        const totalPages = Math.ceil(totalCount / 10); // SWAPI returns 10 items per page
        
        // Fetch all pages in parallel
        const pagePromises = [];
        for (let i = 1; i <= totalPages; i++) {
          pagePromises.push(axios.get(`https://swapi.dev/api/people/?page=${i}`));
        }
        
        const responses = await Promise.all(pagePromises);
        const allCharacters = responses.flatMap(response => response.data.results);
        
        // Fetch character details including homeworld and species
        const fetchCharacterDetails = async (character: Character) => {
          try {
            const [homeworldRes, ...speciesRes] = await Promise.all([
              character.homeworld ? axios.get(character.homeworld).catch(() => null) : Promise.resolve(null),
              ...(character.species || []).map(speciesUrl => 
                speciesUrl ? axios.get(speciesUrl).catch(() => null) : Promise.resolve(null)
              )
            ]);

            interface SpeciesApiResponse {
              data: {
                name: string;
              };
              status: number;
              statusText: string;
              headers: any;
              config: any;
            }

            const speciesNames = speciesRes
              .filter((res): res is SpeciesApiResponse => {
                return (
                  res !== null &&
                  typeof res === 'object' &&
                  'data' in res &&
                  res.data !== null &&
                  typeof res.data === 'object' &&
                  'name' in res.data &&
                  typeof res.data.name === 'string'
                );
              })
              .map(res => res.data.name);

            return {
              ...character,
              homeworldDetails: homeworldRes?.data ? {
                name: homeworldRes.data.name || 'Unknown',
                terrain: homeworldRes.data.terrain || 'Unknown',
                climate: homeworldRes.data.climate || 'Unknown',
                population: homeworldRes.data.population || 'Unknown'
              } : {
                name: 'Unknown',
                terrain: 'Unknown',
                climate: 'Unknown',
                population: 'Unknown'
              },
              speciesNames
            };
          } catch (error) {
            console.error('Error fetching character details:', error);
            return {
              ...character,
              speciesNames: []
            };
          }
        };

        const charactersWithHomeworld = await Promise.all(
          allCharacters.map(fetchCharacterDetails)
        );
        
        setAllCharacters(charactersWithHomeworld);
        setFilteredCharacters(charactersWithHomeworld);
        setTotalPages(Math.ceil(charactersWithHomeworld.length / ITEMS_PER_PAGE));
      } catch (err) {
        setError('Failed to fetch characters. Please try again later.');
        console.error('Error fetching characters:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllCharacters();
  }, []);
  
  // Fetch and cache filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch homeworlds
        interface Film {
          title: string;
        }

        interface Species {
          name: string;
        }

        interface Planet {
          name: string;
        }

        // Fetch homeworlds
        // Fetch homeworlds (only those that exist)
        const homeworldsResponse = await Promise.all(
          Array.from({ length: 5 }, (_, i) => 
            axios.get<Planet>(`https://swapi.dev/api/planets/${i + 1}/`)
              .then(res => res.data.name)
              .catch(() => null)
          )
        );
        const validHomeworlds = homeworldsResponse.filter((name): name is string => name !== null);

        // Fetch films
        const filmsResponse = await axios.get<{ results: Film[] }>('https://swapi.dev/api/films/');
        const films = filmsResponse.data.results.map(film => film.title);

        // Fetch species
        const speciesResponse = await axios.get<{ results: Species[] }>('https://swapi.dev/api/species/');
        const species = speciesResponse.data.results.map(specie => specie.name);

        setAvailableFilters({
          homeworlds: new Set(validHomeworlds),
          films: new Set(films),
          species: new Set(species)
        });
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  // Filter characters based on search term and filters
  useEffect(() => {
    let filtered = [...allCharacters];

    // Apply search term filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(character =>
        character.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply homeworld filter
    if (filters.homeworld) {
      filtered = filtered.filter(character => {
        // If filter is set to 'none', show characters with no homeworld
        if (filters.homeworld === 'none') {
          return !character.homeworldDetails?.name;
        }
        // If filter is set to a specific homeworld, show matching characters
        if (filters.homeworld !== '') {
          return character.homeworldDetails?.name === filters.homeworld;
        }
        return true;
      });
    }

    // Apply film filter
    if (filters.film) {
      filtered = filtered.filter(character => {
        // If filter is set to 'none', show characters in no films
        if (filters.film === 'none') {
          return character.films.length === 0;
        }
        // If a specific film is selected, show characters in that film
        if (filters.film !== '') {
          const characterFilmTitles = character.films
            .map(filmUrl => {
              const filmId = filmUrl.split('/').filter(Boolean).pop();
              if (!filmId) return null;
              const filmIndex = parseInt(filmId) - 1;
              return Array.from(availableFilters.films)[filmIndex];
            })
            .filter(Boolean) as string[];
          
          return characterFilmTitles.includes(filters.film);
        }
        return true;
      });
    }

    // Apply species filter
    if (filters.species) {
      filtered = filtered.filter(character => {
        // If filter is set to 'none', show characters with no species
        if (filters.species === 'none') {
          return !character.species || character.species.length === 0;
        }
        // If a specific species is selected, show characters of that species
        if (filters.species !== '') {
          // First check speciesNames if available
          if (character.speciesNames && character.speciesNames.length > 0) {
            return character.speciesNames.some(
              species => species && species.toLowerCase() === filters.species.toLowerCase()
            );
          }
          
          // If no speciesNames but has species URLs, check if any match the filter
          if (character.species && character.species.length > 0) {
            // Get the last part of the URL which contains the species ID
            const speciesId = character.species[0].split('/').filter(Boolean).pop();
            if (speciesId) {
              // Get the species name from availableFilters
              const speciesArray = Array.from(availableFilters.species);
              const speciesName = speciesArray[parseInt(speciesId) - 1];
              return speciesName && speciesName.toLowerCase() === filters.species.toLowerCase();
            }
          }
          
          // Special case: If no species is specified, assume Human (common in SWAPI)
          if ((!character.species || character.species.length === 0) && 
              filters.species.toLowerCase() === 'human') {
            return true;
          }
          
          return false;
        }
        return true;
      });
    }

    setFilteredCharacters(filtered);
    setPage(1);
    setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
  }, [searchTerm, allCharacters, filters, availableFilters.films]);
  
  // Update displayed characters when page or filtered characters change
  useEffect(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setDisplayedCharacters(filteredCharacters.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(filteredCharacters.length / ITEMS_PER_PAGE));
    
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, filteredCharacters]);

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(prevPage => prevPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(prevPage => prevPage - 1);
    }
  };

  const openModal = (character: Character) => {
    setSelectedCharacter(character);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'unset'; // Re-enable scrolling
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  };

  // Function to get a random color based on species
  const getSpeciesColor = (species: string[]) => {
    if (!species || species.length === 0) return 'bg-blue-500';
    
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 
      'bg-yellow-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
    ];
    
    // Create a simple hash from the species name
    const hash = species[0].split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Handle logout with proper navigation
  const handleLogout = () => {
    logout();
    // Use setTimeout to ensure navigation happens after the state update
    setTimeout(() => navigate('/login'), 0);
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Get a random image URL from Picsum Photos
  const getRandomImageUrl = (id: string) => {
    const randomId = id.split('/').filter(Boolean).pop();
    return `https://picsum.photos/seed/sw-${randomId}/300/400`;
  };

  return (
    <div className="min-h-screen bg-star-wars-dark text-white">
      {/* Header */}
      <header className="bg-black py-6 shadow-lg">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faJedi} className="text-star-wars-yellow text-4xl mr-4" />
            <h1 className="text-3xl font-bold text-star-wars-yellow">Star Wars Characters</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center px-3 md:px-4 py-2 bg-star-wars-yellow hover:bg-yellow-500 text-black font-semibold rounded transition-colors"
            aria-label="Logout"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="md:mr-2" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8 max-w-md mx-auto">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search characters..."
              className="w-full px-4 py-3 rounded-l-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-star-wars-yellow focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="relative" ref={filterRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFilters(!showFilters);
                }}
                className="px-4 py-3 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-r-lg border border-l-0 border-gray-700 focus:outline-none"
                title="Filter options"
              >
                <FontAwesomeIcon icon={faFilter} />
              </button>
              
              {showFilters && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg z-10 border border-gray-700">
                  <div className="p-4">
                    <h3 className="text-white font-medium mb-3">Filter by:</h3>
                    
                    <div className="mb-3">
                      <label className="block text-gray-300 text-sm mb-1">Homeworld</label>
                      <select
                        className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                        value={filters.homeworld}
                        onChange={(e) => setFilters({...filters, homeworld: e.target.value})}
                      >
                        <option value="">All Homeworlds</option>
                        <option value="none">None (No Homeworld)</option>
                        {Array.from(availableFilters.homeworlds).map((world) => (
                          <option key={world} value={world}>{world}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="block text-gray-300 text-sm mb-1">Film</label>
                      <select
                        className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                        value={filters.film}
                        onChange={(e) => setFilters({...filters, film: e.target.value})}
                      >
                        <option value="">All Films</option>
                        <option value="none">None (No Film)</option>
                        {Array.from(availableFilters.films).map((film) => (
                          <option key={film} value={film}>{film}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="block text-gray-300 text-sm mb-1">Species</label>
                      <select
                        className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                        value={filters.species}
                        onChange={(e) => setFilters({...filters, species: e.target.value})}
                      >
                        <option value="">All Species</option>
                        <option value="none">None (No Species)</option>
                        {Array.from(availableFilters.species).map((specie) => (
                          <option key={specie} value={specie}>{specie}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => {
                          setFilters({ homeworld: '', film: '', species: '' });
                          setShowFilters(false);
                        }}
                        className="text-gray-300 hover:text-white mr-3 text-sm"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="bg-star-wars-yellow text-black px-3 py-1 rounded text-sm font-medium"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-16 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-star-wars-yellow" />
          </div>
        )}

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayedCharacters.map((character) => (
                <div 
                  key={character.url}
                  className={`rounded-lg overflow-hidden shadow-lg cursor-pointer transform transition-transform hover:scale-105 ${getSpeciesColor(character.species)}`}
                  onClick={() => openModal(character)}
                >
                  <div className="relative h-64">
                    <img 
                      src={getRandomImageUrl(character.url)} 
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end p-4">
                      <h2 className="text-xl font-bold text-white">{character.name}</h2>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-200">
                      {character.films.length} {character.films.length === 1 ? 'film' : 'films'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center mt-8 space-y-4 w-full">
              <div className="flex justify-between items-center w-full">
                {/* Previous Button - Always visible */}
                <button
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className={`flex items-center px-4 py-2 rounded-md ${page === 1 ? 'bg-gray-600 cursor-not-allowed' : 'bg-star-wars-yellow hover:bg-yellow-600 text-black'} font-semibold`}
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Previous
                </button>
                
                {/* Page Numbers - Hidden on mobile, visible on md screens and up */}
                <div className="hidden md:flex space-x-2">
                  {page > 3 && (
                    <>
                      <button
                        onClick={() => setPage(1)}
                        className={`px-3 py-1 rounded-md ${page === 1 ? 'bg-yellow-700 text-white' : 'bg-star-wars-yellow hover:bg-yellow-600 text-black'} font-semibold`}
                      >
                        1
                      </button>
                      {page > 4 && <span className="text-white self-center">...</span>}
                    </>
                  )}
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => {
                      if (page <= 3) return p <= 5;
                      if (page >= totalPages - 2) return p >= totalPages - 4;
                      return p >= page - 2 && p <= page + 2;
                    })
                    .map(p => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1 rounded-md ${page === p ? 'bg-yellow-700 text-white' : 'bg-star-wars-yellow hover:bg-yellow-600 text-black'} font-semibold`}
                      >
                        {p}
                      </button>
                    ))}
                  
                  {page < totalPages - 2 && (
                    <>
                      {page < totalPages - 3 && <span className="text-white self-center">...</span>}
                      <button
                        onClick={() => setPage(totalPages)}
                        className={`px-3 py-1 rounded-md ${page === totalPages ? 'bg-yellow-700 text-white' : 'bg-star-wars-yellow hover:bg-yellow-600 text-black'} font-semibold`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={handleNextPage}
                  disabled={page >= totalPages}
                  className={`flex items-center px-4 py-2 rounded-md ${page >= totalPages ? 'bg-gray-600 cursor-not-allowed' : 'bg-star-wars-yellow hover:bg-yellow-600 text-black'} font-semibold`}
                >
                  Next <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                </button>
              </div>
              <span className="text-sm text-gray-300">Page {page} of {totalPages}</span>
            </div>
          </>
        )}
      </main>

      {/* Character Modal */}
      {isModalOpen && selectedCharacter && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <img 
                src={getRandomImageUrl(selectedCharacter.url)}
                alt={selectedCharacter.name}
                className="w-full h-64 object-cover rounded-t-lg"
              />
              <button 
                onClick={closeModal}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="p-6">
              <h2 className="text-3xl font-bold mb-4 text-star-wars-yellow">{selectedCharacter.name}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3">General Information</h3>
                  <ul className="space-y-2">
                    <li><span className="font-medium">Height:</span> {selectedCharacter.height} cm</li>
                    <li><span className="font-medium">Mass:</span> {selectedCharacter.mass} kg</li>
                    <li><span className="font-medium">Birth Year:</span> {selectedCharacter.birth_year}</li>
                    <li><span className="font-medium">Films:</span> {selectedCharacter.films.length}</li>
                    <li><span className="font-medium">Added:</span> {formatDate(selectedCharacter.created)}</li>
                  </ul>
                </div>
                
                {selectedCharacter.homeworldDetails && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Homeworld</h3>
                    <ul className="space-y-2">
                      <li><span className="font-medium">Name:</span> {selectedCharacter.homeworldDetails.name}</li>
                      <li><span className="font-medium">Terrain:</span> {selectedCharacter.homeworldDetails.terrain}</li>
                      <li><span className="font-medium">Climate:</span> {selectedCharacter.homeworldDetails.climate}</li>
                      <li><span className="font-medium">Population:</span> {selectedCharacter.homeworldDetails.population}</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<AppContent />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
