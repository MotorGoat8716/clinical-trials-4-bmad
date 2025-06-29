import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import axios from 'axios';

// Mock axios to control API responses in tests
jest.mock('axios');

describe('Frontend UI', () => {
  // Test Case TC-011
  test('renders the search interface correctly', () => {
    render(<App />);
    expect(screen.getByText(/Clinical Trials Search/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Condition/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Location/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Phase/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument();
  });

  // Test Case TC-012
  test('handles a large result set correctly', async () => {
    const largeResponse = {
      count: 50,
      trial_ids: Array.from({ length: 50 }, (_, i) => `NCT${i}`),
    };
    axios.get.mockResolvedValue({ data: largeResponse });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));

    await waitFor(() => {
      expect(screen.getByText(/We found 50 trials. Please add more filters to see summaries./i)).toBeInTheDocument();
    });
  });

  // Test Case TC-013
  test('handles a small result set correctly', async () => {
    const smallResponse = {
      count: 2,
      trials: [
        { trial_id: 'NCT123', title: 'Test Trial 1', summary: 'Summary 1' },
        { trial_id: 'NCT456', title: 'Test Trial 2', summary: 'Summary 2' },
      ],
    };
    axios.get.mockResolvedValue({ data: smallResponse });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));

    await waitFor(() => {
      expect(screen.getByText(/Found 2 trials/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Trial 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Trial 2/i)).toBeInTheDocument();
    });
  });

  // Test Case TC-015 (Error State)
  test('handles API errors gracefully', async () => {
    axios.get.mockRejectedValue(new Error('API Error'));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));

    await waitFor(() => {
      expect(screen.getByText(/An error occurred/i)).toBeInTheDocument();
    });
  });
});