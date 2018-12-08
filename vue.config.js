const path = require('path');
const PrerenderSPAPlugin = require('prerender-spa-plugin');

module.exports = {
  configureWebpack: {
    plugins: [
      new PrerenderSPAPlugin({
        staticDir: path.join(__dirname, 'dist'),
        routes: [
          '/',
          '/about',
          '/edition/10',
          '/edition/10/round/1',
          '/edition/10/round/2',
//          '/edition/10/round/3',
//          '/edition/10/round/4',
//          '/edition/10/round/final',
          '/edition/9',
          '/edition/9/round/1',
          '/edition/9/round/2',
          '/edition/9/round/3',
          '/edition/9/round/4',
          '/edition/9/round/final',
          '/edition/8',
          '/edition/8/round/1',
          '/edition/8/round/2',
          '/edition/8/round/3',
          '/edition/8/round/4',
          '/edition/8/round/final',
          '/edition/7',
          '/edition/7/round/1',
          '/edition/7/round/2',
          '/edition/7/round/3',
          '/edition/7/round/4',
          '/edition/7/round/final',
          '/edition/6',
          '/edition/6/round/1',
          '/edition/6/round/2',
          '/edition/6/round/3',
          '/edition/6/round/4',
          '/edition/6/round/final',
        ],
      }),
    ],
  },
};
