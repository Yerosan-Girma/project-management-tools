import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

describe('UI Primitives Test Suite', () => {
  describe('Button Component', () => {
    it('renders button with label and responds to clicks', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const btn = screen.getByRole('button', { name: /click me/i });
      expect(btn).toBeInTheDocument();

      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disables button when disabled or isLoading is true', () => {
      const { rerender } = render(<Button disabled>Disabled Btn</Button>);
      expect(screen.getByRole('button')).toBeDisabled();

      rerender(<Button isLoading>Loading Btn</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Input Component', () => {
    it('renders input with label and helper text', () => {
      render(
        <Input
          label="Test Label"
          helperText="Helper message"
          placeholder="Enter text..."
        />
      );

      expect(screen.getByLabelText(/test label/i)).toBeInTheDocument();
      expect(screen.getByText(/helper message/i)).toBeInTheDocument();
    });

    it('displays error text when provided', () => {
      render(<Input label="Email" error="Invalid email address" />);
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  describe('Badge Component', () => {
    it('renders badge with children and custom variant', () => {
      render(<Badge variant="success">Completed</Badge>);
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
    });
  });

  describe('Avatar Component', () => {
    it('computes initials fallback when image is missing', () => {
      render(<Avatar name="Sarah Connor" />);
      expect(screen.getByText('SC')).toBeInTheDocument();
    });
  });

  describe('Card Component', () => {
    it('renders card with header and content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Sprint Alpha</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Active tasks</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Sprint Alpha')).toBeInTheDocument();
      expect(screen.getByText('Active tasks')).toBeInTheDocument();
    });
  });
});
