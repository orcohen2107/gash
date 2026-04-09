module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    '@babel/plugin-syntax-flow',
    '@babel/plugin-transform-flow-strip-types',
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './',
          '@gash/types': '../../libs/types/src/index.ts',
          '@gash/schemas': '../../libs/schemas/src/index.ts',
          '@gash/constants': '../../libs/constants/src/index.ts',
          '@gash/api-client': '../../libs/api-client/src/index.ts',
        },
      },
    ],
    ['react-native-reanimated/plugin'],
  ],
}
