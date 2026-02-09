import express from 'express';
import { addFacility, deleteFacility, getAllFacilities, reorderFacilities, updateFacility } from '../controllers/facilityController';

const router = express.Router();

router.get('/', getAllFacilities);
router.post('/', addFacility);
router.put('/reorder', reorderFacilities);
router.put('/:id', updateFacility);
router.delete('/:id', deleteFacility);

export default router;
