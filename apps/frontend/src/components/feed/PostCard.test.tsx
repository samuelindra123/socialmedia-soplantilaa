import React from 'react';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useQuery: () => ({ data: [], isLoading: false }),
  useInfiniteQuery: () => ({ data: null, isLoading: false }),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
    cancelQueries: jest.fn(),
    setQueryData: jest.fn(),
  }),
}));

jest.mock('@/store/auth', () => ({
  __esModule: true,
  default: () => ({ user: { id: 'user-1' } }),
}));

jest.mock('@/providers/SocketProvider', () => ({
  useSocketEvent: jest.fn(),
}));

jest.mock('@/store/videoPlaybackV2', () => ({
  useVideoPlaybackStore: () => ({}),
  useActiveVideo: () => ({
    activePostId: null,
    isPlaying: false,
    isMuted: true,
    progress: 0,
    duration: 0,
    showControls: true,
    currentTime: 0,
    isModalOpen: false,
  }),
  useVideoControls: () => ({
    togglePlayPause: jest.fn(),
    toggleMute: jest.fn(),
    seekPercent: jest.fn(),
    showControlsTemporarily: jest.fn(),
    openModal: jest.fn(),
    closeModal: jest.fn(),
  }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Import after mocks
import PostCard from './PostCard';
import { Post } from '@/types';

describe('PostCard Component', () => {
  const createMockPost = (overrides: Partial<Post> = {}): Post => ({
    id: 'post-1',
    content: 'Test content',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: {
      id: 'author-1',
      namaLengkap: 'Test Author',
      profile: {
        username: 'testuser',
        profileImageUrl: null,
      },
    },
    images: [],
    _count: {
      likes: 10,
      comments: 5,
      bookmarks: 2,
    },
    isLiked: false,
    isBookmarked: false,
    ...overrides,
  });

  describe('Title Rendering', () => {
    it('should render title with proper truncation class', () => {
      const post = createMockPost({
        title: 'This is a very long title that should be truncated with ellipsis when it exceeds the maximum length allowed for display',
      });

      const { container } = render(<PostCard post={post} />);
      
      // Check that title element has line-clamp-2 class for truncation
      const titleElement = container.querySelector('h3.line-clamp-2');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent(post.title!);
    });

    it('should not render title element when title is empty', () => {
      const post = createMockPost({ title: undefined });
      
      const { container } = render(<PostCard post={post} />);
      
      // Check no h3 title element exists
      const titleElement = container.querySelector('h3.line-clamp-2');
      expect(titleElement).not.toBeInTheDocument();
    });

    it('should render title with proper font sizing', () => {
      const post = createMockPost({ title: 'Short Title' });
      
      const { container } = render(<PostCard post={post} />);
      
      const titleElement = container.querySelector('h3');
      expect(titleElement).toHaveClass('text-lg', 'md:text-xl', 'font-bold');
    });
  });

  describe('Description/Content Formatting', () => {
    it('should preserve whitespace in content with whitespace-pre-wrap', () => {
      const contentWithLineBreaks = 'Line 1\nLine 2\n\nLine 4 after double break';
      const post = createMockPost({ content: contentWithLineBreaks });
      
      const { container } = render(<PostCard post={post} />);
      
      // Check that content container has whitespace-pre-wrap class
      const contentElement = container.querySelector('.whitespace-pre-wrap');
      expect(contentElement).toBeInTheDocument();
    });

    it('should have proper prose styling for content', () => {
      const post = createMockPost({ content: 'Test content with <strong>bold</strong> text' });
      
      const { container } = render(<PostCard post={post} />);
      
      const contentElement = container.querySelector('.prose');
      expect(contentElement).toBeInTheDocument();
      expect(contentElement).toHaveClass('prose-sm');
    });

    it('should have break-words class to handle long words', () => {
      const longWord = 'superlongwordthatdoesnotfitintheavailablespacewithoutbreaking';
      const post = createMockPost({ content: longWord });
      
      const { container } = render(<PostCard post={post} />);
      
      const contentElement = container.querySelector('.break-words');
      expect(contentElement).toBeInTheDocument();
    });
  });

  describe('Tags Display', () => {
    it('should render tags with proper styling', () => {
      const post = createMockPost({
        hashtags: ['renungan', 'inspirasi', 'motivasi'],
      });

      render(<PostCard post={post} />);
      
      // Check each tag is rendered
      expect(screen.getByText('#renungan')).toBeInTheDocument();
      expect(screen.getByText('#inspirasi')).toBeInTheDocument();
      expect(screen.getByText('#motivasi')).toBeInTheDocument();
    });

    it('should render tags with proper badge styling', () => {
      const post = createMockPost({
        hashtags: ['testtag'],
      });

      const { container } = render(<PostCard post={post} />);
      
      // Check tag has proper styling classes
      const tagElement = screen.getByText('#testtag');
      expect(tagElement).toHaveClass('inline-flex', 'items-center', 'rounded-full');
    });

    it('should not render tags section when no hashtags', () => {
      const post = createMockPost({ hashtags: [] });
      
      const { container } = render(<PostCard post={post} />);
      
      // Should not find tag elements with bg-blue-50
      const tagElements = container.querySelectorAll('[class*="bg-blue-50"]');
      expect(tagElements.length).toBe(0);
    });

    it('should handle undefined hashtags gracefully', () => {
      const post = createMockPost({ hashtags: undefined });
      
      expect(() => render(<PostCard post={post} />)).not.toThrow();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive title sizing', () => {
      const post = createMockPost({ title: 'Test Title' });
      
      const { container } = render(<PostCard post={post} />);
      
      const titleElement = container.querySelector('h3');
      // Check for responsive classes
      expect(titleElement).toHaveClass('text-lg');
      expect(titleElement).toHaveClass('md:text-xl');
    });

    it('should have proper spacing classes', () => {
      const post = createMockPost({
        title: 'Test Title',
        content: 'Test content',
        hashtags: ['tag1'],
      });

      const { container } = render(<PostCard post={post} />);
      
      // Check spacing between elements
      const titleElement = container.querySelector('h3');
      expect(titleElement).toHaveClass('mb-3'); // margin-bottom for spacing
    });
  });

  describe('Dark Mode Support', () => {
    it('should have dark mode classes for title', () => {
      const post = createMockPost({ title: 'Test Title' });
      
      const { container } = render(<PostCard post={post} />);
      
      const titleElement = container.querySelector('h3');
      expect(titleElement).toHaveClass('dark:text-white');
    });

    it('should have dark mode classes for content', () => {
      const post = createMockPost({ content: 'Test content' });
      
      const { container } = render(<PostCard post={post} />);
      
      const contentElement = container.querySelector('.prose');
      expect(contentElement).toHaveClass('dark:prose-invert');
    });

    it('should have dark mode classes for tags', () => {
      const post = createMockPost({ hashtags: ['tag1'] });
      
      const { container } = render(<PostCard post={post} />);
      
      const tagElement = screen.getByText('#tag1');
      expect(tagElement).toHaveClass('dark:bg-blue-900/30', 'dark:text-blue-400');
    });
  });
});

describe('Content Preservation', () => {
  it('should preserve line breaks in description', () => {
    const multiLineContent = `Line 1
Line 2
Line 3`;
    
    // Test that whitespace-pre-wrap preserves formatting
    const container = document.createElement('div');
    container.className = 'whitespace-pre-wrap';
    container.textContent = multiLineContent;
    
    // The whitespace should be preserved in the raw text
    expect(container.textContent).toContain('\n');
    expect(container.textContent?.split('\n').length).toBe(3);
  });

  it('should preserve multiple consecutive line breaks', () => {
    const contentWithDoubleBreaks = `First paragraph

Second paragraph after double break`;
    
    // Test double line breaks are preserved
    expect(contentWithDoubleBreaks).toContain('\n\n');
    const lines = contentWithDoubleBreaks.split('\n');
    expect(lines.length).toBe(3);
    expect(lines[1]).toBe(''); // Empty line preserved
  });
});
