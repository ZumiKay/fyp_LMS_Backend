module.exports = (sequelize , Sequelize) => {
    const department = sequelize.define("departments" , {
        faculty: {
            type: Sequelize.STRING , 
            allownull: false
        } , 
        department: {
            type: Sequelize.STRING , 
            allownull: false , 
            unique: true
        }

    })
    return department
}