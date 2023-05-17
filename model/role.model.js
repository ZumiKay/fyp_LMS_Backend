module.exports = (sequelize, Sequelize) => {
    const Role = sequelize.define("roles" , {
        role_id: {
            type: Sequelize.STRING,
            unique: true,
            allowNull: false,
            primaryKey: true,
            
        },
        role: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        role_description: {
            type: Sequelize.STRING,
            allowNull: true
        }
    })
    return Role
}