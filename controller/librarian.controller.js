const { Op } = require('sequelize');
const { generateQRCodeAndUploadToS3, deleteObject, generateExcel } = require('../config/config');

const db = require('../model');
const axios = require('axios').default;
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const PdfPrinter = require('pdfmake');

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
    try {
        const { email, password } = data;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Library Account Information',
            text: 'Here are your email and password for login',
            html: `
          <h1>Email: ${email}</h1>
          <h2>Password: ${password}</h2>
          <h3>Have a great day!</h3>
        `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

export const registerStudent = async (req, res) => {
    try {
        const { firstname, lastname, studentID, email, dateofbirth, department, phone_number } = req.body;
        const roles = await db.role.findAll();

        const data = {
            firstname,
            lastname,
            studentID,
            email,
            date_of_birth: dateofbirth,
            role_id: roles.find(({ role }) => role === 'student').role_id,
            department,
            phone_number,
            password: ''
        };

        const password = await hashedpassword();
        data.password = password.hashedPassword;

        const existingStudent = await db.student.findOne({
            where: {
                [Op.or]: [{ email }, { studentID }, { phone_number }]
            }
        });

        if (existingStudent) {
            return res.status(401).send({ message: 'Student Already Exists' });
        }

        await db.student.create(data);

        handleemail({ email, password: password.password });

        return res.status(200).send({ message: 'Student Registered', password: password.password });
    } catch (error) {
        console.error('Error registering student:', error);
        return res.sendStatus(500);
    }
};

export const delete_student = async (req, res) => {
    const { id } = req.body;
    try {
        await db.student.destroy({ where: { studentID: { [Op.in]: id } } });
        return res.sendStatus(200);
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
};

export const editstudent = async (req, res) => {
    try {
        const { id, oldpwd, newpwd } = req.body;

        const student = await db.student.findOne({ where: { studentID: id } });
        if (student) {
            const isMatch = await bcrypt.compare(oldpwd, student.password);
            if (isMatch) {
                const salt = await bcrypt.genSalt(10);
                const hashedpwd = await bcrypt.hash(newpwd, salt);
                await db.student.update({ password: hashedpwd }, { where: { studentID: id } });
                return res.status(200).json({ message: 'Password Changed' });
            } else {
                return res.status(403).json({ message: 'Wrong Password' });
            }
        } else {
            const headDepartment = await db.headdepartment.findOne({ where: { ID: id } });
            if (headDepartment) {
                const isMatch = await bcrypt.compare(oldpwd, headDepartment.password);
                if (isMatch) {
                    const salt = await bcrypt.genSalt(10);
                    const hashedpwd = await bcrypt.hash(newpwd, salt);
                    await db.headdepartment.update({ password: hashedpwd }, { where: { ID: id } });
                    return res.status(200).json({ message: 'Password Changed' });
                }
            }
        }
        return res.status(404).json({ message: 'User not found' });
    } catch (error) {
        console.error('Error editing student:', error);
        return res.sendStatus(500);
    }
};

export const editlibrarian = (req, res) => {
    const { id, oldpwd, newpwd, fullname, ID } = req.body;
    db.librarian
        .findOne({
            where: {
                id: id
            }
        })
        .then(async (response) => {
            if (response) {
                if (newpwd !== '' && fullname === '' && ID === '') {
                    const isMatch = await bcrypt.compare(oldpwd, response.password);
                    if (isMatch) {
                        const salt = await bcrypt.genSalt(10);
                        const hashedpwd = await bcrypt.hash(newpwd, salt);
                        await db.librarian.update({ password: hashedpwd }, { where: { id: id } });
                        return res.sendStatus(200);
                    }
                } else if (fullname !== '' && newpwd === '' && ID === '') {
                    await db.librarian.update(
                        { fullname: fullname },
                        {
                            where: {
                                id: id
                            }
                        }
                    );
                    return res.sendStatus(200);
                } else if (fullname !== '' && newpwd !== '' && ID !== '') {
                    const isMatch = await bcrypt.compare(oldpwd, response.password);
                    if (isMatch) {
                        const salt = await bcrypt.genSalt(10);
                        const hashedpwd = await bcrypt.hash(newpwd, salt);
                        await db.librarian.update(
                            { password: hashedpwd, fullname: fullname, cardID: ID },
                            {
                                where: {
                                    id: id
                                }
                            }
                        );
                        return res.sendStatus(200);
                    }
                } else if (fullname === '' && newpwd === '' && ID !== '') {
                    await db.librarian.update(
                        { cardID: ID },
                        {
                            where: {
                                id: id
                            }
                        }
                    );
                    return res.sendStatus(200);
                } else if (fullname !== '' && ID !== '' && newpwd === '') {
                    await db.librarian.update(
                        { fullname: fullname, cardID: ID },
                        {
                            where: {
                                id: id
                            }
                        }
                    );
                    return res.sendStatus(200);
                } else if (fullname !== '' && ID === '' && newpwd !== '') {
                    const isMatch = await bcrypt.compare(oldpwd, response.password);
                    if (isMatch) {
                        const salt = await bcrypt.genSalt(10);
                        const hashedpwd = await bcrypt.hash(newpwd, salt);
                        await db.librarian.update(
                            { password: hashedpwd, fullname: fullname },
                            {
                                where: {
                                    id: id
                                }
                            }
                        );
                        return res.sendStatus(200);
                    }
                } else if (fullname === '' && ID !== '' && newpwd !== '') {
                    const isMatch = await bcrypt.compare(oldpwd, response.password);
                    if (isMatch) {
                        const salt = await bcrypt.genSalt(10);
                        const hashedpwd = await bcrypt.hash(newpwd, salt);
                        await db.librarian.update(
                            { password: hashedpwd, cardID: ID },
                            {
                                where: {
                                    id: id
                                }
                            }
                        );
                        return res.sendStatus(200);
                    }
                } else {
                    return res.sendStatus(400);
                }
            } else {
                return res.sendStatus(500);
            }
        })
        .catch(() => res.sendStatus(500));
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

export const scanEntry = async (req, res) => {
    try {
        const { url } = req.body;
        const id = url.replace('https://my.paragoniu.edu.kh/qr?student_id=', '');

        const response = await axios.get(`https://my.paragoniu.edu.kh/api/anonymous/students/${id}`);
        const data = response.data.data;
        const { id_number, profile_url, name, department, faculty } = data;

        const formattedDateTime = getFormattedDateTime();

        await db.library_entry.create({
            studentID: id_number,
            entry_date: formattedDateTime
        });

        return res.status(200).json({
            ID: id_number,
            profile: profile_url,
            name: name,
            department: department,
            faculty: faculty
        });
    } catch (error) {
        console.error('Error scanning entry:', error);
        return res.sendStatus(500);
    }
};

function getFormattedDateTime() {
    const date = new Date();
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    return `${formattedDate} ${formattedTime}`;
}

export const getStudentInfo = async (req, res) => {
    const response = await db.library_entry.findAll();
    return res.status(200).json(response);
};
export const getStudentList = async (req, res) => {
    try {
        const students = await db.student.findAll({
            include: [
                {
                    model: db.library_entry,
                    as: 'library_entries'
                },
                db.borrow_book
            ]
        });

        const studentData = students.map((student) => ({
            studentID: student.studentID,
            firstname: student.firstname,
            lastname: student.lastname,
            department: student.department,
            phonenumber: student.phone_number,
            email: student.email,
            library_entry: student.library_entries,
            borrow_book: student.borrow_books
        }));

        return res.status(200).json(studentData);
    } catch (error) {
        return res.sendStatus(500);
    }
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
                            title: book.title
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
    const different = new Date(enddate) - today;
    const leftday = Math.floor(different / oneday);

    return leftday;
};

export const getborrowbook_librarian = async (req, res) => {
    try {
        const date = new Date();
        const borrowedbooks = await db.borrow_book.findAll({
            include: [db.student],
            where: {}
        });
        let borrowdata = [];
        await Promise.all(
            borrowedbooks.map((book) => {
               
                let return_date = null;
                if (book.return_date === null && book.status !== 'To Pickup') {
                    const expectreturn = new Date(book.expect_return_date);
                    if (expectreturn >= date) {
                        const day = dayleft(book.expect_return_date);
                        return_date = `To be returned in ${day} days`;
                    } else {
                        return_date = 'Please return the book';
                    }
                } else if (book.status === 'returned') {
                    return_date = book.return_date;
                } else if (book.status === 'To Pickup') {
                    deletepickup_borrow();
                }
                
                borrowdata.push({
                    borrow_id: book.borrow_id,
                    Books: book.Books,
                    borrow_date: book.borrow_date,
                    student: {
                        studentID: book.student.studentID,
                        firstname: book.student.firstname,
                        lastname: book.student.lastname
                    },
                    status: book.status,
                    expect_return_date: book.expect_return_date,
                    qrcode: book.qrcode,
                    studentID: book.studentID,
                    updatedAt: book.updatedAt,
                    createdAt: book.createdAt,
                    return_date: return_date
                });
            }) 
        );
       
        return res.status(200).json(borrowdata);
    } catch (error) {
        
        return res.sendStatus(500);
    }
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
        return res.status(500);
    }
};
export const deletepickup_borrow = async () => {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    try {
        const result = await db.borrow_book.findAll({
            where: {
                status: 'To Pickup',
                createdAt: {
                    [Op.lt]: twentyFourHoursAgo
                }
            }
        });

        if (result.length > 0) {
            const deletePromises = result.map(async (data) => {
                await Promise.all(
                    data.Books.map((i) =>
                        db.book.update(
                            {
                                status: 'available',
                                borrow_count: i.borrow_count - 1
                            },
                            {
                                where: {
                                    title: i.title
                                }
                            }
                        )
                    )
                );
                await db.borrow_book.destroy({
                    where: {
                        borrow_id: data.borrow_id
                    }
                });
            });

            await Promise.all(deletePromises);
        }
    } catch (error) {
        console.error(error);
    }
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
var fonts = {
    Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-MediumItalic.ttf'
    }
};
export const exportreport = async (req, res) => {
    const { name, department, information, informationtype, informationdate, filetype } = req.body;

    try {
        const result = await db.student.findAll({
            where: {
                department: department
            },
            include: [
                {
                    model: db.library_entry,
                    as: 'library_entries'
                },
                {
                    model: db.borrow_book,
                    where: {
                        status: {
                            [Op.ne]: 'To Pickup'
                        }
                    }
                }
            ]
        });

        if (result.length === 0) {
            return res.status(500).send('No Result');
        }

        const data = result.map((student) => {
            const { studentID, firstname, lastname, department, email, phone_number } = student;

            const library_entry = filterDataByTimeRange(student.library_entries, getDaysByInformationDate(informationdate));
            const borrowedbook = information !== 'entry' ? filterDataByTimeRange(student.borrow_books, getDaysByInformationDate(informationdate)) : [];

            return {
                ID: studentID,
                fullname: `${firstname} ${lastname}`,
                department,
                email,
                phone_number,
                library_entry,
                borrowedbook
            };
        });

        if (filetype === 'pdf') {
            const print = new PdfPrinter(fonts);

            const now = new Date();

            const docDefinition = {
                content: [
                    { text: `Report for students in ${data[0].department}`, style: 'header' },
                    `All Student Information from ${new Date(now - getDaysByInformationDate(informationdate) * 24 * 60 * 60 * 1000).toLocaleDateString('en')} to ${now.toLocaleDateString('en')}`,
                    {
                        style: 'tableExample',
                        table: {
                            headerRows: 1,
                            body: [
                                [
                                    { text: 'ID', style: 'tableHeader' },
                                    { text: 'Name', style: 'tableHeader' },
                                    { text: 'Department', style: 'tableHeader' },
                                    { text: 'Email', style: 'tableHeader' },
                                    { text: 'Phone Number', style: 'tableHeader' },
                                    { text: 'Library Entry', style: 'tableHeader' },
                                    information !== 'entry' ? { text: 'Borrowed Book', style: 'tableHeader' } : null
                                ],
                                ...data.map((i) => [
                                    i.ID,
                                    i.fullname,
                                    i.department,
                                    i.email,
                                    i.phone_number,
                                    informationtype !== 'short' ? i.library_entry.map((j) => j.entry_date).join(', ') : `${i.library_entry.length} Times`,
                                    information !== 'entry' ? `${i.borrowedbook.map((obj) => obj.Books.length).reduce((acc, length) => acc + length, 0)} books` : null
                                ])
                            ]
                        }
                    }
                ],
                styles: {
                    header: { fontSize: 16, bold: true, margin: [0, 0, 0, 10] },
                    tableExample: { margin: [0, 5, 0, 15] },
                    tableHeader: { bold: true, fontSize: 13, color: 'black' }
                }
            };

            const pdfdoc = print.createPdfKitDocument(docDefinition);
            pdfdoc.pipe(res);
            pdfdoc.end();
        } else {
            const workbook = generateExcel(data, information, informationtype);
            const buffer = await workbook.xlsx.writeBuffer();
            res.setHeader('Content-Disposition', `attachment; filename="${name}.xlsx"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        }
    } catch (error) {
        return res.status(500).send('An error occurred');
    }
};
const filterDataByTimeRange = (data, range) => {
    const now = new Date();
    const startDate = new Date(now.getTime() - range * 24 * 60 * 60 * 1000);

    return data.filter(({ createdAt }) => {
        const entryDate = new Date(createdAt);
        return entryDate >= startDate && entryDate <= now;
    });
};
const getDaysByInformationDate = (informationdate) => {
    switch (informationdate) {
        case 'tweek':
            return 7;
        case '2week':
            return 14;
        case '1month':
            return 30;
        case '3month':
            return 90;
        case '6month':
            return 180;
        default:
            return 0;
    }
};
