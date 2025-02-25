import { Router } from 'express';
import { signupRoute, loginRoute, logoutRoute } from '../controllers/auth.controller.js';

const router = Router();

router.route('/signup').post( signupRoute );
router.route('/login').post( loginRoute );
router.route('/logout').post( logoutRoute );

export default router;