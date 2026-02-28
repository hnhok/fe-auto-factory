module.exports = {
    plugins: {
        'postcss-px-to-viewport-8-plugin': {
            viewportWidth: 375,
            unitPrecision: 6,
            unitToConvert: 'px',
            propList: ['*'],
            viewportUnit: 'vw',
            fontViewportUnit: 'vw',
            selectorBlackList: [],
            minPixelValue: 1,
            mediaQuery: true,
            replace: true,
            exclude: [],
            landscape: false,
        },
    },
};
