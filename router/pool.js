const { createPool }= require('mysql2');
const envvar = require('dotenv')
envvar.config()
const pool = createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    connectionLimit:10
})

pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to MySQL:',err);
    } else {
      console.log('Connected to MySQL');
    }
});

module.exports=pool;