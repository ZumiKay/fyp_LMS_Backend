module.exports = (sequelize  , Sequelize) => {
    const libarian = sequelize.define ('libarians', {
        fullname: {
            type: Sequelize.STRING,
            allowNull: false
        },
        cardID: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        email: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        role_id: {
            type: Sequelize.STRING,
            allowNull: false,
            

        },
        password: {
            type: Sequelize.STRING,
            allowNull: false
        }
    } )
    return libarian
}