# Table Styling - CSS Class Reference

## Quick Styling Guide

All table styling uses **Tailwind CSS** classes applied to MarkdownComponents.

### Component Styling Classes

#### Table Wrapper (Container)
```
my-4 overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-700
```

**Breakdown**:
- `my-4` - Vertical margin (16px)
- `overflow-x-auto` - Horizontal scroll on small screens
- `rounded-lg` - Rounded corners
- `border` - Add border
- `border-slate-300` - Light mode border color
- `dark:border-slate-700` - Dark mode border color

#### Table Element
```
w-full border-collapse bg-white dark:bg-slate-900
```

**Breakdown**:
- `w-full` - Full width
- `border-collapse` - Collapse table borders
- `bg-white` - Light mode background
- `dark:bg-slate-900` - Dark mode background

#### Table Head (thead)
```
bg-slate-100 dark:bg-slate-800
```

**Breakdown**:
- `bg-slate-100` - Light gray header background
- `dark:bg-slate-800` - Darker header background

#### Table Body (tbody)
```
divide-y divide-slate-200 dark:divide-slate-700
```

**Breakdown**:
- `divide-y` - Add horizontal dividers between rows
- `divide-slate-200` - Light divider color
- `dark:divide-slate-700` - Dark divider color

#### Table Row (tr)
```
divide-x divide-slate-200 dark:divide-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors
```

**Breakdown**:
- `divide-x` - Add vertical dividers between columns
- `divide-slate-200` - Light column divider
- `dark:divide-slate-700` - Dark column divider
- `hover:bg-slate-50` - Light hover background
- `dark:hover:bg-slate-800/50` - Dark hover background (50% opacity)
- `transition-colors` - Smooth color transition on hover

#### Table Header Cell (th)
```
px-4 py-3 text-left font-bold text-slate-900 dark:text-white whitespace-nowrap text-sm
```

**Breakdown**:
- `px-4` - Horizontal padding (16px)
- `py-3` - Vertical padding (12px)
- `text-left` - Left-align text
- `font-bold` - Bold font weight
- `text-slate-900` - Dark text in light mode
- `dark:text-white` - White text in dark mode
- `whitespace-nowrap` - Prevent header text wrapping
- `text-sm` - Small font size

#### Table Data Cell (td)
```
px-4 py-3 text-slate-700 dark:text-slate-300 text-sm whitespace-normal break-words
```

**Breakdown**:
- `px-4` - Horizontal padding (16px)
- `py-3` - Vertical padding (12px)
- `text-slate-700` - Gray text in light mode
- `dark:text-slate-300` - Light gray text in dark mode
- `text-sm` - Small font size
- `whitespace-normal` - Allow normal text wrapping
- `break-words` - Break long words to prevent overflow

---

## Customization Examples

### Change Header Color
```jsx
thead: ({ ...props }) => (
  <thead className="bg-blue-100 dark:bg-blue-900" {...props} />
)
```

### Change Row Hover Color
```jsx
tr: ({ children, ...props }) => (
  <tr 
    className="... hover:bg-green-50 dark:hover:bg-green-900/20 ..." 
    {...props}
  >
    {children}
  </tr>
)
```

### Increase Cell Padding
```jsx
th: ({ ...props }) => (
  <th className="px-6 py-4 ..." {...props} />
)
```

### Change Table Border Color
```jsx
table: ({ ...props }) => (
  <div className="... border-2 border-blue-400 dark:border-blue-600 ...">
    <table className="..." {...props} />
  </div>
)
```

### Add Row Striping (Alternating Colors)
```jsx
tr: ({ children, index, ...props }) => (
  <tr 
    className={`... ${index % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/30' : ''} ...`}
    {...props}
  >
    {children}
  </tr>
)
```

---

## Tailwind Color Reference

### Slate (Default Used)
- **Light**: `slate-50`, `slate-100`, `slate-200`, `slate-300`
- **Dark**: `slate-700`, `slate-800`, `slate-900`

### Alternative Colors
- **Blue**: `blue-50`, `blue-100`, `blue-200`, ..., `blue-900`
- **Gray**: `gray-50`, `gray-100`, `gray-200`, ..., `gray-900`
- **Slate**: `slate-50`, `slate-100`, `slate-200`, ..., `slate-900`
- **Stone**: `stone-50`, `stone-100`, `stone-200`, ..., `stone-900`

### Using Alternative Colors
Replace `slate` with any color name:
```jsx
// Using blue instead of slate
"border-blue-300 dark:border-blue-700"
"bg-blue-100 dark:bg-blue-800"
"text-blue-900 dark:text-blue-100"
```

---

## Responsive Sizing

### Padding Options
- `px-1` - 4px
- `px-2` - 8px
- `px-3` - 12px
- `px-4` - 16px (current)
- `px-5` - 20px
- `px-6` - 24px
- `px-8` - 32px

### Font Sizes
- `text-xs` - 12px
- `text-sm` - 14px (current)
- `text-base` - 16px
- `text-lg` - 18px
- `text-xl` - 20px

### Margins
- `my-2` - 8px vertical
- `my-3` - 12px vertical
- `my-4` - 16px vertical (current)
- `my-6` - 24px vertical
- `my-8` - 32px vertical

---

## Spacing Example

Current spacing:
- Header padding: `px-4 py-3` = 16px horizontal, 12px vertical
- Cell padding: same as headers
- Row gap: 0 (seamless)
- Margin around table: `my-4` = 16px vertical

To increase spacing:
```jsx
th: ({ ...props }) => (
  <th className="px-6 py-4 ..." {...props} />  // Larger padding
)
```

To decrease spacing:
```jsx
th: ({ ...props }) => (
  <th className="px-2 py-2 ..." {...props} />  // Smaller padding
)
```

---

## Current Implementation

The current implementation in `app/(dashboard)/ai-assistant/page.tsx`:

```jsx
table: ({ ...props }: any) => (
  <div className="my-4 overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-700">
    <table className="w-full border-collapse bg-white dark:bg-slate-900" {...props} />
  </div>
),
thead: ({ ...props }: any) => (
  <thead className="bg-slate-100 dark:bg-slate-800" {...props} />
),
tbody: ({ ...props }: any) => (
  <tbody className="divide-y divide-slate-200 dark:divide-slate-700" {...props} />
),
tr: ({ children, ...props }: any) => (
  <tr 
    className="divide-x divide-slate-200 dark:divide-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" 
    {...props}
  >
    {children}
  </tr>
),
th: ({ ...props }: any) => (
  <th 
    className="px-4 py-3 text-left font-bold text-slate-900 dark:text-white whitespace-nowrap text-sm"
    {...props} 
  />
),
td: ({ ...props }: any) => (
  <td 
    className="px-4 py-3 text-slate-700 dark:text-slate-300 text-sm whitespace-normal break-words"
    {...props} 
  />
),
```

---

## Testing Custom Styles

To test changes:

1. Update the MarkdownComponents in `app/(dashboard)/ai-assistant/page.tsx`
2. Save file (hot reload will apply)
3. Send test message: `"My cat hasn't eaten in 24 hours..."`
4. View styled table with your changes

---

## Dark Mode Testing

To test dark mode:

1. Run `npm run dev`
2. Toggle dark mode in the UI
3. Table should smoothly transition to dark colors
4. All text should remain readable

---

## Best Practices

✅ Keep padding consistent (th and td should match)  
✅ Use complementary colors for light/dark modes  
✅ Test on small screens (DevTools device mode)  
✅ Verify hover effects are smooth  
✅ Ensure text contrast is readable  
✅ Keep font sizes consistent  

---

## Tailwind Documentation References

- [Tailwind Padding](https://tailwindcss.com/docs/padding)
- [Tailwind Colors](https://tailwindcss.com/docs/customizing-colors)
- [Tailwind Font Size](https://tailwindcss.com/docs/font-size)
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Tailwind Hover](https://tailwindcss.com/docs/hover-focus-and-other-states)

---

## Summary

All table styling is done through Tailwind CSS classes applied in the MarkdownComponents object. Easy to customize and modify!
