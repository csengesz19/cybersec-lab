import express from 'express';
import { requireAuthPage, requireAuthApi, requireAdminPage } from '../middleware/auth.js';
import { getTrainRouteById } from '../repositories/trainRouteRepository.js';
import {
  getBookingsByRouteId,
  deleteBooking,
  createBooking,
  getBookingOwnerId,
} from '../repositories/bookingRepository.js';
import { createComplaint, getComplaintSummary, getComplaintList } from '../repositories/complaintRepository.js';

const createRouter = express.Router;
const router = createRouter();

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

function isValidDatePart(value) {
  if (value.length !== 10) {
    return false;
  }

  const year = value.slice(0, 4);
  const dash1 = value[4];
  const month = value.slice(5, 7);
  const dash2 = value[7];
  const day = value.slice(8, 10);

  if (dash1 !== '-' || dash2 !== '-') {
    return false;
  }

  if (!isDigits(year)) {
    return false;
  }

  if (!isDigitPair(month) || !isDigitPair(day)) {
    return false;
  }

  return true;
}

function extractDateTimeFromIsoLikeString(value) {
  if (value.length < 16) {
    return '';
  }

  const datePart = value.slice(0, 10);
  const separator = value[10];
  const timePart = value.slice(11, 16);

  if (separator !== 'T' && separator !== ' ') {
    return '';
  }

  if (!isValidDatePart(datePart)) {
    return '';
  }

  if (!extractHourMinuteFromString(timePart)) {
    return '';
  }

  return `${datePart} ${timePart}`;
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

function formatDateTimeValue(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    const shortDateTime = extractDateTimeFromIsoLikeString(value);
    if (shortDateTime) {
      return shortDateTime;
    }
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())} ${pad2(
    date.getUTCHours(),
  )}:${pad2(date.getUTCMinutes())}`;
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

function mapBookingForView(booking) {
  return {
    ...booking,
    createdAt: formatDateTimeValue(booking.createdAt),
  };
}

function mapComplaintSummaryForView(summary) {
  return {
    ...summary,
    departureTime: formatTimeValue(summary.departureTime),
    lastComplaintAt: formatDateTimeValue(summary.lastComplaintAt),
  };
}

function mapComplaintForView(complaint) {
  return {
    ...complaint,
    departureTime: formatTimeValue(complaint.departureTime),
    createdAt: formatDateTimeValue(complaint.createdAt),
  };
}

function getRouteIdFromParams(params) {
  return Number(params.routeId ?? params.jaratId);
}

function getBookingIdFromParams(params) {
  return Number(params.bookingId ?? params.foglalasId);
}

router.get(['/train-routes/:routeId/bookings', '/jaratok/:jaratId/foglalasok'], async (req, res, next) => {
  try {
    const routeId = getRouteIdFromParams(req.params);

    if (!Number.isInteger(routeId) || routeId <= 0) {
      return res.status(400).render('error', {
        title: 'Bad request',
        message: 'Invalid route id.',
        error: null,
      });
    }

    const trainRouteRaw = await getTrainRouteById(routeId);
    if (!trainRouteRaw) {
      return res.status(404).render('error', {
        title: 'Route not found',
        message: 'The requested route does not exist',
        error: null,
      });
    }

    const bookingsRaw = await getBookingsByRouteId(routeId);

    return res.render('bookings', {
      title: 'Bookings',
      trainRoute: mapTrainRouteForView(trainRouteRaw),
      bookings: bookingsRaw.map(mapBookingForView),
      errorMessage: req.query.error || null,
      successMessage: req.query.success || null,
    });
  } catch (err) {
    return next(err);
  }
});

router.post(
  ['/train-routes/:routeId/bookings', '/jaratok/:jaratId/foglalasok'],
  requireAuthPage,
  async (req, res, next) => {
    try {
      const routeId = getRouteIdFromParams(req.params);
      const userId = req.session.user.id;
      const packetLabel = (req.body.packetLabel || '').trim();
      const packetCountRaw = req.body.packetCount;

      if (!Number.isInteger(routeId) || routeId <= 0) {
        return res.redirect(
          `/train-routes/${req.params.routeId ?? req.params.jaratId}/bookings?error=Invalid route id.`,
        );
      }

      if (!packetLabel) {
        return res.redirect(`/train-routes/${routeId}/bookings?error=Please provide a packet label.`);
      }

      const count = packetCountRaw ? Number(packetCountRaw) : 1;
      if (!Number.isInteger(count) || count <= 0) {
        return res.redirect(`/train-routes/${routeId}/bookings?error=Packet count must be a positive integer.`);
      }

      await createBooking({ routeId, userId, packetLabel, packetCount: count });

      return res.redirect(`/train-routes/${routeId}/bookings?success=Booking created successfully.`);
    } catch (err) {
      return next(err);
    }
  },
);

router.delete(
  ['/api/train-routes/:routeId/bookings/:bookingId', '/api/jaratok/:jaratId/foglalasok/:foglalasId'],
  requireAuthApi,
  async (req, res, next) => {
    try {
      const routeId = getRouteIdFromParams(req.params);
      const bookingId = getBookingIdFromParams(req.params);

      if (!Number.isInteger(routeId) || routeId <= 0 || !Number.isInteger(bookingId) || bookingId <= 0) {
        return res.status(400).json({ ok: false, error: 'Invalid id.' });
      }

      const ownerId = await getBookingOwnerId(routeId, bookingId);
      if (!ownerId) {
        return res.status(404).json({ ok: false, error: 'Booking not found.' });
      }

      if (ownerId !== req.session.user.id) {
        return res.status(403).json({ ok: false, error: 'You can only delete your own bookings.' });
      }

      const deletedId = await deleteBooking(routeId, bookingId);
      return res.json({ ok: true, deletedId, message: 'Booking deleted successfully.' });
    } catch (err) {
      return next(err);
    }
  },
);

router.post(
  ['/train-routes/:routeId/bookings/:bookingId/complaint', '/jaratok/:jaratId/foglalasok/:foglalasId/panasz'],
  requireAuthPage,
  async (req, res, next) => {
    try {
      const routeId = getRouteIdFromParams(req.params);
      const bookingId = getBookingIdFromParams(req.params);

      if (!Number.isInteger(routeId) || routeId <= 0 || !Number.isInteger(bookingId) || bookingId <= 0) {
        return res.redirect(`/train-routes/${req.params.routeId ?? req.params.jaratId}/bookings?error=Invalid id.`);
      }

      const ownerId = await getBookingOwnerId(routeId, bookingId);
      if (!ownerId) {
        return res.redirect(`/train-routes/${routeId}/bookings?error=Booking not found.`);
      }

      if (ownerId !== req.session.user.id) {
        return res.redirect(`/train-routes/${routeId}/bookings?error=You can only complain about your own bookings.`);
      }

      await createComplaint({ routeId, userId: req.session.user.id });

      return res.redirect(`/train-routes/${routeId}/bookings?success=Complaint submitted successfully.`);
    } catch (err) {
      return next(err);
    }
  },
);

router.get(['/admin/complaints', '/admin/panaszok'], requireAuthPage, requireAdminPage, async (req, res, next) => {
  try {
    const summaryRowsRaw = await getComplaintSummary();
    const complaintsRaw = await getComplaintList();

    return res.render('complaints', {
      title: 'Complaints',
      summaryRows: summaryRowsRaw.map(mapComplaintSummaryForView),
      complaints: complaintsRaw.map(mapComplaintForView),
      errorMessage: null,
      successMessage: null,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
