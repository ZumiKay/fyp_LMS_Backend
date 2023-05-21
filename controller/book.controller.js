import { Op } from 'sequelize'

const db = require('../model')

export const getbook = async (req ,res) => {
    const books = await db.book.findAll()
    const allcategories = books.map(({categories}) => categories)

    return res.status(200).json({
        allcategories: allcategories ,
        books: books
    })
}
export const createbook = (req ,res) => {
    const {ISBN, cover_img , title , status, author, categories, publisher_date, description} = req.body
    const data = {
        ISBN: ISBN,
        cover_img :cover_img , 
        title: title ,
        status : status ,
        author: author ,
        categories : categories ,
        publisher_date : publisher_date , 
        description: description
    }
    db.book.create(data).then(() => {
        res.sendStatus(200)
    }).catch(() => res.sendStatus(500))
     
    
}

export const editbook = (req , res) => {
    const {ISBN, cover_img , title , status, author, categories,id , publisher_date, description} = req.body
    db.book.update({
        ISBN: ISBN,
        cover_img :cover_img , 
        title: title ,
        status : status ,
        author: author ,
        categories : categories ,
        publisher_date : publisher_date , 
        description: description
    } , {where : {
        id: id
    }}).then(() => res.sendStatus(200)).catch(() => res.sendStatus(500))
}
export const deletebook = async (req ,res) => {
    const {id} = req.body
    try {
       await db.book.destroy({where: {
            id: {
                [Op.in] : id
            }
        }})
        return res.sendStatus(200)
    } catch (err) {
        console.log(err)
        return res.sendStatus(500)
    }
    
}

export const resetbook = () => {
    db.book.update({
        status: 'available' , 
        borrow_count : 0
    } , {where: {}}).then(() => console.log("bookupdated")) 
}