const db = require('../model')
const jwt = require('jsonwebtoken')


export const checkRole = (role) => {
    return (req ,res, next) => {
        if(req.user && req.user.role_id === role){
            next()
        } else res.status(403)
    }

}
export const verifytoken = (req, res, next) => {
    const token_data = req.headers.authorization
    const token = token_data.split(' ')[1]
    console.log(token)
    if(!token) res.status(401).json({message:"Unauthorized"})
    else {
        jwt.verify(token , process.env.JWT_SECRET, (err , decoded) => {
            if(err) {
                return res.status(403).json({message: "Faild To verify Token"})
            } 
            req.user = decoded
            next() 
        })
    }
}