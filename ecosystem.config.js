module.exports = {
  apps : [{
    name: 'http',
    script: 'index.js',
    env: {
      NODE_ENV: 'development'
    },
    env_production : {
      NODE_ENV: 'production'
    }
  }],
};
