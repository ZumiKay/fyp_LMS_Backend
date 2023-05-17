import { Op } from 'sequelize';
import { generateQRCodeAndUploadToS3, deleteObject } from '../config/config';

const db = require('../model');
const axios = require('axios').default;
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');


const randomgeneratepassword = (length) => {
    let result = '';
    const character = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

    for (let i = 0; i < length; i++) {
        result += character.charAt(Math.floor(Math.random() * character.length));
    }
    return result;
};
const hashedpassword = async () => {
    const salt = await bcrypt.genSalt(10);
    const password = randomgeneratepassword(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return { hashedPassword, password };
};
const handleemail = async (data) => {
    const { email, password } = data;

    let transporter = nodemailer.createTransport({
        service: 'gmail',

        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS
        }
    });
    let mailoptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Library account Information',
        text: `Here are your email and password for login`,
        html: `   <h1>Email : ${email}</h1>
            <h2>Password: ${password} </h2>
            <h3>Have a great day bitch</h3> 
          `
    };
    let info = await transporter.sendMail(mailoptions).catch((err) => console.log(err));
    console.log('Email sent', info.messageId);
    console.log('Preview Link', nodemailer.getTestMessageUrl(info));
};
export const registerStudent = async (req, res) => {
    const { firstname, lastname, studentID, email, dateofbirth, department, phone_number } = req.body;
    const roles = await db.role.findAll();
    const data = {
        firstname: firstname,
        lastname: lastname,
        studentID: studentID,
        email: email,
        date_of_birth: dateofbirth,
        role_id: roles.find(({ role }) => role === 'student').role_id,
        department: department,
        phone_number: phone_number,
        password: ''
    };

    const password = await hashedpassword();
    data.password = password.hashedPassword;
    db.student
        .findOne({
            where: {
                [Op.or]: {
                    email: email
                },
                [Op.or]: {
                    studentID: studentID
                },
                [Op.or]: {
                    phone_number: phone_number
                }
            }
        })
        .then((response) => {
            if (response) res.status(401).send({ message: 'Student Already Existed' });
            else {
                db.student
                    .create(data)
                    .then(() => {
                        handleemail({ email: email, password: password.password });
                        return res.status(200).send({ message: 'Student Registered', password: password.password });
                    })
                    .catch((err) => {
                        return res.status(500).send(err);
                    });
            }
        });
};
export const delete_student = async (req, res) => {
    const { id } = req.body;
    try {
        await db.student.destroy({ where: { studentID: { [Op.in]: id } } });
        return res.status(200);
    } catch (error) {
        return res.status(500);
    }
};
export const editstudent = (req, res) => {
    const { id, oldpwd, newpwd } = req.body;

    db.student.findOne({ where: { studentID: id } }).then(async (response) => {
        if (response) {
            const isMatch = await bcrypt.compare(oldpwd, response.password);
            if (isMatch) {
                const salt = await bcrypt.genSalt(10);
                const hashedpwd = await bcrypt.hash(newpwd, salt);
                db.student.update({ password: hashedpwd }, { where: { studentID: id } }).then(() => {
                    return res.status(200).json({ message: 'Password Changed' });
                });
            } else res.status(403).json({ message: 'Wrong Old Password' });
        } else {
            db.headdepartment.findOne({where : {ID : id}}).then(async (response) => {
                if(response) {
                    const isMatch = await bcrypt.compare(oldpwd, response.password);
                    if(isMatch) {
                        const salt = await bcrypt.genSalt(10);
                        const hashedpwd = await bcrypt.hash(newpwd, salt);
                        db.headdepartment.update({password : hashedpwd} , {where: {ID: id}}).then(() => {
                            return res.status(200).json({message: "Password Changed"})
                        })
                    }
                }
            })
        }
    });
};
export const register_HD = async (req, res) => {
    const { firstname, lastname, ID, department, phone_number, email } = req.body;
    const roles = await db.role.findAll();
    const password = await hashedpassword();
    const data = {
        firstname: firstname,
        lastname: lastname,
        ID: ID,
        department: department,
        role_id: roles.find(({ role }) => role === 'headdepartment').role_id,
        phone_number: phone_number,
        email: email,
        password: password.hashedPassword
    };
    db.headdepartment
        .create(data)
        .then(() => {
            handleemail({ email: email, password: password.password });
            return res.status(200).json({ message: 'Headdepartment Registered', password: password.password });
        })
        .catch((err) => {
            console.log(err);
            return res.status(500);
        });
};
export const createLibrarian = async (req, res) => {
    const { fullname, cardID, email } = req.body;
    const password = await hashedpassword();
    const roles = await db.role.findAll();
    const data = {
        fullname: fullname,
        cardID: cardID,
        email: email,
        password: password.hashedPassword,
        role_id: roles.find(({ role }) => role === 'librarian').role_id
    };
    db.librarian.create(data).then(() => res.status(200).json({ password: password.password }));
};

export const scanEntry = (req, res) => {
    const { url } = req.body;
    const id = url.replace('https://my.paragoniu.edu.kh/qr?student_id=', '');
    axios({
        method: 'GET',
        url: `https://my.paragoniu.edu.kh/api/anonymous/students/${id}`
    })
        .then((response) => {
            const data = response.data.data;
            const date = new Date();
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

            db.library_entry
                .create({
                    studentID: data.id_number,
                    entry_date: `${formattedDate} ${formattedTime}`
                })
                .then(() =>
                    res.status(200).json({
                        ID: data.id_number,
                        profile: data.profile_url,
                        name: data.name,
                        deparment: data.department,
                        faculty: data.faculty
                    })
                )
                .catch((err) => res.status(500).json(err));
        })
        .catch((err) => {
            console.log(err);
            return res.status(500);
        });
};
export const getStudentInfo = async (req, res) => {
    const response = await db.library_entry.findAll();
    return res.status(200).json(response);
};
export const getStudentList = async (req, res) => {
    const Allstudents = await db.student.findAll({
        include: [
            {
                model: db.library_entry,
                as: 'library_entries'
            },
            db.borrow_book
        ]
    });

    const student_data = [];

    Allstudents.map((data) => {
        student_data.push({
            studentID: data.studentID,
            firstname: data.firstname,
            lastname: data.lastname,
            department: data.department,
            phonenumber: data.phone_number,
            email: data.email,
            library_entry: data.library_entries,
            borrow_book: data.borrow_books
        });
    });
    return res.status(200).json(student_data);
};

export const borrowBook = async (req, res) => {
    const { borrowbooks, ID, id } = req.body;
    const date = new Date();
    const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    const borrow_id = uuidv4();
    
    try {
        const data = {
            borrow_id,
            Books: borrowbooks,
            studentID: ID,
            status: 'To Pickup',
            borrow_date: date,
            expect_return_date: nextDay,
            return_date: null
        };

        data.qrcode = await generateQRCodeAndUploadToS3(borrow_id, 'fyplms', `qrcode/${borrow_id}`);

        await Promise.all(
            borrowbooks.map((book) =>
                db.book.update(
                    {
                        status: 'unavailable',
                        borrow_count: book.borrow_count + 1
                    },
                    {
                        where: {
                            title: book.title,
                          
                        }
                    }
                )
            )
        );

        await db.borrow_book.create(data);

        return res.status(200).json({ borrow_id, qrcode: data.qrcode });
    } catch (err) {
        console.log(err);
        return res.status(500);
    }
};
export const getToPickpBook = (req, res) => {
    const { ID } = req.params;
    const borrowed_data = [];
    db.borrow_book
        .findAll({
            where: {
                studentID: ID,
                status: 'To Pickup'
            }
        })
        .then((response) => {
            borrowed_data.push({
                borrow_id: response.borrow_id
            });
        });
};
const lateday = (date, duedate) => {
    const oneDay = 86400000;
    const due = new Date(duedate);
    const actual = new Date(date);

    const difference = actual.getTime() - due.getTime();

    const daysLate = Math.floor(difference / oneDay);

    return daysLate;
};
export const pickupandreturnbook = async (req, res) => {
    const { borrow_id, operation } = req.body;
    const date = new Date();
    const nextWeek = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (operation === 'pickup') {
        const response = await db.borrow_book.findOne({
            where: {
                borrow_id: borrow_id,
                createdAt: {
                    [Op.gte]: new Date(new Date() - 24 * 60 * 60 * 1000)
                }
            },
            include: [db.student]
        });

        if (response && response.status !== 'PickedUp') {
            await db.borrow_book.update(
                {
                    status: 'PickedUp',
                    borrow_date: new Date(),
                    expect_return_date: nextWeek
                },
                {
                    where: {
                        borrow_id: borrow_id
                    }
                }
            );

            await deleteObject(`qrcode/${borrow_id}`);

            return res.status(200).json({
                borrow_id: response.borrow_id,
                borrow_date: new Date(),
                expect_return_date: nextWeek,
                student: {
                    fullname: response.student.lastname + ' ' + response.student.firstname,
                    ID: response.student.studentID,
                    department: response.student.department
                },
                Books: response.Books
            });
        } else {
            return res.status(404).json({ message: 'Invalid QR Code' });
        }
    } else {
        try {
            const response = await db.borrow_book.findAll({
                where: { borrow_id: { [Op.in]: borrow_id } }
            });

            if (response.length > 0) {
                await Promise.all(
                    response.map(async (data) => {
                        await db.borrow_book.update(
                            {
                                status: data.expect_return_date < date ? `return ${lateday(date, data.expect_return_date)}` : 'returned',
                                return_date: date,
                                qrcode: ''
                            },
                            {
                                where: { borrow_id: data.borrow_id }
                            }
                        );

                        await Promise.all(
                            data.Books.map(async (i) => {
                                await db.book.update(
                                    { status: 'available' },
                                    {
                                        where: { title: i.title }
                                    }
                                );
                            })
                        );

                        await deleteObject(`qrcode/${data.borrow_id}`);
                    })
                );

                return res.status(200).send('Success');
            } else {
                return res.status(500).send('Error');
            }
        } catch (error) {
            console.log(error);
            return res.status(500).send('Error');
        }
    }
};

const dayleft = (enddate) => {
    const today = new Date();
    const oneday = 86400000;
    const different = enddate - today;
    const leftday = Math.floor(different / oneday);

    return leftday;
};

export const getborrowbook_librarian = async (req, res) => {
    const date = new Date();
    const borrowedbooks = await db.borrow_book.findAll({ include: [db.student] });
    const borroweddata = [];
    borrowedbooks.map((book) => {
        borroweddata.push({
            borrow_id: book.borrow_id,
            Books: book.Books,
            student: {
                studentID: book.studentID,
                firstname: book.student.firstname,
                lastname: book.student.lastname
            },
            status: book.status
        });
        if (book.return_date === '' && book.status != 'To Pickup') {
            if (book.expect_return_date >= date) {
                const day = dayleft(book.expect_return_date);
                borroweddata.push({
                    return_date: `To be return in ${day}`
                });
            } else {
                borroweddata.push({
                    return_date: 'Please return the book'
                });
            }
        } else if (book.status !== 'To Pickup') borroweddata.push({ return_date: book.return_date });
    });
    return res.status(200).json(borrowedbooks);
};
export const getborrowbook_student = async (req, res) => {
    const { ID } = req.params;
    const date = new Date();
    const borrowedbooks = await db.borrow_book.findAll({
        where: {
            studentID: ID,
            createdAt: {
                [Op.gte]: new Date(new Date() - 24 * 60 * 60 * 1000)
            }
        }
    });
    const borrowed_data = [];
    try {
        borrowedbooks.forEach((book) => {
            borrowed_data.push({
                borrow_id: book.borrow_id,
                Book: book
            });
            if (book.return_date === null && book.status !== 'To Pickup') {
                if (book.expect_return_date > date) {
                    const day = dayleft(book.expect_return_date);
                    borrowed_data['return_date'] = `To be return in ${day}`;
                } else {
                    borrowed_data['return_date'] = 'Please return the book';
                }
            } else if (book.status !== 'To Pickup') {
                borrowed_data['return_date'] = book.return_date;
            }
        });
        return res.status(200).json(borrowed_data);
    } catch (err) {
        console.log(err);
        return res.status(500);
    }
};
export const deletepickup_borrow = () => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    db.borrow_book
        .findAll({
            where: {
                status: 'To Pickup',
                createdAt: {
                    [Op.gte]: new Date(new Date() - 24 * 60 * 60 * 1000)
                }
            }
        })
        .then(async (result) => {
            if (result.length > 0) {
                const deleteborrow = result.map((data) =>
                    db.borrow_book.destroy({
                        where: {
                            borrow_id: data.borrow_id
                        }
                    })
                );
                await Promise.all(deleteborrow);
            }
        });
};

export const deleteborrow_book = (req, res) => {
    const { id } = req.body;

    db.borrow_book
        .findAll({
            where: {
                borrow_id: {
                    [Op.in]: id
                }
            }
        })
        .then(async (response) => {
            if (response.length > 0) {
                const bookUpdates = response
                    .filter((book) => !book.status.includes('return'))
                    .map((book) =>
                        Promise.all(
                            book.Books.map((data) =>
                                db.book.update(
                                    { status: 'available' },
                                    {
                                        where: {
                                            title: data.title
                                        }
                                    }
                                )
                            )
                        )
                    );

                await Promise.all(bookUpdates);

                await db.borrow_book.destroy({
                    where: {
                        borrow_id: {
                            [Op.in]: id
                        }
                    }
                });

                res.status(200).json({ message: 'Books updated and records deleted.' });
            } else {
                res.status(500).json({ error: 'No records found.' });
            }
        })
        .catch((error) => {
            console.log(error);
            res.status(500).json({ error: 'Internal server error.' });
        });
};
