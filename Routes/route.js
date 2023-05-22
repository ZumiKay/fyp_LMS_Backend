import { Router as _Router } from 'express';
import {
    borrowBook,
    createLibrarian,
    delete_student,
    deleteborrow_book,
    editlibrarian,
    editstudent,
    exportreport,
    getStudentInfo,
    getStudentList,
    getborrowbook_librarian,
    getborrowbook_student,
    pickupandreturnbook,
    registerStudent,
    register_HD,
    scanEntry
} from '../controller/librarian.controller';
import { validate_bookregistration, validate_login, validate_registerInput } from '../middleware/validate_data.middleware';
import { createDepartment, getDepartment, getroles, login, logout, refreshToken } from '../controller/student.controller';
import { checkRole, verifytoken } from '../middleware/role_check.middleware';
import { createbook, deletebook, editbook, getbook } from '../controller/book.controller';

const Router = _Router();
const roles = getroles();

//Authentication
Router.post('/register-student', verifytoken, checkRole(roles.librarian), validate_registerInput, registerStudent);
Router.post('/deletestudent', verifytoken, checkRole(roles.librarian), delete_student);
Router.post('/register-HD', verifytoken, validate_registerInput, register_HD);
Router.post('/editlibrarian', verifytoken , checkRole(roles.librarian) , editlibrarian)
Router.post('/login', validate_login, login);
Router.post('/logout', logout);
Router.post('/refreshtoken', refreshToken);
Router.post('/updatepwd', verifytoken, editstudent);
Router.post('/createdepartment', verifytoken, checkRole(roles.librarian), createDepartment);
Router.get('/getdepartment', verifytoken, getDepartment);

//book
Router.get('/getbook', verifytoken, getbook);
Router.post('/createbook', verifytoken, checkRole(roles.librarian), validate_bookregistration, createbook);
Router.post('/editbook', verifytoken, checkRole(roles.librarian), validate_bookregistration, editbook);
Router.post('/deletebook', verifytoken, checkRole(roles.librarian), deletebook);
Router.post('/checkout', verifytoken, borrowBook);
Router.get('/getborrowedbook/:ID', verifytoken, getborrowbook_student);
Router.get('/getborrow_book', verifytoken, checkRole(roles.librarian), getborrowbook_librarian);
Router.post('/r-pb', verifytoken, checkRole(roles.librarian), pickupandreturnbook);
Router.post('/delete_borrow', verifytoken, checkRole(roles.librarian), deleteborrow_book);
//Scan Entry
Router.post('/s-entry', verifytoken, checkRole(roles.librarian), scanEntry);
Router.get('/getstudent', verifytoken, checkRole(roles.headdepartment), checkRole(roles.librarian), getStudentList);
//Export
Router.post('/exportpdf', verifytoken, checkRole(roles.headdepartment), checkRole(roles.librarian), exportreport);

Router.post('/registerlb', createLibrarian);

module.exports = Router;
