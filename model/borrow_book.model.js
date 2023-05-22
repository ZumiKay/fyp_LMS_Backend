module.exports = (sequelize , Sequelize) => {
    const borrowbook = sequelize.define('borrow_books' , {
        borrow_id: {
            type: Sequelize.STRING,
            unique: true,
            allowNull: false
        },
        Books: {
            type: Sequelize.JSONB,
            allowNull: false
        },
        studentID: {
            type: Sequelize.STRING,
            allowNull: false,
            
        },
       
        status: {
            type: Sequelize.STRING,
            allowNull: false 
        },
        borrow_date : {
            type: Sequelize.DATE,
            allowNull: false
        } ,
        qrcode: {
            type: Sequelize.TEXT,
            allowNull: false
        }, 
        expect_return_date: {
            type: Sequelize.DATE,
            allowNull: false
        },
        return_date: {
            type: Sequelize.DATE,
            allowNull: true
        }
        
        
    })
    return borrowbook
}