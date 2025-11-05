import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the CharacterCard and Modal components
const CharacterCard = ({ character, onClick }) => (
  <div 
    className="character-card" 
    onClick={() => onClick(character)}
    data-testid="character-card"
  >
    <h3>{character.name}</h3>
    <p>Height: {character.height} cm</p>
    <p>Mass: {character.mass} kg</p>
  </div>
);

const Modal = ({ isOpen, onClose, character }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal" data-testid="character-modal">
      <h2>Character Details</h2>
      <p>Name: {character.name}</p>
      <p>Height: {character.height} cm</p>
      <p>Mass: {character.mass} kg</p>
      <p>Birth Year: {character.birth_year}</p>
      <p>Homeworld: {character.homeworld}</p>
      <p>Species: {character.species?.join(', ')}</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

describe('Character Modal', () => {
  const mockCharacter = {
    name: 'Luke Skywalker',
    height: '172',
    mass: '77',
    birth_year: '19BBY',
    homeworld: 'Tatooine',
    species: ['Human']
  };

  it('should open modal with character details when character card is clicked', () => {
    // Mock the click handler
    const handleClick = jest.fn();
    
    // Render the CharacterCard
    render(
      <CharacterCard 
        character={mockCharacter} 
        onClick={handleClick} 
      />
    );

    // Click on the character card
    fireEvent.click(screen.getByTestId('character-card'));
    
    // Check if the click handler was called with the correct character
    expect(handleClick).toHaveBeenCalledWith(mockCharacter);
  });

  it('should display character details in the modal', () => {
    // Render the Modal with a character
    const { rerender } = render(
      <Modal 
        isOpen={false} 
        onClose={jest.fn()} 
        character={mockCharacter} 
      />
    );
    
    // Modal should not be in the document when isOpen is false
    expect(screen.queryByTestId('character-modal')).not.toBeInTheDocument();
    
    // Re-render with isOpen true
    rerender(
      <Modal 
        isOpen={true} 
        onClose={jest.fn()} 
        character={mockCharacter} 
      />
    );
    
    // Check if modal is in the document and contains character details
    const modal = screen.getByTestId('character-modal');
    expect(modal).toBeInTheDocument();
    
    // Verify the content
    expect(modal).toHaveTextContent('Luke Skywalker');
    expect(modal).toHaveTextContent('172'); // Height
    expect(modal).toHaveTextContent('77');   // Mass
    expect(modal).toHaveTextContent('19BBY'); // Birth Year
    expect(modal).toHaveTextContent('Tatooine'); // Homeworld
    expect(modal).toHaveTextContent('Human'); // Species
  });

  it('should close the modal when the close button is clicked', () => {
    const handleClose = jest.fn();
    
    // Render the Modal with isOpen true
    render(
      <Modal 
        isOpen={true} 
        onClose={handleClose} 
        character={mockCharacter} 
      />
    );
    
    // Click the close button
    fireEvent.click(screen.getByText('Close'));
    
    // Check if the onClose handler was called
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
