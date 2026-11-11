import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ContactPage } from '../features/landing/pages/ContactPage';
import { apiClient } from '../services/api';
import { solutionTypes, productMenu } from '../features/landing/data/marketing';

vi.mock('../services/api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('Frontend Features and Workflows Quality Suite', () => {
  describe('Contact Us Form Quality & Submissions', () => {
    it('renders all contact inputs, topic selection, and submit button', () => {
      render(
        <BrowserRouter>
          <ContactPage />
        </BrowserRouter>
      );

      expect(screen.getByLabelText(/^Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/topic/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    it('submits successfully when valid information is provided', async () => {
      const mockPost = vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { success: true, message: 'Message received! Platform admin has been notified.' },
      });

      render(
        <BrowserRouter>
          <ContactPage />
        </BrowserRouter>
      );

      fireEvent.change(screen.getByLabelText(/^Name/i), {
        target: { value: 'Tester Person' },
      });
      fireEvent.change(screen.getByLabelText(/work email/i), {
        target: { value: 'tester@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/topic/i), {
        target: { value: 'security' },
      });
      fireEvent.change(screen.getByLabelText(/message/i), {
        target: { value: 'Testing contact notifications to platform admin.' },
      });

      fireEvent.click(screen.getByRole('button', { name: /send message/i }));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/contact', {
          name: 'Tester Person',
          email: 'tester@example.com',
          topic: 'security',
          message: 'Testing contact notifications to platform admin.',
        });
      });

      expect(await screen.findByText(/message delivered!/i)).toBeInTheDocument();
    });
  });

  describe('Marketing and Solution Types Data Integrity', () => {
    it('has non-empty titles, descriptions, and highlights for all solutions', () => {
      expect(solutionTypes.length).toBeGreaterThanOrEqual(4);
      for (const sol of solutionTypes) {
        expect(sol.id).toBeTruthy();
        expect(sol.label).toBeTruthy();
        expect(sol.title).toBeTruthy();
        expect(sol.description.length).toBeGreaterThan(20);
        expect(sol.highlights.length).toBeGreaterThan(0);
      }
    });

    it('has valid structure for all product menu items', () => {
      expect(productMenu.length).toBeGreaterThanOrEqual(6);
      for (const feat of productMenu) {
        expect(feat.to).toBeTruthy();
        expect(feat.title).toBeTruthy();
        expect(feat.description.length).toBeGreaterThan(15);
      }
    });
  });
});
