SSL Files
=========

**WARNING:**

These files are *self-signed* and therefore a *security
exception* will be generated for users visiting Tunes! remotely.


The following command was used to generate the certificates:

`$ openssl req -x509 -days 200000 -nodes -newkey rsa:2048 -keyout key.pem -out cert.pem`
