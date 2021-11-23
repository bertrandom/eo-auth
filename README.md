# eo-auth

Generates and stores an access token for the Electric Objects API using your login credentials. Automatically handles refreshing the token when it expires.

## Usage

Install globally:

```
npm install -g eo-auth
```

and then run:

```
eo-auth configure
```

You will be prompted for your login credentials. If login is successful, it will store your login credentials and tokens in:
```
~/.eo-auth/
```

You can retrieve the current access token via the CLI by running:
```
eo-auth token
```

It will automatically be refreshed if it is expired.

You may also retrieve the token programmatically from another node app by writing:
```
var eoAuth = require('eo-auth');
var accessToken = await eoAuth.getAccessToken();
```

If you'd like to erase the stored tokens and credentials:
```
eo-auth reset
```

or remove the directory:
```
~/.eo-auth/
```

You can also debug the stored tokens and credentials with:
```
eo-auth status
```

If your password has been stored, it will be obfuscated, but the access and refresh tokens will be displayed.

## License

ISC