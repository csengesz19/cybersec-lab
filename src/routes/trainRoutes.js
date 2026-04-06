import express from 'express';
import { listTrainRoutes, getTrainRouteById, createTrainRoute } from '../repositories/trainRouteRepository.js';

function pickQueryString(value) {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }

  return typeof value === 'string' ? value : '';
}

function parseOptionalInt(value) {
  const s = pickQueryString(value);
  if (!s) {
    return null;
  }

  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function isDigitChar(ch) {
  return ch >= '0' && ch <= '9';
}

function isDigits(value) {
  if (!value) {
    return false;
  }

  for (let i = 0; i < value.length; i += 1) {
    if (!isDigitChar(value[i])) {
      return false;
    }
  }

  return true;
}

function isDigitPair(value) {
  return value.length === 2 && isDigits(value);
}

function extractHourMinuteFromString(value) {
  if (value.length < 5) {
    return '';
  }

  const hour = value.slice(0, 2);
  const colon = value[2];
  const minute = value.slice(3, 5);

  if (colon !== ':') {
    return '';
  }

  if (!isDigitPair(hour) || !isDigitPair(minute)) {
    return '';
  }

  return `${hour}:${minute}`;
}

function formatTimeValue(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    const shortTime = extractHourMinuteFromString(value);
    if (shortTime) {
      return shortTime;
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${pad2(value.getUTCHours())}:${pad2(value.getUTCMinutes())}`;
  }

  return String(value);
}

function mapTrainRouteForView(trainRoute) {
  if (!trainRoute) {
    return trainRoute;
  }

  return {
    ...trainRoute,
    departureTime: formatTimeValue(trainRoute.departureTime),
  };
}

function buildIndexModel(query, trainRoutes) {
  const sourceServer = pickQueryString(query.sourceServer);
  const destinationServer = pickQueryString(query.destinationServer);
  const minCostRaw = pickQueryString(query.minCost);
  const maxCostRaw = pickQueryString(query.maxCost);
  const success = pickQueryString(query.success);

  return {
    title: 'Train Routes',
    trainRoutes: trainRoutes.map(mapTrainRouteForView),
    search: {
      sourceServer,
      destinationServer,
      minCost: minCostRaw,
      maxCost: maxCostRaw,
    },
    errorMessage: null,
    successMessage: success || null,
  };
}

function buildFilters(query) {
  const sourceServer = pickQueryString(query.sourceServer);
  const destinationServer = pickQueryString(query.destinationServer);
  const minCost = parseOptionalInt(query.minCost);
  const maxCost = parseOptionalInt(query.maxCost);

  return {
    sourceServer,
    destinationServer,
    minCost,
    maxCost,
  };
}

const createRouter = express.Router;
const router = createRouter();

router.get(['/train-routes', '/jaratok'], async (req, res, next) => {
  try {
    const filters = buildFilters(req.query);
    const trainRoutes = await listTrainRoutes(filters);

    return res.render('trainRoutes', buildIndexModel(req.query, trainRoutes));
  } catch (err) {
    return next(err);
  }
});

router.get(['/api/train-routes/:routeId', '/api/jaratok/:routeId'], async (req, res, next) => {
  try {
    const id = Number(req.params.routeId);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: 'Invalid train route id.' });
    }

    const trainRoute = await getTrainRouteById(id);
    if (!trainRoute) {
      return res.status(404).json({ ok: false, error: 'Train route not found.' });
    }

    return res.json({ ok: true, data: mapTrainRouteForView(trainRoute) });
  } catch (err) {
    return next(err);
  }
});

router.post(['/train-routes', '/jaratok'], async (req, res, next) => {
  try {
    const { sourceServer, destinationServer, dayOfWeek, departureTime, cost, trainType } = req.body;

    if (!sourceServer || !destinationServer || !dayOfWeek || !departureTime || !cost || !trainType) {
      return res.status(400).render('trainRoutes', {
        title: 'Train Routes',
        trainRoutes: [],
        search: { sourceServer: '', destinationServer: '', minCost: '', maxCost: '' },
        errorMessage: 'Please fill in all fields to create a new train route.',
        successMessage: null,
      });
    }

    const numericCost = Number(cost);
    if (!Number.isInteger(numericCost) || numericCost <= 0) {
      return res.status(400).render('trainRoutes', {
        title: 'Train Routes',
        trainRoutes: [],
        search: { sourceServer: '', destinationServer: '', minCost: '', maxCost: '' },
        errorMessage: 'Cost must be a positive integer.',
        successMessage: null,
      });
    }

    await createTrainRoute({
      sourceServer,
      destinationServer,
      dayOfWeek,
      departureTime,
      cost: numericCost,
      trainType,
    });

    return res.redirect('/train-routes?success=New train route created successfully.');
  } catch (err) {
    return next(err);
  }
});

export default router;
