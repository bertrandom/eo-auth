const mkdirp = require('mkdirp');
const levelup = require('levelup');
const leveldown = require('leveldown');
const rp = require('request-promise-native');
const config = {
    client_id: "d567b0f1d8156306e24953cf463a258b85ee4b5e5ae3e343958308b57d78d582",
    client_secret: "25bfd7d28ac7bddf571a26fc35a8c0c613600d9d9cf0ca7799baac2e57be69dd",
};

var localDb = null;

const getDb = async () => {
    if (localDb) {
        return localDb;
    }
    var homeDir = require('home-dir');
    await mkdirp(homeDir('/.eo-auth'));
    localDb = levelup(leveldown(homeDir('/.eo-auth/auth.db')));
    return localDb;
}

const getUsernameAndPassword = async (db) => {

    return {
        username: await db.get('username', { asBuffer: false }),
        password: await db.get('password', { asBuffer: false }),
    }

}

const loginWithUsernameAndPassword = async (username, password) => {

    var options = {
        'method': 'POST',
        'url': 'https://api.electricobjects.com/oauth/token',
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            'username': username,
            'password': password,
            'client_id': config.client_id,
            'client_secret': config.client_secret,
            'grant_type': 'password',
            'scope': 'public write device'
        },
        json: true
    };

    try {
        var body = await rp(options);
    } catch (e) {
        if (e.name === 'StatusCodeError' && e.statusCode === 401) {
            var error = new Error('Invalid credentials.');
            error.name = 'InvalidCredentials';
            throw error;
        }
        throw error;
    }

    return body;

};

const refreshToken = async (refreshToken) => {

    var options = {
        'method': 'POST',
        'url': 'https://api.electricobjects.com/oauth/token',
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            'refresh_token': refreshToken,
            'client_id': config.client_id,
            'client_secret': config.client_secret,
            'grant_type': 'refresh_token',
        },
        json: true
    };

    return await rp(options);

};

const getAccessToken = async () => {

    var db = await getDb();
    var currentAuth = null;

    try {
        currentAuth = await db.get('currentAuth', { asBuffer: false });
    } catch (e) {
        if (e.notFound) {
            currentAuth = null;
        }
    }
    if (currentAuth) {
        currentAuth = JSON.parse(currentAuth);
    }

    var body;

    if (currentAuth === null) {

        try {
            ({ username, password } = await getUsernameAndPassword(db));
        } catch (e) {
            var error = new Error('Credentials not stored.');
            error.name = 'CredentialsNotStored';
            throw error;
        }

        body = await loginWithUsernameAndPassword(username, password);
        await db.put('currentAuth', JSON.stringify(body));
        currentAuth = body;

    } else {

        let currentTime = Math.floor(Date.now() / 1000);
        if (currentTime >= (currentAuth.created_at + currentAuth.expires_in)) {

            try {
                body = await refreshToken(currentAuth.refresh_token);
            } catch (e) {

                try {
                    ({ username, password } = await getUsernameAndPassword(db));
                } catch (e) {
                    var error = new Error('Credentials not stored.');
                    error.name = 'CredentialsNotStored';
                    throw error;
                }
                body = await loginWithUsernameAndPassword(username, password);

            }

            await db.put('currentAuth', JSON.stringify(body));
            currentAuth = body;

        }

    }

    return currentAuth.access_token;

};

const getStatus = async () => {

    var db = await getDb();
    var currentAuth = null;

    try {
        currentAuth = await db.get('currentAuth', { asBuffer: false });
    } catch (e) {
        if (e.notFound) {
            currentAuth = null;
        }
    }
    if (currentAuth) {
        currentAuth = JSON.parse(currentAuth);
    }

    var credentials = null;
    try {
        var credentials = await getUsernameAndPassword(db);
    } catch (e) {
        if (e.notFound) {
            credentials = null;
        }
    }

    if (credentials && credentials.password) {
        credentials.password = '********';
    }

    return {
        credentials,
        currentAuth
    };

};

module.exports = {
    getDb,
    getUsernameAndPassword,
    loginWithUsernameAndPassword,
    refreshToken,
    getAccessToken,
    getStatus,
};