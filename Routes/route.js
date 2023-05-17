import { Router as _Router } from 'express'
import { borrowBook, createLibrarian, delete_student, deleteborrow_book, editstudent, getStudentInfo, getStudentList, getborrowbook_librarian, getborrowbook_student, pickupandreturnbook, registerStudent, register_HD, scanEntry } from '../controller/librarian.controller'
import {validate_bookregistration, validate_login, validate_registerInput } from '../middleware/validate_data.middleware'
import { getroles, login, logout, refreshToken } from '../controller/student.controller'
import { checkRole , verifytoken } from '../middleware/role_check.middleware'
import { createbook, getbook, resetbook } from '../controller/book.controller'

const Router = _Router()
const roles = getroles()


//Authentication
Router.post('/register-student',verifytoken, checkRole(roles.librarian) , validate_registerInput , registerStudent)
Router.post('/deletestudent' , verifytoken , checkRole(roles.librarian), delete_student)
Router.post('/register-HD',verifytoken, validate_registerInput, register_HD)
Router.post('/login' , validate_login ,login)
Router.post('/logout' , logout)
Router.post('/refreshtoken' , refreshToken)
Router.post('/updatepwd' , verifytoken , editstudent)

//book
Router.get('/getbook' ,verifytoken ,getbook)
Router.post('/createbook' , verifytoken,checkRole(roles.librarian) , validate_bookregistration , createbook)
Router.post("/checkout", verifytoken , borrowBook)
Router.get("/getborrowedbook/:ID" , verifytoken , getborrowbook_student)
Router.get('/getborrow_book' , verifytoken, checkRole(roles.librarian) , getborrowbook_librarian)
Router.post("/r-pb" , verifytoken , checkRole(roles.librarian) , pickupandreturnbook)
Router.post('/delete_borrow' , verifytoken , checkRole(roles.librarian) , deleteborrow_book)
//Scan Entry
Router.post("/s-entry",verifytoken , checkRole(roles.librarian) , scanEntry)
Router.get("/getstudent" ,verifytoken, checkRole(roles.librarian) , getStudentList)


Router.post('/registerlb' , createLibrarian)



module.exports = Router
