/**
 * Generic SPA Loader Script
 * 
 * Dynamically loads a Vite-built SPA by:
 * 1. Fetching the manifest.json file
 * 2. Finding and loading the main JS and CSS files
 * 3. Mounting the app in the specified container(s)
 * 
 * Usage:
 * <script>
 *   window.SpaLoaderConfig = {
 *     baseUrl: 'https://your-app-url.com/',
 *     containerSelector: '#app',           // CSS selector (default: '#root')
 *     mountStrategy: 'first'               // 'first', 'last', 'all' (default: 'first')
 *   };
 * </script>
 * <script src="loader.js"></script>
 * <div id="app"></div>
 * 
 * Examples:
 * - containerSelector: '#root'            // Mount in element with ID 'root'
 * - containerSelector: '.spa-container'   // Mount in first element with class 'spa-container'  
 * - containerSelector: '[data-spa]'       // Mount in first element with data-spa attribute
 * - mountStrategy: 'all'                  // Mount in all matching elements
 */

(function () {
    'use strict';

    // Default configuration
    const defaultConfig = {
        baseUrl: null,
        containerSelector: '#root',
        mountStrategy: 'first', // 'first', 'last', 'all'
        manifestPath: '/.vite/manifest.json',
        showErrors: true
    };

    // Merge with external config
    const config = { ...defaultConfig, ...(window.SpaLoaderConfig || {}) };

    // Backward compatibility: if containerId is provided, convert to containerSelector
    if (window.SpaLoaderConfig && window.SpaLoaderConfig.containerId && !window.SpaLoaderConfig.containerSelector) {
        config.containerSelector = `#${window.SpaLoaderConfig.containerId}`;
        console.warn('SPA Loader: containerId is deprecated, use containerSelector instead');
    }

    // Validate required config
    if (!config.baseUrl) {
        console.error('SPA Loader: baseUrl is required in SpaLoaderConfig');
        return;
    }

    /**
     * Find container elements based on selector and mount strategy
     */
    function findContainers() {
        const elements = document.querySelectorAll(config.containerSelector);

        if (elements.length === 0) {
            throw new Error(`No elements found matching selector: ${config.containerSelector}`);
        }

        switch (config.mountStrategy) {
            case 'first':
                return [elements[0]];
            case 'last':
                return [elements[elements.length - 1]];
            case 'all':
                return Array.from(elements);
            default:
                console.warn(`Unknown mountStrategy: ${config.mountStrategy}, defaulting to 'first'`);
                return [elements[0]];
        }
    }

    /**
     * Utility to join URLs properly
     */
    function joinUrl(base, path) {
        if (!path) return base;
        const cleanBase = base.replace(/\/+$/, '');
        const cleanPath = path.replace(/^\/+/, '');
        return `${cleanBase}/${cleanPath}`;
    }

    /**
     * Display error message to user
     */
    function showError(message) {
        if (!config.showErrors) return;

        try {
            const containers = findContainers();
            containers.forEach(container => {
                container.innerHTML = `
                    <div style="
                        color: #dc2626; 
                        padding: 20px; 
                        text-align: center; 
                        font-family: system-ui, sans-serif;
                        border: 1px solid #fecaca;
                        background: #fef2f2;
                        border-radius: 8px;
                        margin: 20px;
                    ">
                        <h3>Failed to Load Application</h3>
                        <p>${message}</p>
                        <p style="font-size: 0.9em; margin-top: 10px;">
                            Please refresh the page or contact support.
                        </p>
                    </div>
                `;
            });
        } catch (error) {
            // If we can't find containers, just log to console
            console.error('SPA Loader: Cannot display error in UI - no containers found');
        }
        console.error('SPA Loader Error:', message);
    }

    /**
     * Fetch and parse the Vite manifest
     */
    async function fetchManifest() {
        try {
            // Ensure baseUrl is configured
            if (!config.baseUrl) {
                throw new Error('baseUrl is not configured. Please set baseUrl in LoaderConfig.');
            }

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
            throw error;
        }
    }

    /**
     * Find main JS and CSS files from manifest
     */
    function findAssets(manifest) {
        // Find the main entry point
        const entryPoint = Object.values(manifest).find(entry => entry.isEntry);

        if (!entryPoint) {
            throw new Error('No entry point found in manifest');
        }

        return {
            js: entryPoint.file,
            css: entryPoint.css?.[0] || null
        };
    }

    /**
     * Load a stylesheet
     */
    function loadCSS(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = joinUrl(config.baseUrl, href);
            link.onload = resolve;
            link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
            document.head.appendChild(link);
        });
    }

    /**
     * Load a JavaScript file
     */
    function loadJS(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = joinUrl(config.baseUrl, src);
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load JS: ${src}`));
            document.head.appendChild(script);
        });
    }

    /**
     * Set up basic asset URL resolution for the app
     */
    function setupAssetResolution() {
        // Provide a global function for the app to resolve asset URLs
        window.__resolveAssetUrl = function (path) {
            return joinUrl(config.baseUrl, path);
        };

        // Set base URL for any asset references
        const base = document.createElement('base');
        base.href = config.baseUrl;
        document.head.appendChild(base);
    }

    /**
     * Main initialization function
     */
    async function init() {
        try {
            console.log('SPA Loader Config:', {
                containerSelector: config.containerSelector,
                mountStrategy: config.mountStrategy,
                baseUrl: config.baseUrl
            });

            // Ensure container(s) exist
            const containers = findContainers();
            console.log(`Found ${containers.length} container(s) matching selector: ${config.containerSelector}`);

            // Set up asset resolution
            setupAssetResolution();

            // Load manifest and find assets
            const manifest = await fetchManifest();
            const assets = findAssets(manifest);

            // Load CSS first (if exists)
            if (assets.css) {
                await loadCSS(assets.css);
            }

            // Load main JavaScript
            await loadJS(assets.js);

            console.log('SPA Loader: Successfully loaded application');

        } catch (error) {
            console.error('SPA Loader failed:', error);
            showError(error.message);
        }
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();