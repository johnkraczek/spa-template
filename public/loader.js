/**
 * YDTB Loader Script
 * 
 * This script dynamically loads the SPA app by:
 * 1. Fetching the manifest.json file
 * 2. Finding the main JS and CSS files
 * 3. Injecting them into the page
 * 4. Patching asset URLs to ensure images and other resources load correctly
 * 
 * Usage in HTML:
 * <script src="https://your-github-pages-url/loader.js"></script>
 * <div id="root"></div>
 */



(function () {
    // Configuration (can be modified for different environments)
    const config = {
        // Base URL where the built assets are hosted (GitHub Pages URL for this repo)
        // This will be automatically updated by the GitHub Actions workflow
        baseUrl: 'https://your-org.github.io/your-repo',

        // The div ID where the React app will mount
        rootElementId: 'root',

        // The manifest file path (relative to the baseUrl)
        manifestPath: '/.vite/manifest.json'
    };

    // Store the manifest globally for asset resolution
    let globalManifest = null;

    /**
     * Fetch and parse the manifest file
     */
    async function fetchManifest() {
        try {
            // Ensure the baseUrl doesn't have a trailing slash before adding the manifestPath
            const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
            const manifestUrl = `${baseUrl}${config.manifestPath}`;
            console.log('Fetching manifest from:', manifestUrl);

            const response = await fetch(manifestUrl);
            if (!response.ok) {
                throw new Error(`Failed to load manifest: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading manifest:', error);
            showErrorMessage('Failed to load application manifest.');
            throw error;
        }
    }

    /**
     * Find the main entry JS and CSS files from the manifest
     */
    function findMainAssets(manifest) {
        console.log('Searching for assets in manifest:', manifest);

        // Find the main JS file (typically starts with "YDTB." or contains "main")
        let mainJsEntry = Object.values(manifest).find(entry =>
            entry.isEntry && entry.file && entry.file.startsWith('YDTB.')
        );

        // Fallback: look for any entry file if the specific pattern isn't found
        if (!mainJsEntry) {
            mainJsEntry = Object.values(manifest).find(entry =>
                entry.isEntry && entry.file
            );
        }

        // Second fallback: look for src/main.tsx or similar
        if (!mainJsEntry) {
            const mainKey = Object.keys(manifest).find(key =>
                key.includes('main.') || key.includes('/main')
            );
            if (mainKey) {
                mainJsEntry = manifest[mainKey];
            }
        }

        // Find the main CSS file
        let mainCssFile = null;

        // First try to find CSS from the entry's CSS property
        if (mainJsEntry && mainJsEntry.css && mainJsEntry.css.length > 0) {
            mainCssFile = mainJsEntry.css[0];
        }
        // Otherwise look for any CSS file in the manifest
        else {
            const cssFiles = Object.values(manifest)
                .flatMap(entry => entry.css || []);

            mainCssFile = cssFiles.find(cssPath => cssPath.startsWith('YDTB.')) ||
                cssFiles[0]; // Fallback to first CSS file
        }

        if (!mainJsEntry) {
            throw new Error('Could not find main JS entry in manifest. Available keys: ' +
                Object.keys(manifest).join(', '));
        }

        return {
            js: mainJsEntry.file,
            css: mainCssFile
        };
    }

    /**
     * Load a JavaScript file dynamically
     */
    function loadJavaScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            // Ensure proper URL joining
            const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl : `${config.baseUrl}/`;
            const fullUrl = `${baseUrl}${url}`;
            console.log('Loading JavaScript from:', fullUrl);

            script.src = fullUrl;
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${fullUrl}`));
            document.head.appendChild(script);
        });
    }

    /**
     * Load a CSS file dynamically
     */
    function loadStylesheet(url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            // Ensure proper URL joining
            const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl : `${config.baseUrl}/`;
            const fullUrl = `${baseUrl}${url}`;
            console.log('Loading CSS from:', fullUrl);

            link.rel = 'stylesheet';
            link.href = fullUrl;
            link.onload = resolve;
            link.onerror = () => reject(new Error(`Failed to load stylesheet: ${fullUrl}`));
            document.head.appendChild(link);
        });
    }

    /**
     * Display an error message on the page
     */
    function showErrorMessage(message) {
        const rootElement = document.getElementById(config.rootElementId);
        if (rootElement) {
            rootElement.innerHTML = `
        <div style="color: #e53e3e; padding: 20px; text-align: center; font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; border: 1px solid #fed7d7; background-color: #fff5f5; border-radius: 8px;">
          <h2 style="margin-bottom: 10px;">Application Error</h2>
          <p style="margin-bottom: 10px;">${message}</p>
          <p>Please try refreshing the page or contact support if the problem persists.</p>
          <p style="font-size: 0.8em; margin-top: 20px;">Debug Info: Using base URL: ${config.baseUrl}</p>
        </div>
      `;
        } else {
            console.error('YDTB Error:', message, 'No root element found with ID:', config.rootElementId);
        }
    }

    /**
     * Initialize the app by loading all required assets
     */
    async function initApp() {
        try {
            console.log('Initializing YDTB app with config:', config);

            // 1. Fetch the manifest
            const manifest = await fetchManifest();
            console.log('Manifest loaded:', manifest);

            // Store manifest globally for asset resolution
            globalManifest = manifest;

            // 2. Set up the asset resolver before loading JavaScript
            setupAssetResolver();

            // 3. Add a global event listener for import.meta accesses in modules
            // This is safer than trying to directly modify import.meta
            window.addEventListener('error', function (event) {
                const errorMessage = event.message || '';
                if (errorMessage.includes('import.meta') || errorMessage.includes('Cannot read properties of undefined (reading \'url\')')) {
                    console.warn('Caught import.meta error, this is expected and handled by the loader');
                    event.preventDefault();
                    event.stopPropagation();
                }
            }, true);

            // 4. Find the main assets
            const assets = findMainAssets(manifest);
            console.log('Main assets found:', assets);

            // 4. Load the CSS file if available
            if (assets.css) {
                await loadStylesheet(assets.css);
                console.log('CSS loaded successfully');
            } else {
                console.warn('No CSS file found in manifest');
            }

            // 5. Load the main JS file
            await loadJavaScript(assets.js);
            console.log('JavaScript loaded successfully');

            // 6. Patch any existing images that might have been added by the app
            patchExistingImages();

        } catch (error) {
            console.error('Failed to initialize YDTB app:', error);
            showErrorMessage(`Failed to load application resources: ${error.message}`);
        }
    }

    /**
     * Patch all existing images on the page to use the correct base URL
     */
    function patchExistingImages() {
        // Fix all image elements
        document.querySelectorAll('img').forEach(img => {
            const originalSrc = img.getAttribute('src');
            if (originalSrc &&
                !originalSrc.startsWith('http://') &&
                !originalSrc.startsWith('https://') &&
                !originalSrc.startsWith('data:') &&
                !originalSrc.startsWith('blob:')) {
                // Temporarily remove to trigger the patched setter
                img.removeAttribute('src');
                img.setAttribute('src', originalSrc);
            }
        });

        // Fix all background images in inline styles
        document.querySelectorAll('[style*="background"]').forEach(el => {
            const style = el.getAttribute('style');
            if (style && style.includes('url(')) {
                // Find all URL patterns in the style
                const urlPattern = /url\(['"]?([^'")]+)['"]?\)/g;
                let newStyle = style;
                let match;

                while ((match = urlPattern.exec(style)) !== null) {
                    const url = match[1];
                    // Only replace relative URLs
                    if (url &&
                        !url.startsWith('http://') &&
                        !url.startsWith('https://') &&
                        !url.startsWith('data:') &&
                        !url.startsWith('blob:')) {

                        const resolvedUrl = window.__resolveAssetUrl(url);
                        newStyle = newStyle.replace(url, resolvedUrl);
                    }
                }

                if (newStyle !== style) {
                    el.setAttribute('style', newStyle);
                }
            }
        });

        console.log('Patched existing images on the page');
    }

    /**
     * Set up asset URL resolution for images and other static assets
     */
    function setupAssetResolver() {
        // Helper function to ensure proper URL joining
        const joinUrl = (base, path) => {
            if (!path) return base;
            const baseWithoutSlash = base.endsWith('/') ? base.slice(0, -1) : base;
            const pathWithoutSlash = path.startsWith('/') ? path.substring(1) : path;
            return `${baseWithoutSlash}/${pathWithoutSlash}`;
        };

        // Create a global __resolveAssetUrl function to be used by the app
        window.__resolveAssetUrl = function (assetPath) {
            if (!assetPath) return '';

            // If it's already an absolute URL, return it as is
            if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
                return assetPath;
            }

            // Properly join the base URL and asset path
            return joinUrl(config.baseUrl, assetPath);
        };

        // Create a map of original asset paths to their hashed versions from the manifest
        const assetMap = {};

        if (globalManifest) {
            // Build a comprehensive asset map from the manifest
            for (const [key, entry] of Object.entries(globalManifest)) {
                // Map the main file
                if (entry.file) {
                    assetMap[key] = entry.file;
                    // Also map without the src/ prefix which is common in Vite
                    if (key.startsWith('src/')) {
                        assetMap[key.substring(4)] = entry.file;
                    }
                }

                // Map assets array
                if (entry.assets && Array.isArray(entry.assets)) {
                    entry.assets.forEach(asset => {
                        // Try to find the original path from the manifest keys
                        const originalAssetKey = Object.keys(globalManifest).find(k =>
                            globalManifest[k].file === asset
                        );

                        if (originalAssetKey) {
                            assetMap[originalAssetKey] = asset;
                            // Also map without the src/ prefix
                            if (originalAssetKey.startsWith('src/')) {
                                assetMap[originalAssetKey.substring(4)] = asset;
                            }
                        }

                        // Always map the hashed name to itself for direct references
                        assetMap[asset] = asset;
                    });
                }
            }

            console.log('Asset map created:', assetMap);
        }

        // Intercept all image loading
        const originalImageSrcDescriptor = Object.getOwnPropertyDescriptor(Image.prototype, 'src');
        if (originalImageSrcDescriptor && originalImageSrcDescriptor.configurable) {
            Object.defineProperty(Image.prototype, 'src', {
                get: function () {
                    return originalImageSrcDescriptor.get.call(this);
                },
                set: function (url) {
                    if (!url) {
                        originalImageSrcDescriptor.set.call(this, url);
                        return;
                    }

                    // Only transform relative URLs
                    if (typeof url === 'string' &&
                        !url.startsWith('http://') &&
                        !url.startsWith('https://') &&
                        !url.startsWith('data:') &&
                        !url.startsWith('blob:')) {

                        // First check if this path is in our asset map
                        let resolvedUrl;

                        // Normalize the path (remove leading slash)
                        const normalizedPath = url.startsWith('/') ? url.substring(1) : url;

                        if (normalizedPath in assetMap) {
                            // Use the hashed filename from the asset map
                            resolvedUrl = joinUrl(config.baseUrl, assetMap[normalizedPath]);
                        } else {
                            // Fallback to direct path resolution
                            resolvedUrl = joinUrl(config.baseUrl, normalizedPath);
                        }

                        console.log(`Resolved image URL: ${url} → ${resolvedUrl}`);
                        originalImageSrcDescriptor.set.call(this, resolvedUrl);
                    } else {
                        originalImageSrcDescriptor.set.call(this, url);
                    }
                },
                configurable: true
            });
        }

        // Add debug logging for all assets
        window.addEventListener('error', function (event) {
            if (event.target && (event.target.tagName === 'IMG' || event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
                console.error(`Failed to load resource: ${event.target.src || event.target.href}`, event);
            }
        }, true);

        // Add a script to handle dynamic asset loading in JS modules
        const script = document.createElement('script');
        const normalizedBaseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
        script.textContent = `
            // Handle Vite's asset URL resolution
            window.__viteAssetUrl = function(url) {
                return window.__resolveAssetUrl(url);
            };
            
            // Make sure publicPath is set for any webpack-like systems
            window.__webpack_public_path__ = '${normalizedBaseUrl}/';
            
            // Set a global base URL for any other asset resolution needs
            window.__assetBaseUrl = '${normalizedBaseUrl}';
            
            console.log('Asset resolution configured with base URL: ${normalizedBaseUrl}');
        `;
        document.head.appendChild(script);

        // Add a meta tag to indicate that the asset resolver is set up
        const meta = document.createElement('meta');
        meta.name = 'asset-resolver-version';
        meta.content = '1.1';
        document.head.appendChild(meta);

        console.log('Enhanced asset resolver has been set up');
    }

    // Start loading the app when the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
})();