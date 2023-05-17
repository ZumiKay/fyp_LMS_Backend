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
    const data =  {ISBN, cover_img , title , author, categories, publisher_date, description} = req.body
    db.book.create(data).then(() => {
        res.status(200)
    }).catch(() => res.status(500))

}

export const resetbook = () => {
    db.book.update({
        status: 'available' , 
        borrow_count : 0
    } , {where: {}}).then(() => console.log("bookupdated")) 
}