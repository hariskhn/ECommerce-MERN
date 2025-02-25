import User from '../models/user.model.js';

const signupRoute = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if(userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
    
        const user = await User.create({ name, email, password });
    
        return res.status(201).json({ user, message: 'User created successfully' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const loginRoute = (req, res) => {
    res.send('Login route called');
}

const logoutRoute = (req, res) => {
    res.send('Logout route called');
}

export {
    signupRoute,
    loginRoute,
    logoutRoute
}