module.exports = (sequelize , Sequelize) => {
    const headdepartment = sequelize.define("headdepartment" , {
        firstname: {
            type: Sequelize.STRING,
            allowNull: false
        },
        lastname: {
            type: Sequelize.STRING,
            allowNull: false
        },
        ID: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        role_id: {
            type: Sequelize.STRING,
            allowNull: false
        },
        department: {
            type: Sequelize.STRING,
            allowNull: false
        },
        phone_number: {
            type: Sequelize.INTEGER,
            allowNull: true,
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
        password: {
            type: Sequelize.STRING,
            allowNull: false
        }
    })
    return headdepartment
}