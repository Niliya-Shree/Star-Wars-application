import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';
import axios from 'axios';
import '@testing-library/jest-dom';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock data for testing
const mockCharacters = {
  data: {
    results: [
      {
        name: 'Luke Skywalker',
        height: '172',
        mass: '77',
        created: '2014-12-09T13:50:51.644000Z',
        films: ['https://swapi.dev/api/films/1/'],
        birth_year: '19BBY',
        homeworld: 'https://swapi.dev/api/planets/1/',
        species: ['Human'],
        url: 'https://swapi.dev/api/people/1/'
      }
    ]
  }
};

const mockHomeworld = {
  data: {
    name: 'Tatooine',
    terrain: 'desert',
    climate: 'arid',
    population: '200000'
  }
};

describe('Star Wars Character App', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock the API responses
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('people')) {
        return Promise.resolve(mockCharacters);
      } else if (url.includes('planets')) {
        return Promise.resolve(mockHomeworld);
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  test('renders app title', async () => {
    render(<App />);
    const titleElement = screen.getByText(/Star Wars Characters/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('displays loading state', async () => {
    render(<App />);
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toBeInTheDocument();
    
    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  test('displays characters after loading', async () => {
    render(<App />);
    
    // Wait for the character to be displayed
    const characterName = await screen.findByText('Luke Skywalker');
    expect(characterName).toBeInTheDocument();
  });

  test('opens character details modal on click', async () => {
    render(<App />);
    
    // Wait for the character to be displayed and click it
    const characterCard = await screen.findByText('Luke Skywalker');
    fireEvent.click(characterCard);
    
    // Check if modal is displayed with character details
    const modalTitle = await screen.findByRole('heading', { level: 2 });
    expect(modalTitle).toHaveTextContent('Luke Skywalker');
    
    // Check if homeworld details are displayed
    const homeworldName = await screen.findByText(/Tatooine/i);
    expect(homeworldName).toBeInTheDocument();
  });

  test('handles API error', async () => {
    // Mock a failed API request
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));
    
    render(<App />);
    
    // Check if error message is displayed
    const errorMessage = await screen.findByText(/Failed to fetch characters/i);
    expect(errorMessage).toBeInTheDocument();
  });
});
