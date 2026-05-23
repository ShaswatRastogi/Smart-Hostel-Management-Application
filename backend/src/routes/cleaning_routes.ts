import { Router } from 'express';
import { 
    getInventory, 
    updateInventoryItem, 
    getChecklist, 
    toggleChecklistItem, 
    resetChecklist 
} from '../controllers/cleaning_controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Inventory
router.get('/inventory', requireAuth, getInventory);
router.put('/inventory/:id', requireAuth, requireRole(['owner', 'admin', 'warden', 'cleaning_staff']), updateInventoryItem);

// Checklist
router.get('/checklist', requireAuth, getChecklist);
router.put('/checklist/:id', requireAuth, requireRole(['owner', 'admin', 'warden', 'cleaning_staff']), toggleChecklistItem);
router.post('/checklist/reset', requireAuth, requireRole(['owner', 'admin', 'warden', 'cleaning_staff']), resetChecklist);

export default router;

