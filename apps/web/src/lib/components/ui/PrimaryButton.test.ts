import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import PrimaryButton from './PrimaryButton.svelte';

// First real component test (backlog #27): proves @testing-library/svelte renders a Svelte 5
// component and jest-dom matchers work. Later UI stories can carry component-level unit proof.
describe('PrimaryButton', () => {
  it('renders the label inside a real <button>', () => {
    render(PrimaryButton, { props: { label: 'Gửi' } });
    expect(screen.getByRole('button', { name: 'Gửi' })).toBeInTheDocument();
  });

  it('disables the button and marks aria-busy while loading', () => {
    render(PrimaryButton, { props: { label: 'Gửi', loading: true } });
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('honours an explicit submit type', () => {
    render(PrimaryButton, { props: { label: 'Lưu', type: 'submit' } });
    expect(screen.getByRole('button', { name: 'Lưu' })).toHaveAttribute('type', 'submit');
  });
});
