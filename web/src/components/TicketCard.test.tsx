import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TicketCard } from './TicketCard';
import type { LibraryItem } from '../types';

afterEach(() => cleanup());

const tvItem: LibraryItem = {
  id: 's1',
  title: 'The Bear',
  kind: 'tv',
  category: 'Comedia',
  watch_status: 'viendo',
  poster_path: '/bear.jpg',
  seasons: [{ season_number: 1, episode_count: 4, watched_episodes: [1, 2] }],
  rating: 9,
};

const movieItem: LibraryItem = {
  id: 'm1',
  title: 'Dune',
  kind: 'movie',
  category: 'Pelicula',
  watch_status: 'visto',
  year: 2021,
};

describe('TicketCard', () => {
  it('renders series title, category tag, rating and filmstrip', () => {
    render(<TicketCard item={tvItem} onOpen={vi.fn()} />);

    expect(screen.getByText('The Bear')).toBeInTheDocument();
    expect(screen.getByText('Comedia')).toBeInTheDocument();
    expect(screen.getByText('9/10')).toBeInTheDocument();
    expect(screen.getByText('Serie')).toBeInTheDocument();
    expect(document.querySelectorAll('.filmstrip .frame').length).toBeGreaterThan(0);
  });

  it('renders movie year instead of Serie label', () => {
    const { container } = render(<TicketCard item={movieItem} onOpen={vi.fn()} />);

    expect(screen.getByText('Dune')).toBeInTheDocument();
    expect(screen.getByText('Película')).toBeInTheDocument();
    expect(screen.getByText('2021')).toBeInTheDocument();
    expect(container.querySelector('.filmstrip')).toBeNull();
  });

  it('calls onOpen when clicked', () => {
    const onOpen = vi.fn();
    render(<TicketCard item={movieItem} onOpen={onOpen} />);

    fireEvent.click(screen.getByText('Dune').closest('.ticket')!);
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
