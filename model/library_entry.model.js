module.exports = (sequelize , Sequelize) => {
    const libraryentry = sequelize.define("library_entries" , {
        studentID:{
            type: Sequelize.STRING,
            allowNull: false,
            
        },
        
        entry_date: {
            type: Sequelize.STRING,
            allowNull: false
        }
    })
    return libraryentry
}