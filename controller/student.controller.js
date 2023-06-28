
const { Op} =require('sequelize')
const { jwtconfig } = require('../config/config')


const db = require('../model')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const Students = db.student
const refreshtoken = []
export const getroles = async () => {
    const allrole = await db.role.findAll()
    const roles = {
        librarian:  allrole.find(({role}) => role === 'librarian'),
        student:  allrole.find(({role}) => role === 'student'),
        headdepartment:  allrole.find(({role}) => role === 'headdepartment')
    
} 
    return roles
}
export const login = (req , res) => {
    const {email,password} = req.body
    const generateToken = (user) => {
        
        const accessToken = jwt.sign( {role: user.role_id , email: user.email} , jwtconfig.secret, {expiresIn:"7d"})
        const refreshToken = jwt.sign( {role: user.role_id , email: user.email}  , jwtconfig.secret , {expiresIn:"14d"})
        refreshtoken.push(refreshToken)
        return {accessToken , refreshToken}
    }
    
   Students.findOne(({
    where :{
        [Op.or]: {
            email: email,
            studentID: email
        }},
    include: [
        db.role
    ]
   })).then(async response => {
    if(response) {
    const isMatch = await bcrypt.compare(password,response.password)
    if(isMatch) {
        const token =  generateToken(response)
        
        return res.status(200).json({user: {
            id: response.id,
            firstname: response.firstname,
            lastname: response.lastname,
            email: response.email,
            department: response.department,
            ID: response.studentID,
            role: response.role.role,
            phonenumber: response.phone_number

        } , token : {accessToken:token.accessToken , refreshToken:token.refreshToken }})
    } else {
        return res.status(500).json({message: "Incorrect Credential"})
      
    }
    } else {
        {
            db.headdepartment.findOne((
                {
                    where: {
                        [Op.or]: {
                            email: email ,
                            ID:email
                        }
                    },
                    include:[
                        db.role
                    ]
                    
                }
            )).then(async response => {
                if(response) {
                    const isMatch = await bcrypt.compare(password , response.password)
                if(isMatch) {
                    const token = generateToken(response)
        
                    return res.status(200).json({
                        user: {
                            firstname: response.firstname,
                            lastname: response.lastname,
                            department: response.department,
                            email: response.email,
                            ID: response.ID,
                            role: response.role.role,
                            phonenumber: response.phone_number
                        },
                        token: {
                            accessToken: token.accessToken,
                            refreshToken: token.refreshToken
                        }
                    })
                } 
                else {
                    res.status(401).json({message: "Incorrect Credential"})
                }

                } else {
                    db.librarian.findOne({
                        where: {
                            [Op.or] : {
                                email:email ,
                                cardID: email
                            }
                        },
                        include : [db.role]
                       }).then( async (response) => {
                        if(response) {
                            const isMatch = await bcrypt.compare(password , response.password)
                            if(isMatch) {
                                const token = generateToken(response)
                            return res.status(200).json({
                                user: {
                                    fullname: response.fullname,
                                    ID: response.cardID,
                                    role: response.role.role,
                                    email: response.email,
                                    id: response.id,
                                  
                                } ,
                                token: {
                                accessToken: token.accessToken,
                                refreshToken: token.refreshToken                            }
                            })

                            } else res.status(401).json({message: "Incorrect Credential"})
                            
                        } else {
                            return res.status(401).json({message: "Incorrect Credential"})
                        }
                       })
                       
                }
                
            }).catch(err => res.status(500).json({message: "Opps! Something Wrong"}))
           }

    }

   })


}
export const refreshToken = (req , res) => {
    const {refreshToken} = req.body
    if(!refreshtoken.includes(refreshToken)) {
        return res.status(401).send({message:"Ivalid Request"})
    } else {
        jwt.verify(refreshToken , jwtconfig.secret , (err , decode) => {
            if (err) return res.status(401).send("Invalid Request Token")
            const accessToken = jwt.sign({id:  decode.id}, jwtconfig.secret , {expireIn:'10m'})
            res.status(200).json({accessToken})
        })
    }
}
export const logout = (req ,res) => {
    const {refreshToken} = req.body
    refreshtoken.filter((token) => token != refreshToken)
    res.sendStatus(204)
}


export const createDepartment = async (req, res) => {
    const { faculty, department } = req.body;
  
    try {
      await db.department.create({
        faculty: faculty,
        department: department
      });
      return res.sendStatus(200);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  };
  

export const getDepartment = async (req, res) => {
    const deparments = await db.department.findAll()
    let data = []

    deparments.map(i => data.push({
        department: i.department ,
        faculty : i.faculty 
    })
    )
    return res.status(200).json(data)

}

export const deletedepartment = (req ,res) => {
    const {department} = req.body
    console.log(department)
    db.department.destroy({where: {
       department: department
    }}).then(() => res.sendStatus(200)).catch((err) => {
        console.log(err)
        res.sendStatus(500)})
}

