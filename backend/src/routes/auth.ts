import { Router } from 'express';
import { register, verifyRegistration, login } from '../controllers/auth';

const router = Router();

router.post('/register', register);
router.post('/verify-registration', verifyRegistration);
router.post('/login', login);

export default router;
