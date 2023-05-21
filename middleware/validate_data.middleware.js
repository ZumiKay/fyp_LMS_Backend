const { body, validationResult } = require('express-validator');

export const validate_registerInput = [
        body('firstname').isString().notEmpty(),
        body('lastname').isString().notEmpty(),
        body('department').isString().notEmpty(),
        body('phone_number').isNumeric().notEmpty(),
        body('email').isEmail().notEmpty(),
        (req, res ,next) => {
            const errors = validationResult(req)
            if(!errors.isEmpty()) {
                return res.status(400).json({erros: errors.array()})
            }
            next()
        }
    ]
export const validate_bookregistration = [
    body('ISBN').isArray().notEmpty(),
    body('cover_img').isString().notEmpty(),
    body('title').notEmpty(),
    body('description').isString(),
    body('author').notEmpty(),
    
    body('categories').isArray().notEmpty(),
    (req ,res ,next) => {
        const erros  = validationResult(req)
        if(!erros.isEmpty()) {
            return res.status(400).json({errors: erros.array()})
        }
        next()
    }
]

export const validate_login = [
    body('password').notEmpty(),
    (req ,res ,next) => {
        const error = validationResult(req)
        if(!error.isEmpty()) {
            return res.status(400).json({error: error.array()})
        }
        next()
    }
]

