const { join } = require('path');

const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const webpack = require('webpack');

const optionalModules = [
  '@mikro-orm/core',
  '@nestjs/mongoose',
  '@nestjs/typeorm',
  '@nestjs/sequelize',
  '@nestjs/microservices',
  'class-transformer/storage',
];

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
  },
  resolve: {
    alias: Object.fromEntries(optionalModules.map((m) => [m, false])),
  },
  module: {
    rules: [
      {
        test: /\.(d\.ts|js\.map)$/,
        enforce: 'pre',
        use: 'null-loader',
      },
    ],
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
    }),
  ],
};
