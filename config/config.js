const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const QRCode = require('qrcode')
require('dotenv').config();

export const jwtconfig = {
    secret: process.env.JWT_SECRET,
    option: {
        expiresIn: '1h'
    }
};
export const dbconfig = {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    user: process.env.DB_USER,
    password: 'lms123',
    db: process.env.DB_NAME
};
export const initalrole = async (role, book) => {
    const allrole = await role.findAll();
    const data = [
        {
            role_id: uuidv4(),
            role: 'librarian',
            role_description: ''
        },
        {
            role_id: uuidv4(),
            role: 'student',
            role_description: ''
        },
        {
            role_id: uuidv4(),
            role: 'headdepartment',
            role_description: ''
        }
    ];
    if (allrole.length < 0) {
        role.bulkCreate(data)
            .then(() => {
                console.log('role created');
            })
            .catch((err) => console.log(err));
        // getgooglebook('Business & Economics',book)
    } else {
        data.map((i) =>
            role
                .findOne({ where: { role: i.role } })
                .then((rl) => {
                    if (rl) return;
                    else {
                        role.create(i);
                    }
                })
                .catch((err) => console.log(err))
        );
    }
};
export const getgooglebook = (categories, db) => {
    const subject = categories;
    const url = `https://www.googleapis.com/books/v1/volumes?q=subject:${subject}&printType=books&orderBy=relevance&maxResults=10&key=${process.env.GOOGLEBOOK_APIKEY}`;
    let book = [];
    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            data.items.map((i) =>
                book.push({
                    ISBN: i.volumeInfo.industryIdentifiers,
                    title: i.volumeInfo.title,
                    description: i.volumeInfo.description,
                    cover_img: i.volumeInfo.imageLinks.thumbnail,
                    author: i.volumeInfo.authors,
                    publisher_date: i.volumeInfo.publishedDate,
                    categories: i.volumeInfo.categories,
                    status: 'available'
                })
            );
            db.bulkCreate(book)
                .then(() => console.log('book saved'))
                .catch((err) => console.log(err));
        })
        .catch((err) => {
            console.log(err);
        });
};

const awsS3config = {
    accessKeyId: process.env.AWS_ACCESSKEY,
    secretAccessKey: process.env.AWS_SECRETKEY,
    region: 'ap-southeast-1'
};
const S3 = new AWS.S3(awsS3config);

export const uploadfile = (filepath, keyname) => {
    return new Promise((resolve, reject) => {
        try {
            let fs = require('fs');
            const file = fs.readFileSync(filepath);
            const bucket = 'fyplms';

            const uploadParam = {
                Bucket: bucket,
                Key: keyname,
                Body: file
            };
            S3.upload(uploadParam, (err, data) => {
                if (err) reject(err);
                if (data) resolve(data);
            });
        } catch (error) {
            console.log(error);
            return reject(error);
        }
    });
};

export const getURL = (key) => {
    return new Promise((resolve, reject) => {
        try {
            const path = require('path');
            const fileName = path.basename(key);

            var params = {
                Bucket: 'fyplms',
                Key: key
            };

            const signedUrl = S3.getSignedUrl('getObject', params);

            if (signedUrl) {
                return resolve({
                    signedUrl,
                    fileName
                });
            } else {
                return reject('Cannot create signed URL');
            }
        } catch (err) {
            return reject('Cannot create signed URL!');
        }
    });
};

export const deleteObject = async (key) => {
    
            var params = {
                Bucket: 'fyplms',
                Key: key
            };

            await S3.deleteObject(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                  } else {
                    console.log('File deleted successfully');
                  }
            }).promise()

          
       
  
};

export async function generateQRCodeAndUploadToS3(text, bucketName, key) {
    // Generate QR code as a PNG buffer
    const qrCodeBuffer = await QRCode.toBuffer(text, { type: 'png' });
    
    // Upload the QR code buffer to S3
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: qrCodeBuffer,
      ContentType: 'image/png',
      ACL: 'public-read'
    };
    const { Location } = await S3.upload(params).promise();
  
    return Location;
  }

