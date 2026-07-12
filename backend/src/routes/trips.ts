import { Router } from 'express';
import { getTrips, createTrip, updateTrip, deleteTrip } from '../controllers/trips';

const router = Router();

router.get('/', getTrips);
router.post('/', createTrip);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);

export default router;
