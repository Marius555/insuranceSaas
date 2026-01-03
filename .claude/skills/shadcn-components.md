# Shadcn/ui Components & Blocks Skill

This skill provides guidance for working with shadcn/ui components and blocks in React projects.

## Overview

shadcn/ui is a collection of beautifully designed, accessible components that you can copy and customize. Unlike traditional component libraries, shadcn/ui components are added directly to your project, giving you full control over the code.

**Key Philosophy**: Components are **not** installed as a dependency. Instead, they're copied into your project where you can modify them freely.

## Installation & Setup

### Prerequisites
- A React framework (Next.js, Vite, Remix, Astro, etc.)
- Tailwind CSS configured in the project
- TypeScript or JavaScript support

### Initial Setup

1. **Initialize shadcn/ui in your project:**
   ```bash
   npx shadcn@latest init
   ```

   This command:
   - Creates `components.json` configuration file
   - Installs required dependencies
   - Adds the `cn` utility function
   - Configures CSS variables for theming

2. **Configuration Options During Init:**
   - **Style**: Choose visual style (use current style, not "default" which is deprecated)
   - **Base Color**: neutral, gray, zinc, stone, slate
   - **CSS Variables**: Use CSS variables (true) vs utility classes (false)
   - **RSC**: Enable React Server Components support
   - **TypeScript**: Use .tsx vs .jsx files
   - **Tailwind Prefix**: Optional prefix for utility classes
   - **Path Aliases**: Configure component and utility paths

## Components.json Configuration

The `components.json` file is the central configuration:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### Important Configuration Notes:
- **Cannot be changed after init**: `style`, `baseColor`, `cssVariables`
- To change these, you must delete components and reinstall
- Path aliases must match your `tsconfig.json` or `jsconfig.json`

## CLI Commands

### 1. Add Components

**Add a single component:**
```bash
npx shadcn@latest add button
```

**Add multiple components:**
```bash
npx shadcn@latest add button card dialog
```

**Add all components:**
```bash
npx shadcn@latest add --all
```

**Add with options:**
```bash
# Skip confirmation
npx shadcn@latest add button -y

# Overwrite existing files
npx shadcn@latest add button --overwrite

# Custom installation path
npx shadcn@latest add button --path ./src/custom
```

### 2. View Components Before Installing

```bash
# View single component
npx shadcn@latest view button

# View multiple components
npx shadcn@latest view button card dialog

# View from namespaced registries
npx shadcn@latest view @acme/auth
```

### 3. Search Components

```bash
# Search with query
npx shadcn@latest search -q "button"

# Search with limit
npx shadcn@latest search -q "form" --limit 10

# Search in specific registry
npx shadcn@latest search @shadcn -q "table"
```

### 4. List All Components

```bash
npx shadcn@latest list
```

## Working with Blocks

### What are Blocks?

Blocks are **pre-built, production-ready page sections** that combine multiple components into complete features:
- Dashboard layouts
- Authentication pages
- Sidebar navigation
- Calendar interfaces
- Data tables with charts

### Adding Blocks

```bash
# Add a specific block
npx shadcn add dashboard-01

# Add login block
npx shadcn add login-01
```

### Block Structure

Blocks typically include:
- Multiple component files
- Page templates (`/app/dashboard/page.tsx`)
- Data files (`data.json`)
- Composed UI demonstrating best practices

## Component Categories

### Form Components
- input, textarea, label
- select, combobox, command
- checkbox, radio-group, switch
- form (with react-hook-form integration)
- date-picker, calendar

### Layout Components
- card, separator
- sidebar, sheet, drawer
- tabs, accordion, collapsible
- resizable, scroll-area

### Data Display
- table, data-table
- pagination
- badge, avatar
- chart (with recharts)

### Interactive Elements
- button, toggle, toggle-group
- dialog, alert-dialog
- dropdown-menu, context-menu
- tooltip, popover, hover-card

### Navigation
- breadcrumb, navigation-menu
- menubar, command

### Feedback
- alert, toast, sonner
- progress, skeleton

## Custom Registries

You can configure custom or private registries in `components.json`:

```json
{
  "registries": {
    "@acme": {
      "url": "https://registry.acme.com/registry/{name}.json",
      "auth": {
        "type": "bearer",
        "token": "${ACME_TOKEN}"
      }
    }
  }
}
```

Then install from custom registry:
```bash
npx shadcn@latest add @acme/custom-button
```

## Best Practices

### 1. **Always Read Components First**
Before modifying a component, read the existing file to understand:
- Component structure
- Dependencies
- Props interface
- Styling approach

### 2. **Use Existing Components**
Check installed components before adding new ones:
```bash
ls components/ui/
```

### 3. **Maintain Consistent Styling**
- Follow the existing `cn()` utility pattern
- Use CSS variables for theming
- Keep Tailwind utility classes consistent

### 4. **Component Composition**
- Build complex components by composing smaller ones
- Follow the existing patterns in blocks
- Maintain accessibility attributes

### 5. **Respect the Configuration**
- Don't manually change immutable config options
- Keep path aliases consistent with tsconfig.json
- Use the same style across all components

## Common Workflows

### Adding a New Feature with Multiple Components

```bash
# 1. Check what components you need
npx shadcn@latest search -q "form"

# 2. Add required components
npx shadcn@latest add form input button label

# 3. Use block as reference (optional)
npx shadcn add login-01
```

### Updating Components

```bash
# Overwrite with latest version
npx shadcn@latest add button --overwrite
```

### Creating Custom Components Based on Shadcn

1. Start with a similar shadcn component
2. Copy it to a new file in `components/`
3. Modify the component logic and styling
4. Keep the same composition patterns

## Integration with React Hook Form

Many form components work seamlessly with react-hook-form:

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Use Form components with react-hook-form
<Form {...form}>
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
      </FormItem>
    )}
  />
</Form>
```

## Troubleshooting

### Component Not Found
- Check registry URL is accessible
- Verify component name is correct
- Try: `npx shadcn@latest search -q "component-name"`

### Style Mismatch
- Ensure all components use the same style configuration
- Reinstall components if you changed `baseColor` or `cssVariables`

### Import Errors
- Verify path aliases in `tsconfig.json` match `components.json`
- Check that all dependencies are installed
- Ensure `@/lib/utils` exports the `cn` function

### CLI Fails
- Update to latest version: `npm install -g shadcn@latest`
- Check internet connection for registry access
- Verify `components.json` is valid JSON

## Advanced Usage

### Building Custom Registry

```bash
# Create registry JSON files
npx shadcn@latest build --output ./public/registry
```

### Using with Monorepos

```bash
# Initialize with monorepo template
npx shadcn@latest init --template next-monorepo
```

### Server Components (RSC)

When `rsc: true` in config:
- CLI automatically adds `"use client"` to client components
- Server components have no directive
- Maintain proper client/server boundary

## File Locations

After installation, components are typically found at:
- **UI Components**: `components/ui/` or `src/components/ui/`
- **Utilities**: `lib/utils.ts` or `src/lib/utils.ts`
- **Hooks**: `hooks/` or `src/hooks/`
- **Blocks**: Various locations depending on block type

## Resources

- **Documentation**: https://ui.shadcn.com/docs
- **Components**: https://ui.shadcn.com/docs/components
- **Blocks**: https://ui.shadcn.com/blocks
- **Examples**: https://ui.shadcn.com/examples
- **CLI Reference**: https://ui.shadcn.com/docs/cli
- **Themes**: https://ui.shadcn.com/themes

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npx shadcn@latest init` | Initialize project |
| `npx shadcn@latest add [component]` | Add component(s) |
| `npx shadcn@latest add --all` | Add all components |
| `npx shadcn@latest view [component]` | Preview before installing |
| `npx shadcn@latest search -q "query"` | Search components |
| `npx shadcn@latest list` | List all available |
| `npx shadcn add [block-name]` | Add block |

## Example: Complete Setup

```bash
# 1. Initialize (in existing Next.js project)
npx shadcn@latest init

# 2. Add commonly used components
npx shadcn@latest add button input label card

# 3. Add form components for validation
npx shadcn@latest add form

# 4. Add feedback components
npx shadcn add sonner

# 5. Add a dashboard block as reference
npx shadcn add dashboard-01
```

## Notes for Claude Code

When working with shadcn/ui:

1. **Always check existing components** before adding new ones
2. **Read component code** to understand structure before modifying
3. **Maintain consistency** with existing styling and patterns
4. **Use the CLI** for installing components, not manual copying
5. **Respect immutable config** - don't manually change style, baseColor, or cssVariables
6. **Follow composition patterns** seen in blocks and examples
7. **Keep accessibility** - shadcn components are accessible by default, maintain that
8. **Use TypeScript types** - components have proper type definitions
9. **Leverage blocks** as examples of best practices
10. **Check documentation** if component behavior is unclear
