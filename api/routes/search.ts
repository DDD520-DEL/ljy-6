import { Router } from 'express';
import { SpeciesService } from '../services/speciesService.js';
import { ObservationService } from '../services/observationService.js';
import { UserService } from '../services/userService.js';

const router = Router();

router.get('/', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) {
    return res.json({ success: true, data: { species: [], observations: [], users: [] } });
  }

  const speciesResult = SpeciesService.getAll({ search: q, limit: 20 });
  const observationsResult = ObservationService.list({ search: q, limit: 20 });
  const usersResult = UserService.search({ q, limit: 20 });

  res.json({
    success: true,
    data: {
      species: speciesResult.data,
      observations: observationsResult.data,
      users: usersResult.data,
    },
    total: {
      species: speciesResult.total,
      observations: observationsResult.total,
      users: usersResult.total,
    },
  });
});

export default router;
