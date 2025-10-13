# SPA Template

A modern React Single Page Application template with dynamic loader functionality for easy embedding in any webpage.

## Features

- ⚡ **Vite + React + TypeScript** - Fast development and production builds
- 🎨 **Tailwind CSS v4** - Modern styling with the new Oxide engine
- 📦 **Dynamic Asset Loading** - Smart loader script that handles asset resolution
- 🚀 **GitHub Pages Ready** - Automatic deployment with dynamic URL configuration
- 🔧 **Embeddable** - Load your SPA in any webpage with a simple script tag
- 📱 **Responsive** - Mobile-first design approach

## Quick Start

### 1. Use This Template

Click "Use this template" on GitHub or clone this repository:

```bash
git clone https://github.com/johnkraczek/spa-template.git my-spa-project
cd my-spa-project
npm install
```

### 2. Development

Start the development server:

```bash
npm run dev
```

Your app will be available at `http://localhost:5173/`

### 3. Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

### 4. Deploy to GitHub Pages

This template includes automatic GitHub Pages deployment. Simply:

1. Push your code to GitHub
2. The GitHub Actions workflow will automatically build and deploy your app
3. Your app will be available at `https://yourusername.github.io/your-repo-name/`

## Using the SPA Loader

The most powerful feature of this template is the ability to embed your React application in any webpage using a simple loader script.

### Basic Usage

Include your SPA in any HTML page:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <h1>Welcome to My Website</h1>
    
    <!-- Your SPA will load here -->
    <div id="root"></div>
    
    <!-- Load the SPA -->
    <script src="https://yourusername.github.io/your-repo-name/loader.js"></script>
</body>
</html>
```

### Advanced Configuration

You can configure the loader behavior:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <!-- Configure the loader before loading it -->
    <script>
        window.SpaLoaderConfig = {
            baseUrl: 'https://yourusername.github.io/your-repo-name',
            containerSelector: '.spa-mount',     // CSS selector for container(s)
            mountStrategy: 'first',              // 'first', 'last', or 'all'
            showErrors: true
        };
    </script>
    
    <!-- Custom container -->
    <div class="spa-mount"></div>
    
    <!-- Load the SPA -->
    <script src="https://yourusername.github.io/your-repo-name/loader.js"></script>
</body>
</html>
```

### Configuration Options

The `SpaLoaderConfig` object supports the following options:

- **`baseUrl`** (string): The base URL where your SPA assets are hosted
- **`containerSelector`** (string): CSS selector for container element(s) (default: '#root')
- **`mountStrategy`** (string): How to handle multiple matching containers:
  - `'first'` - Mount in the first matching element (default)
  - `'last'` - Mount in the last matching element  
  - `'all'` - Mount in all matching elements
- **`showErrors`** (boolean): Whether to show error messages in the UI (default: true)

### Selector Examples

```javascript
// Mount in element with ID 'root'
containerSelector: '#root'

// Mount in first element with class 'spa-container'
containerSelector: '.spa-container'

// Mount in element with data attribute
containerSelector: '[data-spa="main"]'

// Mount in nested element
containerSelector: '.dashboard .widget-area'

// Mount in all elements with class 'spa-widget'
containerSelector: '.spa-widget'
mountStrategy: 'all'
```

## How It Works

### Asset Resolution

The loader script automatically:

1. **Fetches the manifest** - Reads the Vite-generated manifest to find asset locations
2. **Resolves asset URLs** - Ensures all images, CSS, and JS files load from the correct base URL
3. **Handles dynamic imports** - Patches image loading to work across different domains
4. **Provides fallbacks** - Shows helpful error messages if something goes wrong

### Build Process

When you run `npm run build`:

1. Vite builds your React application
2. A manifest file is generated with asset mappings
3. The example HTML file is copied to show usage
4. GitHub Actions automatically updates URLs for your specific repository

## Project Structure

```
spa-template/
├── public/
│   ├── index.html          # Example usage page
│   └── loader.js           # Smart loader script
├── src/
│   ├── app/
│   │   └── index.tsx       # Main app component
│   ├── components/         # React components
│   ├── lib/                # Utilities
│   └── main.tsx           # App entry point
├── dist/                   # Built files (generated)
├── .github/
│   └── workflows/
│       └── deploy.yml      # Auto-deployment
└── vite.config.ts         # Build configuration
```

## Examples

### E-commerce Integration

```html
<!-- Embed your SPA in an existing e-commerce site -->
<div class="product-configurator">
    <h2>Customize Your Product</h2>
    <div class="spa-mount"></div>
</div>

<script>
    window.SpaLoaderConfig = {
        containerSelector: '.product-configurator .spa-mount',
        baseUrl: 'https://yourcompany.github.io/product-configurator'
    };
</script>
<script src="https://yourcompany.github.io/product-configurator/loader.js"></script>
```

### WordPress Integration

```php
<!-- In your WordPress theme -->
<div class="wp-block">
    <div class="react-widget"></div>
</div>

<script>
    window.SpaLoaderConfig = {
        containerSelector: '.react-widget',
        baseUrl: '<?php echo get_theme_mod('spa_base_url'); ?>'
    };
</script>
<script src="<?php echo get_theme_mod('spa_base_url'); ?>/loader.js"></script>
```

### Multiple SPAs on One Page

```html
<!-- Load different SPAs in different containers -->
<div class="dashboard">
    <div class="widget analytics-widget" data-spa="analytics"></div>
    <div class="widget user-widget" data-spa="users"></div>
</div>

<script>
    // Load analytics SPA
    window.SpaLoaderConfig = {
        containerSelector: '[data-spa="analytics"]',
        baseUrl: 'https://company.github.io/analytics-spa'
    };
</script>
<script src="https://company.github.io/analytics-spa/loader.js"></script>

<script>
    // Load user management SPA  
    window.SpaLoaderConfig = {
        containerSelector: '[data-spa="users"]',
        baseUrl: 'https://company.github.io/user-spa'
    };
</script>
<script src="https://company.github.io/user-spa/loader.js"></script>
```

## Development Tips

### Adding New Components

1. Create components in `src/components/`
2. Use TypeScript for better development experience
3. Import and use in your main app

### Styling

This template uses Tailwind CSS v4:

```tsx
// Example component
export function Button({ children }: { children: React.ReactNode }) {
  return (
    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
      {children}
    </button>
  );
}
```

### Assets (Images, etc.)

Place assets in `src/assets/` and import them:

```tsx
import logo from '../assets/logo.svg';

export function Header() {
  return (
    <header>
      <img src={logo} alt="Logo" />
    </header>
  );
}
```

The loader script will automatically resolve these paths correctly.

## Troubleshooting

### Common Issues

**Q: My images aren't loading when embedded**
A: The loader script handles this automatically. Make sure you're importing images properly in your React components.

**Q: The app works locally but not when deployed**
A: Check that your GitHub Pages URL is correct and that the GitHub Actions workflow completed successfully.

**Q: I'm getting CORS errors**
A: This usually happens when testing locally. The loader is designed to work with the deployed version on GitHub Pages.

**Q: Getting "Cannot find native binding" error**
A: This is a Tailwind CSS v4 issue. Run: `rm -rf node_modules package-lock.json && npm install`

### Debugging

The loader script includes detailed logging. Open your browser's developer console to see:
- Asset resolution details
- Loading progress
- Any errors that occur

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this template for your projects!

## Support

- 📚 [GitHub Issues](https://github.com/johnkraczek/spa-template/issues)
- 💬 [Discussions](https://github.com/johnkraczek/spa-template/discussions)
- 📖 [Wiki](https://github.com/johnkraczek/spa-template/wiki)

---

**Happy coding! 🚀**
