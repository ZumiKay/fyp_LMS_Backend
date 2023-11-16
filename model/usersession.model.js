

module.exports = (sequelize , Sequelize) => {
    const usersession = sequelize.define('usersessions' , {
        
        user: {
            type: Sequelize.STRING,
            allowNull: false
        } , 
        user_id: {
            type: Sequelize.STRING ,
            allowNull: false
        } ,
        sessionID: {
            type: Sequelize.STRING , 
            allowNull: false
        }

    })
    return usersession
}   