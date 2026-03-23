import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LazyImage } from '../LazyImage';

describe('LazyImage', () => {
  it('renders an img element', () => {
    render(<LazyImage src="/img/test.webp" alt="Test image" />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('uses lazy loading by default', () => {
    render(<LazyImage src="/img/test.webp" alt="Test" />);
    expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy');
  });

  it('uses eager loading when eager prop is true', () => {
    render(<LazyImage eager src="/img/test.webp" alt="Test" />);
    expect(screen.getByRole('img')).toHaveAttribute('loading', 'eager');
  });

  it('promotes eager images with high fetch priority', () => {
    render(<LazyImage eager src="/img/test.webp" alt="Test" />);
    expect(screen.getByRole('img')).toHaveAttribute('fetchpriority', 'high');
  });

  it('always sets decoding to async', () => {
    render(<LazyImage src="/img/test.webp" alt="Test" />);
    expect(screen.getByRole('img')).toHaveAttribute('decoding', 'async');
  });

  it('applies lazy-image base class', () => {
    render(<LazyImage src="/img/test.webp" alt="Test" />);
    expect(screen.getByRole('img')).toHaveClass('lazy-image');
  });

  it('adds loaded class after image loads', () => {
    render(<LazyImage src="/img/test.webp" alt="Test" />);
    const img = screen.getByRole('img');
    expect(img).not.toHaveClass('lazy-image--loaded');

    fireEvent.load(img);

    expect(img).toHaveClass('lazy-image--loaded');
  });

  it('adds errored class after image fails to load', () => {
    render(<LazyImage src="/img/broken.webp" alt="Test" />);
    const img = screen.getByRole('img');
    expect(img).not.toHaveClass('lazy-image--errored');

    fireEvent.error(img);

    expect(img).toHaveClass('lazy-image--errored');
  });

  it('calls onLoad callback when image loads', () => {
    const onLoad = vi.fn();
    render(<LazyImage src="/img/test.webp" alt="Test" onLoad={onLoad} />);

    fireEvent.load(screen.getByRole('img'));

    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('calls onError callback when image fails', () => {
    const onError = vi.fn();
    render(<LazyImage src="/img/broken.webp" alt="Test" onError={onError} />);

    fireEvent.error(screen.getByRole('img'));

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('merges extra className with base classes', () => {
    render(<LazyImage src="/img/test.webp" alt="Test" className="custom-class" />);
    const img = screen.getByRole('img');
    expect(img).toHaveClass('lazy-image');
    expect(img).toHaveClass('custom-class');
  });

  it('passes alt text to the img element', () => {
    render(<LazyImage src="/img/test.webp" alt="Samsung Galaxy S24" />);
    expect(screen.getByAltText('Samsung Galaxy S24')).toBeInTheDocument();
  });

  it('uses empty string for alt when not provided', () => {
    render(<LazyImage src="/img/test.webp" />);
    // alt="" makes the img a presentation element (hidden from accessible tree)
    const img = document.querySelector('img');
    expect(img).toHaveAttribute('alt', '');
  });
});
