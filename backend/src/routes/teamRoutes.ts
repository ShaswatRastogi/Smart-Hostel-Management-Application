import { Router } from 'express';
import {
    createTeamMember,
    deleteTeamMember,
    getTeamMembers,
    getWardensForStudents,
    updateTeamMember
} from '../controllers/teamController';
import { requireWardenOrOwner, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, requireWardenOrOwner, getTeamMembers);
router.get('/wardens', requireAuth, getWardensForStudents);
router.post('/', requireAuth, requireWardenOrOwner, createTeamMember);
router.put('/:id', requireAuth, requireWardenOrOwner, updateTeamMember);
router.delete('/:id', requireAuth, requireWardenOrOwner, deleteTeamMember);

export default router;
