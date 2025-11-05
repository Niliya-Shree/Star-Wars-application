import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../test-utils';
import App from '../App';
import '@testing-library/jest-dom';

// Mock the API responses
const mockCharacter = {
  name: 'Luke Skywalker',
  height: '172',
  mass: '77',
  birth_year: '19BBY',
  homeworld: 'https://swapi.dev/api/planets/1/',
  films: ['https://swapi.dev/api/films/1/'],
  species: ['https://swapi.dev/api/species/1/'],
  url: 'https://swapi.dev/api/people/1/',
};

const mockCharactersResponse = {
  data: {
    results: [mockCharacter],
    count: 1,
    next: null,
    previous: null,
  },
};

const mockHomeworldResponse = {
  data: {
    name: 'Tatooine',
    terrain: 'desert',
    climate: 'arid',
    population: '200000',
  },
};

const mockSpeciesResponse = {
  data: {
    name: 'Human',
  },
};

// Mock the axios module
jest.mock('axios', () => ({
  get: jest.fn((url) => {
    if (url.includes('people')) {
      return Promise.resolve(mockCharactersResponse);
    } else if (url.includes('planets')) {
      return Promise.resolve(mockHomeworldResponse);
    } else if (url.includes('species')) {
      return Promise.resolve(mockSpeciesResponse);
    }
    return Promise.reject(new Error('Not found'));
  }),
}));

describe('Character Modal Integration', () => {
  beforeEach(() => {
    // Mock localStorage for authentication
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'sw_token') return 'test-token';
      if (key === 'sw_username') return 'testuser';
      return null;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should open modal with character details when a character is clicked', async () => {
    render(<App />);

    // Wait for the character to be loaded
    const characterName = await screen.findByText('Luke Skywalker');
    expect(characterName).toBeInTheDocument();

    // Click on the character card
    fireEvent.click(characterName);

    // Wait for the modal to open and check its content
    await waitFor(() => {
      // Check if the modal is open by looking for the close button
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();

      // Check for character details in the modal
      expect(screen.getByText(/height/i)).toBeInTheDocument();
      expect(screen.getByText(/mass/i)).toBeInTheDocument();
      expect(screen.getByText(/birth year/i)).toBeInTheDocument();
      expect(screen.getByText(/homeworld/i)).toBeInTheDocument();
      expect(screen.getByText(/species/i)).toBeInTheDocument();
    });
  });
});
