const { Op } = require('sequelize')

const db = require('../model')

export const getbook = async (req, res) => {
    try {
      const books = await db.book.findAll();
      const allcategories = books.map(({ categories }) => categories);
  
      return res.status(200).json({
        allcategories,
        books,
      });
    } catch (error) {
      
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  export const createbook = async (req, res) => {
    try {
      const { ISBN, cover_img, title, status, author, categories, publisher_date, description } = req.body;
      const data = {
        ISBN,
        cover_img,
        title,
        status,
        author,
        categories,
        publisher_date,
        description,
      };
  
      await db.book.create(data);
      return res.sendStatus(200);
    } catch (error) {
      return res.sendStatus(500);
    }
  };
  

  export const editbook = async (req, res) => {
    try {
      const { ISBN, cover_img, title, status, author, categories, id, publisher_date, description } = req.body;
      await db.book.update(
        {
          ISBN,
          cover_img,
          title,
          status,
          author,
          categories,
          publisher_date,
          description,
        },
        {
          where: {
            id: id
          },
        }
      );
      return res.sendStatus(200);
    } catch (error) {
     
      return res.sendStatus(500);
    }
};
  
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
        
        return res.sendStatus(500)
    }
    
}

export const resetbook = () => {
    db.book.update({
        status: 'available' , 
        borrow_count : 0
    } , {where: {}}).then(() => console.log("bookupdated")) 
}