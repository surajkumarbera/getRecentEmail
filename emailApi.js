const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const base64 = require('js-base64');
const Mailparser = require('mailparser');


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];


// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';


const showRecentEmail = () => {
    return new Promise((resolve, reject) => {
        fs.readFile('credentials.json', (err, data) => {
            if (err) reject(err);
            else {
                console.log("Promise: Credentials found...")
                resolve(
                    new Promise((resolve, reject) => {
                        authorize(JSON.parse(data), (auth) => {
                            if (!auth) reject(auth);
                            else {
                                console.log("Promise: Authentication successfull...")
                                getRecentMail(auth).then(data => {
                                    resolve(data);
                                });
                            }
                        });
                    })
                );
            }
        });
    });
}


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const {
        client_secret,
        client_id,
        redirect_uris
    } = credentials.installed;

    const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
    );

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
            return getNewToken(oAuth2Client, callback);
        }

        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}


/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    console.log('Authorize this app by visiting this url:', authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();

        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                return console.error('Error retrieving access token', err);
            }

            oAuth2Client.setCredentials(token);

            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });

            callback(oAuth2Client);
        });
    });
}


/**
 * read a mail from Inbox
 */
function getMail(gmail, messageId) {
    return msg = new Promise((resolve, reject) => {
        gmail.users.messages.get(
            {
                userId: 'me',
                id: messageId
            },
            (err, res) => {
                if (err) reject(err);
                else {
                    console.log("Promise: Mail list received...");
                    let body = res.data.payload.parts[0].body.data;
                    let htmlBody = base64.decode(body.replace(/-/g, '+').replace(/_/g, '/'));
                    simplePaeser = Mailparser.simpleParser;

                    resolve(new Promise((resolve, reject) => {
                        simplePaeser(htmlBody, "skipHtmlToText", (err, parsedData) => {
                            if (err) reject(err);
                            else {
                                console.log("Promise: Parsed recent mail successfully...");
                                resolve(parsedData.textAsHtml)
                            };
                        })
                    }))
                }
            }
        );
    });
}


/**
 * 
 * get recent Mail from Inbox
 */
function getRecentMail(auth) {
    const gmail = google.gmail({ version: 'v1', auth });

    return new Promise((resolve, reject) => {
        gmail.users.messages.list(
            {
                userId: 'me',
            },
            (err, res) => {
                if (err) reject(err);
                else {
                    const messages = res.data.messages;
                    if (messages.length) {
                        //console.log("First mail ID : ", messages[0].id);
                        const mail = getMail(gmail, messages[0].id);
                        mail.then(data => {
                            console.log("Promise: Get Recent Mail...");
                            resolve(mail);
                        })
                    }
                }
            }
        )
    });
}


module.exports = showRecentEmail;
