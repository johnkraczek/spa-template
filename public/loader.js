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
        baseUrl: 'https://your-org.github.io/your-repo/',

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
            const manifestUrl = `${config.baseUrl}${config.manifestPath}`;
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
            const fullUrl = `${config.baseUrl}/${url}`;
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
            const fullUrl = `${config.baseUrl}/${url}`;
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

            // 3. Find the main assets
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

        } catch (error) {
            console.error('Failed to initialize YDTB app:', error);
            showErrorMessage(`Failed to load application resources: ${error.message}`);
        }
    }

    /**
     * Set up asset URL resolution for images and other static assets
     */
    function setupAssetResolver() {
        // Create a global __resolveAssetUrl function to be used by the app
        window.__resolveAssetUrl = function (assetPath) {
            if (!assetPath) return '';

            // If it's already an absolute URL, return it as is
            if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
                return assetPath;
            }

            // Check if this asset is in the manifest
            if (globalManifest) {
                // Remove leading slash if present
                const normalizedPath = assetPath.startsWith('/') ? assetPath.substring(1) : assetPath;

                // Look for the asset in the manifest
                for (const entry of Object.values(globalManifest)) {
                    // Check if this entry has the asset we're looking for
                    if (entry.file === normalizedPath ||
                        (entry.assets && entry.assets.includes(normalizedPath))) {
                        return `${config.baseUrl}/${normalizedPath}`;
                    }
                }
            }

            // If asset not found in manifest, still try to resolve it with the base URL
            return `${config.baseUrl}/${assetPath.startsWith('/') ? assetPath.substring(1) : assetPath}`;
        };

        // Patch Image.prototype.src to intercept and resolve image paths
        const originalImageSrcDescriptor = Object.getOwnPropertyDescriptor(Image.prototype, 'src');
        if (originalImageSrcDescriptor && originalImageSrcDescriptor.configurable) {
            Object.defineProperty(Image.prototype, 'src', {
                get: function () {
                    return originalImageSrcDescriptor.get.call(this);
                },
                set: function (url) {
                    // Only transform relative URLs
                    if (url && typeof url === 'string' &&
                        !url.startsWith('http://') &&
                        !url.startsWith('https://') &&
                        !url.startsWith('data:') &&
                        !url.startsWith('blob:')) {
                        const resolvedUrl = window.__resolveAssetUrl(url);
                        console.log(`Resolved image URL: ${url} → ${resolvedUrl}`);
                        originalImageSrcDescriptor.set.call(this, resolvedUrl);
                    } else {
                        originalImageSrcDescriptor.set.call(this, url);
                    }
                },
                configurable: true
            });
        }

        // Add a meta tag to indicate that the asset resolver is set up
        const meta = document.createElement('meta');
        meta.name = 'asset-resolver-version';
        meta.content = '1.0';
        document.head.appendChild(meta);

        console.log('Asset resolver has been set up');
    }

    // Start loading the app when the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
})();