import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, validate } from '../middleware/index.js';
import { asyncHandler as h } from '../utils/helpers.js';
import * as s from '../schemas/index.js';
import * as auth from '../controllers/auth.js';
import * as doctors from '../controllers/doctors.js';
import * as patients from '../controllers/patients.js';
import * as dashboard from '../controllers/dashboard.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, try again later' },
});

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

// auth
router.post('/auth/login', loginLimiter, validate({ body: s.loginBody }), h(auth.login));
router.post('/auth/demo', loginLimiter, h(auth.demoLogin));
router.post('/auth/logout', auth.logout);
router.get('/auth/me', requireAuth, h(auth.me));

// everything below requires a valid session
router.use(requireAuth);

router.get('/dashboard/stats', validate({ query: s.dashboardQuery }), h(dashboard.stats));

router.get('/doctors', validate({ query: s.doctorQuery }), h(doctors.listDoctors));
router.get('/doctors/filters', h(doctors.doctorFilters));
router.post('/doctors', validate({ body: s.doctorBody }), h(doctors.createDoctor));
router.get('/doctors/:id', validate({ params: s.idParam }), h(doctors.getDoctor));
router.delete('/doctors/:id', validate({ params: s.idParam }), h(doctors.deleteDoctor));
router.get('/doctors/:id/patients', validate({ params: s.idParam, query: s.patientQuery }), h(doctors.listDoctorPatients));
router.post('/doctors/:id/patients', validate({ params: s.idParam, body: s.patientBody }), h(doctors.addPatientToDoctor));

router.get('/patients', validate({ query: s.patientQuery }), h(patients.listPatients));
router.get('/patients/conditions', h(patients.patientConditions));
router.patch('/patients/:id', validate({ params: s.idParam, body: s.patientUpdateBody }), h(patients.updatePatient));
router.delete('/patients/:id', validate({ params: s.idParam }), h(patients.deletePatient));

export default router;
