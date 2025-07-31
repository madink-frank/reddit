import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardContent, CardFooter, BlogPostCard } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible card component with multiple variants and composable parts. Perfect for displaying content in a structured format.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined', 'ghost'],
      description: 'Visual style variant of the card',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Internal padding of the card',
    },
    hover: {
      control: 'boolean',
      description: 'Enables hover effects',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This is a default card with some content inside.',
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: 'This is an elevated card with enhanced shadow.',
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: 'This is an outlined card with a prominent border.',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'This is a ghost card with no background or border.',
  },
};

export const WithHover: Story = {
  args: {
    hover: true,
    children: 'Hover over this card to see the effect.',
  },
};

export const NoPadding: Story = {
  args: {
    padding: 'none',
    children: 'This card has no internal padding.',
  },
};

export const LargePadding: Story = {
  args: {
    padding: 'lg',
    children: 'This card has large internal padding.',
  },
};

// Composite Card Story
export const CompositeCard: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader
        title="Card Title"
        subtitle="Card subtitle with additional information"
        action={
          <Button size="sm" variant="outline">
            Action
          </Button>
        }
      />
      <CardContent>
        <p>This is the main content of the card. It can contain any type of content including text, images, or other components.</p>
      </CardContent>
      <CardFooter justify="between">
        <Badge variant="primary">Status</Badge>
        <span className="text-sm text-neutral-500">2 hours ago</span>
      </CardFooter>
    </Card>
  ),
};

// Blog Post Card Stories
const blogPostMeta: Meta<typeof BlogPostCard> = {
  title: 'UI/BlogPostCard',
  component: BlogPostCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A specialized card component designed for displaying blog post previews with rich metadata.',
      },
    },
  },
  tags: ['autodocs'],
};

export const BlogPostDefault: StoryObj<typeof BlogPostCard> = {
  ...blogPostMeta,
  args: {
    post: {
      id: 1,
      title: 'Understanding React Hooks',
      content: 'Full content here...',
      excerpt: 'Learn how to use React Hooks effectively in your applications. This comprehensive guide covers useState, useEffect, and custom hooks with practical examples.',
      slug: 'understanding-react-hooks',
      author: 'Jane Doe',
      publishedAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      tags: ['React', 'JavaScript', 'Frontend'],
      category: 'Technology',
      readingTime: 5,
      featured: false,
      metadata: {},
    },
  },
};

export const BlogPostWithImage: StoryObj<typeof BlogPostCard> = {
  ...blogPostMeta,
  args: {
    post: {
      id: 2,
      title: 'The Future of Web Development',
      content: 'Full content here...',
      excerpt: 'Exploring emerging trends and technologies that will shape the future of web development in the coming years.',
      slug: 'future-of-web-development',
      author: 'John Smith',
      publishedAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z',
      tags: ['Web Development', 'Technology', 'Trends'],
      category: 'Technology',
      readingTime: 8,
      featured: true,
      metadata: {
        socialImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop',
      },
    },
  },
};

export const BlogPostMinimal: StoryObj<typeof BlogPostCard> = {
  ...blogPostMeta,
  args: {
    post: {
      id: 3,
      title: 'Quick Tips for Better CSS',
      content: 'Full content here...',
      excerpt: 'Simple but effective CSS tips that will improve your styling workflow.',
      slug: 'quick-tips-better-css',
      author: 'CSS Expert',
      publishedAt: '2024-01-25T10:00:00Z',
      updatedAt: '2024-01-25T10:00:00Z',
      tags: ['CSS', 'Tips'],
      category: 'Development',
      readingTime: 3,
      featured: false,
      metadata: {},
    },
  },
};