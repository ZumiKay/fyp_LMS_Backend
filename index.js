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
        origin: 'https://fyp-9ae4d.web.app'
    })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.text());
app.use(express.query());
app.use(helmet());

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

function generateRandomDate(start, end) {
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    const randomTimestamp = Math.random() * (endDate - startDate) + startDate;
    return new Date(randomTimestamp);
  }
  
  function generateRandomDateArray(years) {
    const currentDate = new Date();
    const dates = [];
  
    years.forEach((year) => {
      const startDate = `${year}-01-01`;
      const endDate = year === currentDate.getFullYear() ? currentDate.toISOString().split('T')[0] : `${year}-12-31`;
  
      const randomDate = generateRandomDate(startDate, endDate);
      dates.push(randomDate);
    });
  
    return dates;
  }


db.sequelize
    .authenticate()
    .then(() => {
        db.sequelize
            .sync()
            .then(() => {
                // const years = [2019, 2019, 2019 , 2020 , 2020 , 2020, 2020 ,2021 , 2021 , 2022 , 2022, new Date().getFullYear()];
                // const dateArray = generateRandomDateArray(years);
            
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

const deletelibraryentry = (id) => {
    db.library_entry
        .destroy({
            where: {
                studentID: id
            }
        })
        .then(() => console.log('Deleted'));
};
const seedlibraryentry = (id , dates) => {
    let data = {
        studentID: id,
        entry_date: dates.toString()
    }
    db.library_entry.create(data).then(() => console.log("Seeded Entry"))
}
