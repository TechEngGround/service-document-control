const FormData = require('form-data');
const fs = require('fs')

const form = new FormData();
const stream = fs.createReadStream("./downloads/LEI02.pdf");
 
form.append('file', stream);

console.log(stream)