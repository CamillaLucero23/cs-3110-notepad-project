const { createHmac } = require('crypto');
const secret = 'abcdefg';
const hash = (str) => createHmac('sha256', secret).update(str).digest('hex');
console.log(hash('dastley' + 'rick'));
