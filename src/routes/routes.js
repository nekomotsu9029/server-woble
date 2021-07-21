const express = require('express');
const jwt = require('jsonwebtoken')
const router = express.Router();

const secretToken = 'nekomotsuSecretToken'

const _user = require('../models/user');
const _board = require('../models/board');
const _task = require('../models/task');

//const {name, email, password} = req.body;
router.post('/api/signup', async (req, res)=>{
    const {name, email, password} = req.body;
    const user = await _user.findOne({email: email});
    if(user){
        return res.json({
            auth: false,
            message: "Parece que tu Doppelgänger ya a creado una cuenta con este correo :( que miedo!   "
        })
    }
    const userSave = new _user({
        name,
        email,
        password,
        img: 'http://placekitten.com/200/200',
        theme: 'sketchy'
    });
    userSave.password = await userSave.encryptPassword(userSave.password);
    await userSave.save();
    const token = jwt.sign({id: userSave._id}, secretToken, {
        expiresIn: 60 * 60 * 24 * 2
    })
    res.json({
        auth: true,
        token
    })
});

//const {email, password} = req.body;
router.post('/api/signin', async (req, res)=>{
    const {email, password} = req.body;
    const user = await _user.findOne({
        email
    });
    if(!user){
        return res.json({
            auth: false,
            message: "No existe una cuenta Woble con este correo :(   "
        })
    }
    const passwordIsValid = await user.comparePassword(password);
    if(!passwordIsValid){
        return res.json({
            auth: false,
            message: "Esta contraseña no coincide con la cuenta "+email+'   '
        })
    }
    const token = jwt.sign({id: user._id}, secretToken, {
        expiresIn: 60 * 60 * 24 * 2
    })
    res.json({
        auth: true,
        token
    })
});

router.get('/api/user', async (req, res)=>{
    const tokenClient = req.header('x-access-token');
    if(!tokenClient){
        return res.status(401).json({
            auth: false,
            message: 'No token provided'
        });
    }
    const decoded = jwt.verify(tokenClient, secretToken);
    const user = await _user.findById(decoded.id, {password: 0});
    if(!user){
        return res.json({
            auth: false,
            message: 'No user found'
        })
    }
    res.json({
        auth: true,
        user
    })
});

//const {theme} = req.body
router.put('/api/user/theme', async (req, res)=>{
    const tokenClient = req.header('x-access-token');
    if(!tokenClient){
        return res.status(401).json({
            auth: false,
            message: 'No token provided'
        });
    }
    const decoded = jwt.verify(tokenClient, secretToken);
    const user = await _user.findById(decoded.id);
    if(!user){
        return res.json({
            auth: false,
            message: 'No user found'
        })
    }
    //si llega aqui es por que encontro el usuario gracias al token
    //ahora procedo a editar el usuario
    const {theme} = req.body;
    user.theme = theme;
    await _user.updateOne({_id: user._id}, user);
    res.json({
        auth: true,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            img: user.img,
            theme: user.theme
        }
    })
})

//const {name, email, changepass, password} = req.body;
router.put('/api/user', async (req, res)=>{
    const tokenClient = req.header('x-access-token');
    if(!tokenClient){
        return res.status(401).json({
            auth: false,
            message: 'No token provided'
        });
    }
    const decoded = jwt.verify(tokenClient, secretToken);
    const user = await _user.findById(decoded.id);
    if(!user){
        return res.json({
            auth: false,
            message: 'No user found'
        })
    }
    //si llega aqui es por que encontro el usuario gracias al token
    //ahora procedo a editar el usuario
    const {name, email, changepass, password} = req.body;
    user.name = name;
    user.email = email;
    if(changepass == true && password != ''){
        user.password = user.encryptPassword(password);
    }
    await _user.updateOne({_id: user._id}, user);
    res.json({
        auth: true,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            img: user.img
        }
    })
});

router.delete('/api/user', async (req, res)=>{
    const tokenClient = req.header('x-access-token');
    if(!tokenClient){
        return res.status(401).json({
            auth: false,
            message: 'No token provided'
        });
    }
    const decoded = jwt.verify(tokenClient, secretToken);
    const user = await _user.findById(decoded.id);
    if(!user){
        return res.json({
            auth: false,
            message: 'No user found'
        })
    }
    //si llega aqui es por que encontro el usuario gracias al token
    //ahora procedo a eliminar el usuario
    await _user.remove({_id: user._id});
    res.json({
        auth: false,
        message: 'User delete'
    })
});

router.get('/api/board', async (req, res)=>{
    const tokenClient = req.header('x-access-token');
    if(!tokenClient){
        return res.status(401).json({
            auth: false,
            message: 'No token provided'
        });
    }
    const decoded = jwt.verify(tokenClient, secretToken);
    const user = await _user.findById(decoded.id, {password: 0});
    if(!user){
        return res.json({
            auth: false,
            message: 'No user found'
        })
    }
    //si llega aqui es por que encontro el usuario gracias al token
    //ahora procedo a obtener los tableros relacionados al usuario
    const board = await getUserBoards(user);
    res.json({
        auth: true,
        board
    })
});

//const {name, description, date, mailusers} = req.body;
//en este caso users sera un array de correos
router.post('/api/board', async (req, res)=>{
    const tokenClient = req.header('x-access-token');
    if(!tokenClient){
        return res.status(401).json({
            auth: false,
            message: 'No token provided'
        });
    }
    const decoded = jwt.verify(tokenClient, secretToken);
    const user = await _user.findById(decoded.id, {password: 0});
    if(!user){
        return res.json({
            auth: false,
            message: 'No user found'
        })
    }
    //si llega aqui es por que encontro el usuario gracias al token
    //ahora procedo a crear el tablero relacionado al usuario
    const {name, description, date, mailusers} = req.body;
    let users = [];
    for(let i=0; i<mailusers.length; i++){
        item = mailusers[i];
        itemUser = await _user.findOne({email: item}, {password: 0});
        if(itemUser){
            users.push(itemUser);
        }
    }
    const boardSave = new _board({
        img: 'https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?cs=srgb&dl=pexels-lukas-669615.jpg&fm=jpg',
        name,
        description,
        date,
        users
    })
    await boardSave.save();
    const board = await getUserBoards(user);
    res.json({
        auth: true,
        board
    })
});

//const {boardUpdate} = req.body;
router.put('/api/board/:id', async (req, res)=>{
    const tokenClient = req.header('x-access-token');
    if(!tokenClient){
        return res.status(401).json({
            auth: false,
            message: 'No token provided'
        });
    }
    const decoded = jwt.verify(tokenClient, secretToken);
    const user = await _user.findById(decoded.id, {password: 0});
    if(!user){
        return res.json({
            auth: false,
            message: 'No user found'
        })
    }
    //si llega aqui es por que encontro el usuario gracias al token
    //ahora procedo a editar el tablero relacionado al id
    const {boardUpdate} = req.body;
    const {id} = req.params;
    await _board.updateOne({_id: id}, boardUpdate);
    const board = await getUserBoards(user);
    res.json({
        auth: true,
        board
    })
});

router.delete('/api/board/:id', async (req, res)=>{
    const tokenClient = req.header('x-access-token');
    if(!tokenClient){
        return res.status(401).json({
            auth: false,
            message: 'No token provided'
        });
    }
    const decoded = jwt.verify(tokenClient, secretToken);
    const user = await _user.findById(decoded.id, {password: 0});
    if(!user){
        return res.json({
            auth: false,
            message: 'No user found'
        })
    }
    //si llega aqui es por que encontro el usuario gracias al token
    //ahora procedo a eliminar el tablero relacionado al id
    const {id} = req.params;
    await _board.remove({_id: id});
    const board = await getUserBoards(user);
    res.json({
        auth: true,
        board
    })
});

router.get('/api/task', async (req, res)=>{
    const tokenClient = req.header('x-access-token');
    if(!tokenClient){
        return res.status(401).json({
            auth: false,
            message: 'No token provided'
        });
    }
    const decoded = jwt.verify(tokenClient, secretToken);
    const user = await _user.findById(decoded.id, {password: 0});
    if(!user){
        return res.json({
            auth: false,
            message: 'No user found'
        })
    }
    //si llega aqui es por que encontro el usuario gracias al token
    //ahora procedo a obtener los tableros relacionados al usuario
    const task = await getUserTasks(user);
    res.json({
        auth: true,
        task
    })
});

//const {name, description, date, category, targetDate, idboard} = req.body;
router.post('/api/task', async (req, res)=>{
    const tokenClient = req.header('x-access-token');
    if(!tokenClient){
        return res.status(401).json({
            auth: false,
            message: 'No token provided'
        });
    }
    const decoded = jwt.verify(tokenClient, secretToken);
    const user = await _user.findById(decoded.id, {password: 0});
    if(!user){
        return res.json({
            auth: false,
            message: 'No user found'
        })
    }
    //si llega aqui es por que encontro el usuario gracias al token
    //ahora procedo a crear el tablero relacionado al usuario
    const {name, description, date, category, targetDate, idboard} = req.body;
    const taskSave = new _task({
        img: 'https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260',
        name,
        description,
        date,
        category,
        targetDate,
        comments: [],
        /*
            {
            img,
            name,
            comment
            }
        */
        user,
        idboard
    });
    await taskSave.save();
    const task = await getUserTasks(user);
    res.json({
        auth: true,
        task
    })
});

//const {taskUpdate} = req.body;
router.put('/api/task/:id', async (req, res)=>{
    const tokenClient = req.header('x-access-token');
    if(!tokenClient){
        return res.status(401).json({
            auth: false,
            message: 'No token provided'
        });
    }
    const decoded = jwt.verify(tokenClient, secretToken);
    const user = await _user.findById(decoded.id, {password: 0});
    if(!user){
        return res.json({
            auth: false,
            message: 'No user found'
        })
    }
    //si llega aqui es por que encontro el usuario gracias al token
    //ahora procedo a crear el tablero relacionado al usuario
    const {taskUpdate} = req.body;
    const {id} = req.params;
    await _task.updateOne({_id: id}, taskUpdate);
    const task = await getUserTasks(user);
    res.json({
        auth: true,
        task
    })
});

router.delete('/api/task/:id', async (req, res)=>{
    const tokenClient = req.header('x-access-token');
    if(!tokenClient){
        return res.status(401).json({
            auth: false,
            message: 'No token provided'
        });
    }
    const decoded = jwt.verify(tokenClient, secretToken);
    const user = await _user.findById(decoded.id, {password: 0});
    if(!user){
        return res.json({
            auth: false,
            message: 'No user found'
        })
    }
    //si llega aqui es por que encontro el usuario gracias al token
    const {id} = req.params;
    await _task.remove({_id: id});
    const task = await getUserTasks(user);
    res.json({
        auth: true,
        task
    })
});

async function getUserBoards(user){
    const allboards = await _board.find();
    let board = [];
    for(let index=0; index<allboards.length; index++){
        item = allboards[index].users;
        for(let index2=0; index2<item.length; index2++){
            item2 = item[index2];
            if(user._id+''==item2._id+''){
                board.push(allboards[index]);
            }
        }
    }
    return board;
}

async function getUserTasks(user){
    const board = await getUserBoards(user);
    let task = [];
    for(let index=0; index<board.length; index++){
        let item = board[index];
        const taskItem = await _task.find({idboard: item._id});
        for(let index2=0; index2<taskItem.length; index2++){
            let item2 = taskItem[index2];
            task.push(item2);
        }
    }
    return task;
}

module.exports = router;