const globals = require('globals');

// The game ships as plain <script> tags with no bundler, so cross-file symbols
// are genuine browser globals rather than imports. They are declared here so
// no-undef stays useful instead of drowning in false positives.
const gameGlobals = {
    GameEngine: 'readonly',
    SoundEngine: 'readonly',
    AnimatedObject: 'readonly',
    VRSystem: 'readonly',
    StarSweeperContent: 'readonly',
    SS_PALETTE: 'readonly',
    StarSweeperVR: 'readonly',
    PAL: 'readonly',
    engine: 'readonly'
};

// Classes are declared in one script and consumed by another, so the
// declaration itself always looks unused to a per-file linter.
const crossFileDeclarations = '^(GameEngine|SoundEngine|AnimatedObject|VRSystem)$';

const sharedRules = {
    'no-undef': 'error',
    'no-unused-vars': ['error', {
        args: 'after-used',
        argsIgnorePattern: '^_',
        varsIgnorePattern: crossFileDeclarations,
        caughtErrors: 'none'
    }],
    'no-redeclare': ['error', { builtinGlobals: false }],
    'no-var': 'error',
    'prefer-const': 'error',
    'no-const-assign': 'error',
    'no-dupe-keys': 'error',
    'no-dupe-args': 'error',
    'no-duplicate-case': 'error',
    'no-fallthrough': 'error',
    'no-unreachable': 'error',
    'no-self-compare': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-constant-condition': ['error', { checkLoops: false }],
    'eqeqeq': ['error', 'smart'],
    'no-shadow-restricted-names': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error'
};

module.exports = [
    {
        ignores: ['node_modules/**', 'test-results/**', 'playwright-report/**', 'screenshots/**']
    },
    {
        files: ['js/**/*.js', 'serviceworker.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                ...globals.serviceworker,
                ...gameGlobals
            }
        },
        rules: sharedRules
    },
    {
        files: ['js/content.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: { ...globals.browser, module: 'writable' }
        },
        rules: sharedRules
    },
    {
        files: ['tools/**/*.js', 'eslint.config.js', 'playwright.config.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: { ...globals.node }
        },
        rules: sharedRules
    },
    {
        files: ['tests/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: { ...globals.node, ...globals.browser, showUpdateBanner: 'readonly' }
        },
        rules: sharedRules
    }
];
