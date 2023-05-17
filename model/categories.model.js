
module.exports = (sequelize , Sequelize) => {
    const category = sequelize.define('categories' , {
        name: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true

        },


    })
    return category

}