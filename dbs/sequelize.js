const Sequelize = require('sequelize')
const sequelize = new Sequelize(
    'youyas',
    'youyas',
    'youyas_6789',
    {
        host: 'cd-cdb-mczhmzfq.sql.tencentcdb.com',
        port: 63060,
        dialect: 'mysql',
    }
)

sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });