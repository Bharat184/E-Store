const Sequelize = require('sequelize');

const sequelize = new Sequelize('store_db', 'root', '', {
  dialect: 'mysql',
  host: 'localhost',
  logging:false
});

module.exports = sequelize;
