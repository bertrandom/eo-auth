#!/usr/bin/env node
const { program } = require('commander');
const inquirer = require('inquirer');
const emailValidator = require('email-validator');

const {
    getDb,
    getAccessToken,
    getStatus,
} = require ('./auth');

(async () => {
    var db = await getDb();

    program
        .command('configure')
        .description('configure with your EO login credentials')
        .action(async () => {

            var username = null;

            try {
                username = await db.get('username', { asBuffer: false });
            } catch (e) {
                username = null;
            }

            const answers = await inquirer
                .prompt([{
                    type: 'input',
                    name: 'username',
                    message: 'Email Address:',
                    validate: emailValidator.validate,
                    default: username
                }, {
                    type: 'password',
                    name: 'password',
                    message: 'Password:',
                    mask: true,
                    validate: (value) => {
                        return value.length > 0;
                    }
                }
                ]);

            await db.put('username', answers.username);
            await db.put('password', answers.password);
            console.log('Email address and password stored.');

        });

    program
        .command('reset')
        .description('remove existing credentials and tokens')
        .action(async () => {

            await db.clear();
            console.log('Auth reset.');

        });

    program
        .command('status')
        .description('dump stored credentials and tokens')
        .action(async () => {

            var status = await getStatus();
            console.log(status);

        });

    program
        .command('token')
        .description('get an up-to-date access token')
        .action(async () => {

            try {
                var accessToken = await getAccessToken();
            } catch (e) {
                if (e.name === 'CredentialsNotStored') {
                    console.log('Credentials not stored, please run configure.');
                } else if (e.name === 'InvalidCredentials') {
                    console.log('Invalid credentials.');
                } else {
                    console.log(e);
                }
                return;
            }

            process.stdout.write(accessToken);

        });

    program.parse(process.argv);

})();