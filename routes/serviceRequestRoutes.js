import express from "express";
import { hasRole, isAuthenticated } from "../utilities/middlewares/authenticationMiddleware";
import { getAllServiceRequests } from "../data/servicerequests";

const router = express.Router();

router.get('/', isAuthenticated, hasRole('employee'), async (req, res) => {
    try {
        const requests = await getAllServiceRequests();
        req.status(200).render('dashboards/employee-dashboard', {requests})
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

router.post('/', isAuthenticated, hasRole('customer'), async(req, res) => {
    
})

export default router;
