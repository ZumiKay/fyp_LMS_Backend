const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const Router = require('./Routes/route');
const db = require('./model');
const { initalrole } = require('./config/config');
const con = require('node-cron');
const { deletepickup_borrow } = require('./controller/librarian.controller');

require('dotenv').config();

//Firebase

//

//middleware
app.use(
    cors({
        origin: '*'
    })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.text());
app.use(express.query());
app.use(helmet());
app.use(express.static('temp'))

//
app.use('/api', Router);

//database
const startServer = () => {
    app.listen(process.env.PORT, console.log('Server is running on port', process.env.PORT));
};
const handleDBConnectionError = (error) => {
    console.error('Failed to connect to the database:', error);
    console.log('Restarting the server...');

    // Restart the server
    startServer();
};

db.sequelize
    .authenticate()
    .then(() => {
        db.sequelize
            .sync()
            .then(() => {
                console.log('Syned DB');
                initalrole(db.role, db.book);
                con.schedule('0 0 * * *', deletepickup_borrow);
                
            })
            .catch((err) => console.log('Error: ', err));
    })
    .catch((error) => {
        console.error('Unable to connect to the database:', error);

        handleDBConnectionError(error);
    });

startServer();

