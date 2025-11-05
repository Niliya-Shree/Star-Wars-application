# Star Wars Character Explorer

A responsive web application that allows users to explore Star Wars characters and their details, built with React and TypeScript.

## Features

- 🚀 View a paginated list of Star Wars characters
- 🔍 Advanced search functionality:
  - Real-time search as you type
  - Case-insensitive matching
  - Search across multiple character attributes
- 🔧 Powerful filtering options:
  - Filter by character attributes (height, mass, birth year)
  - Toggle filters on/off
  - Combine multiple filters for precise results
- 📱 Responsive design that works on mobile and desktop
- 🔒 Authentication system with protected routes
- 📊 Detailed character information including:
  - Basic details (height, mass, birth year)
  - Homeworld information
  - Species details
  - Film appearances
- ⚡ Optimized performance with lazy loading
- 🧪 Comprehensive test coverage

## Prerequisites

- Node.js (v14 or later)
- npm (v7 or later) or yarn

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd star-wars-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Available Scripts

In the project directory, you can run:

#### `npm start` or `yarn start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will automatically reload if you make changes to the code.

#### `npm test` or `yarn test`

Launches the test runner in interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

#### `npm run build` or `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

## Project Structure

```
src/
├── components/      # Reusable UI components
├── context/         # React context providers
├── __tests__/       # Test files
├── App.tsx          # Main application component
├── index.tsx        # Application entry point
└── App.css          # Global styles
```

## Design Decisions

### State Management
- Used React Context API for global state management (authentication)
- Local component state for UI-specific state management
- Custom hooks for data fetching and pagination logic

### Performance Optimizations
- Implemented pagination to limit the number of items loaded at once
- Lazy loading for components and assets
- Memoization to prevent unnecessary re-renders

### Search & Filter Implementation
- **Search Feature**:
  - Debounced input for optimal performance
  - Highlights matching text in results
  - Clear search functionality with a single click
  - Visual feedback during search operations

- **Filter System**:
  - Dynamic filter panel that can be toggled
  - Preserves filter state across navigation
  - Responsive filter controls that adapt to screen size
  - Clear all filters option

### UI/UX Considerations
- Responsive design using CSS Grid and Flexbox
- Loading states and error boundaries for better user experience
- Accessible components with proper ARIA labels
- Smooth animations and transitions
- Intuitive search and filter interface with clear visual feedback

## Testing

The application includes a comprehensive test suite to ensure reliability and maintainability. The testing strategy includes:

### Unit Tests
- Test individual components in isolation
- Verify component rendering and behavior
- Test utility functions and hooks

### Integration Tests
Test how different parts of the application work together:
- User interactions and workflows
- Component communication
- State management

### Key Test Files

#### `Modal.test.tsx`
- Tests the core Modal component in isolation
- Verifies:
  - Modal opens and closes correctly
  - Clicking outside the modal triggers close
  - Escape key closes the modal
  - Proper rendering of children components
  - Accessibility features (ARIA attributes, focus management)

#### `CharacterModal.integration.test.tsx`
- Tests the character modal functionality in an integrated environment
- Verifies:
  - Modal opens with correct character details when a character is clicked
  - Loading states during API calls
  - Error handling for failed API requests
  - Display of character information (name, height, mass, etc.)
  - Integration with the character list
  - Responsive behavior

### Test Utilities
- Custom `render` function with all necessary providers
- Mock service worker for API responses
- Test data factories for consistent test data
- Custom matchers for testing-library

## API Integration

The application uses the [SWAPI (Star Wars API)](https://swapi.dev/) to fetch character data. The API is called through a service layer that handles:
- Data fetching
- Error handling
- Response transformation
- Caching

## Deployment

This application can be deployed to any static hosting service, such as:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## Future Improvements

- [ ] Implement server-side rendering (SSR) for better SEO
- [ ] Add more filtering and sorting options
- [ ] Implement favorites functionality
- [ ] Add more detailed character statistics and comparisons
- [ ] Support for dark/light theme

## Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [SWAPI](https://swapi.dev/) for the Star Wars API
- [Create React App](https://create-react-app.dev/) for the project setup
- [Font Awesome](https://fontawesome.com/) for the icons
