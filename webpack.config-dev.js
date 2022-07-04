/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = () => {
    return {
        mode: 'development',
        entry: './src/moduleIndex.ts',
        output: {
            filename: 'moduleIndex.js',
            library: 'JVxReactUI',
            libraryTarget: 'umd'
        },
        devtool: 'inline-source-map',
        plugins: [
            new MiniCssExtractPlugin({
                filename: '[name].css',
                chunkFilename: '[id].css'
            }),
            // new CircularDependencyPlugin({
            //     exclude: /a\.js|node_modules/,
            //     include: /src/,
            //     failOnError: true,
            //     allowAsyncCycles: false,
            //     cwd: process.cwd(),
            // }),
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
            }),
            new CleanWebpackPlugin(),
            new CopyPlugin({
                patterns: [
                    {
                        from: "*.scss",
                        context: path.resolve(__dirname, "src", "application-frame", "styling", "color-schemes"),
                        to: "./resources/color-schemes",
                    },
                    {
                        from: "*.scss",
                        context: path.resolve(__dirname, "src", "application-frame", "styling", "themes"),
                        to: "./resources/themes",
                    },
                    {
                        from: "SetupPackage.js",
                        context: path.resolve(__dirname, "src"),
                        to: "./"
                    }
                ]
            })
        ],
        module: {
            rules: [
                {
                    test: /\.(ts|js)x?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                '@babel/preset-env',
                                '@babel/preset-typescript',
                                '@babel/preset-react'
                            ],
                            plugins: ['@babel/plugin-proposal-class-properties']
                        }
                    }
                },
                {
                    test: /\.s?[ac]ss$/i,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader,
                        },
                        'css-loader',
                        'sass-loader',
                    ],
                },
                {
                    test: /\.(png|svg|jpg|gif|webP)$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'resources/assets/[name][ext]'
                    }
                    // use: {
                    //     loader: 'file-loader',
                    //     options: {
                    //         name: 'resources/assets/[name].[ext]',
                    //     }
                    // },
                },
                {
                    test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'resources/fonts/[name][ext]'
                    },
                    // use: {
                    //     loader: 'file-loader',
                    //     options: {
                    //         name: 'resources/fonts/[name][ext]',
                    //     }
                    // },
                },
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'ts-loader',
                        options: {
                            compilerOptions: {
                                "noEmit": false
                            }
                        }
                    }
                }
            ]
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js', '.json'],
            alias: {
                react: path.resolve('./node_modules/react'),
                assets: path.resolve('./src/assets')
            }
        },
        externals: {
            react: "react",
            "react-dom": "react-dom"
        }
    }
}