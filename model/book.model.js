module.exports = (sequelize , Sequelize) => {
    const books = sequelize.define('books',{
        ISBN: {
            type: Sequelize.JSONB,
            allowNull: false,
            
        },
        cover_img: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        title: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        author: {
            type: Sequelize.JSONB,
            allowNull: false
        },
        publisher_date: {
            type: Sequelize.DATE,
            allowNull: false
        },
        status:{
            type: Sequelize.STRING,
            allowNull: false
        },
        categories: {
            type: Sequelize.JSONB ,
            allowNull: false 
        },
        borrow_count: {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: 0
            
        }
        


    } )
    return books
}