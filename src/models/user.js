const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const {Schema} = mongoose;

const user = new Schema({
    name: String,
    email: String,
    password: String,
    img: String,
    theme: String
});

user.methods.encryptPassword = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

user.methods.comparePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('user', user);