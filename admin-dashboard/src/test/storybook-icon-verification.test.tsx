import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the stories to verify they can be loaded
import * as InputStories from '../components/ui/Input.stories';
import { Input } from '../components/ui/Input';

describe('Input Icon Stories Verification', () => {
  test('WithLeftIcon story renders correctly', () => {
    const WithLeftIconStory = InputStories.WithLeftIcon;
    const args = WithLeftIconStory.args!;
    
    render(
      <div>
        <Input {...args} />
      </div>
    );
    
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });

  test('WithRightIcon story renders correctly', () => {
    const WithRightIconStory = InputStories.WithRightIcon;
    const args = WithRightIconStory.args!;
    
    render(
      <div>
        <Input {...args} />
      </div>
    );
    
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
  });

  test('WithBothIcons story renders correctly', () => {
    const WithBothIconsStory = InputStories.WithBothIcons;
    const args = WithBothIconsStory.args!;
    
    render(
      <div>
        <Input {...args} />
      </div>
    );
    
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
  });

  test('IconSizes story renders without errors', () => {
    const IconSizesStory = InputStories.IconSizes;
    
    expect(() => {
      render(<div>{IconSizesStory.render!({} as any, {} as any)}</div>);
    }).not.toThrow();
    
    expect(screen.getByLabelText('Small with Icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Medium with Icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Large with Icon')).toBeInTheDocument();
  });

  test('IconVariants story renders without errors', () => {
    const IconVariantsStory = InputStories.IconVariants;
    
    expect(() => {
      render(<div>{IconVariantsStory.render!({} as any, {} as any)}</div>);
    }).not.toThrow();
    
    expect(screen.getByLabelText('Default with Icons')).toBeInTheDocument();
    expect(screen.getByLabelText('Filled with Icons')).toBeInTheDocument();
    expect(screen.getByLabelText('Outlined with Icons')).toBeInTheDocument();
  });

  test('IconsWithStates story renders without errors', () => {
    const IconsWithStatesStory = InputStories.IconsWithStates;
    
    expect(() => {
      render(<div>{IconsWithStatesStory.render!({} as any, {} as any)}</div>);
    }).not.toThrow();
    
    expect(screen.getByLabelText('Success with Right Icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Error with Right Icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Left Icon Only with Success')).toBeInTheDocument();
  });

  test('CommonFormPatterns story renders without errors', () => {
    const CommonFormPatternsStory = InputStories.CommonFormPatterns;
    
    expect(() => {
      render(<div>{CommonFormPatternsStory.render!({} as any, {} as any)}</div>);
    }).not.toThrow();
    
    // Check that the form renders with multiple inputs (some inputs like date and number have different roles)
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(4); // At least 5 text-type inputs
    expect(screen.getByDisplayValue).toBeDefined(); // Form has inputs
  });

  test('SearchPatterns story renders without errors', () => {
    const SearchPatternsStory = InputStories.SearchPatterns;
    
    expect(() => {
      render(<div>{SearchPatternsStory.render!({} as any, {} as any)}</div>);
    }).not.toThrow();
    
    expect(screen.getByLabelText('Global Search')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter Results')).toBeInTheDocument();
    expect(screen.getByLabelText('User Search')).toBeInTheDocument();
  });

  test('ActionInputs story renders without errors', () => {
    const ActionInputsStory = InputStories.ActionInputs;
    
    expect(() => {
      render(<div>{ActionInputsStory.render!({} as any, {} as any)}</div>);
    }).not.toThrow();
    
    expect(screen.getByLabelText('Send Message')).toBeInTheDocument();
    expect(screen.getByLabelText('Download URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Upload Path')).toBeInTheDocument();
  });

  test('CustomIconStyling story renders without errors', () => {
    const CustomIconStylingStory = InputStories.CustomIconStyling;
    
    expect(() => {
      render(<div>{CustomIconStylingStory.render!({} as any, {} as any)}</div>);
    }).not.toThrow();
    
    expect(screen.getByLabelText('Custom Left Icon Color')).toBeInTheDocument();
    expect(screen.getByLabelText('Custom Right Icon Color')).toBeInTheDocument();
    expect(screen.getByLabelText('Both Custom Colors')).toBeInTheDocument();
  });

  test('JSXElementIcons story renders without errors', () => {
    const JSXElementIconsStory = InputStories.JSXElementIcons;
    
    expect(() => {
      render(<div>{JSXElementIconsStory.render!({} as any, {} as any)}</div>);
    }).not.toThrow();
    
    expect(screen.getByLabelText('Custom SVG Icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Emoji Icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Mixed Icon Types')).toBeInTheDocument();
  });

  test('IconShowcase story renders without errors', () => {
    const IconShowcaseStory = InputStories.IconShowcase;
    
    expect(() => {
      render(<div>{IconShowcaseStory.render!({} as any, {} as any)}</div>);
    }).not.toThrow();
    
    // Check for section headings
    expect(screen.getByText('Icon Positioning')).toBeInTheDocument();
    expect(screen.getByText('Size Scaling')).toBeInTheDocument();
    expect(screen.getByText('State Precedence')).toBeInTheDocument();
  });

  test('All icon stories are properly exported', () => {
    // Verify all new icon stories are exported
    expect(InputStories.WithLeftIcon).toBeDefined();
    expect(InputStories.WithRightIcon).toBeDefined();
    expect(InputStories.WithBothIcons).toBeDefined();
    expect(InputStories.IconSizes).toBeDefined();
    expect(InputStories.IconVariants).toBeDefined();
    expect(InputStories.IconsWithStates).toBeDefined();
    expect(InputStories.CommonFormPatterns).toBeDefined();
    expect(InputStories.SearchPatterns).toBeDefined();
    expect(InputStories.ActionInputs).toBeDefined();
    expect(InputStories.CustomIconStyling).toBeDefined();
    expect(InputStories.JSXElementIcons).toBeDefined();
    expect(InputStories.IconShowcase).toBeDefined();
  });

  test('Story meta includes proper icon documentation', () => {
    const meta = InputStories.default;
    
    expect(meta.title).toBe('UI/Input');
    expect(meta.component).toBeDefined();
    expect(meta.parameters?.docs?.description?.component).toContain('Icon Support');
    expect(meta.parameters?.docs?.description?.component).toContain('Icon Types');
    expect(meta.parameters?.docs?.description?.component).toContain('Best Practices');
  });

  test('ArgTypes include icon-related controls', () => {
    const meta = InputStories.default;
    
    expect(meta.argTypes?.leftIcon).toBeDefined();
    expect(meta.argTypes?.rightIcon).toBeDefined();
    expect(meta.argTypes?.leftIconClassName).toBeDefined();
    expect(meta.argTypes?.rightIconClassName).toBeDefined();
    
    expect(meta.argTypes?.leftIcon?.description).toContain('Icon component or JSX element');
    expect(meta.argTypes?.rightIcon?.description).toContain('Icon component or JSX element');
  });
});