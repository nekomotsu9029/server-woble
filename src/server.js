//requerimos nuestros modulos
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');

//inicializamos express
const app = express();

//traemos la configuracion de la base de datos
require('./database/database.js');

//definimos el puerto de nuestro servidor
app.set('port', process.env.PORT || 3000);

//middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

//configuramos las rutas
app.use(require('./routes/routes.js'));

app.listen(app.get('port'), () => {
    console.log('El servidor esta a la escucha de peticiones en el puerto', app.get('port'))
});