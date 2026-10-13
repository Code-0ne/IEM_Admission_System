import express from 'express';
import { COURSES_CATALOGUE, COURSE_BY_ID } from './coursesData.js';
import { NotFoundError } from '../../errors.js';

export const coursesRouter = express.Router();

/**
 * GET /api/courses
 * List all available programs and their streams, eligibility, and fees
 * Supports query param: ?level=UG or ?level=PG
 */
coursesRouter.get('/', (req, res) => {
  const { level } = req.query;
  let result = COURSES_CATALOGUE;
  if (level) {
    result = result.filter(
      (course) => course.level.toUpperCase() === level.toUpperCase()
    );
  }
  res.status(200).json({
    success: true,
    count: result.length,
    courses: result,
  });
});

/**
 * GET /api/courses/:id
 * Retrieve details for a specific program
 */
coursesRouter.get('/:id', (req, res, next) => {
  const { id } = req.params;
  const course = COURSE_BY_ID[id.toLowerCase()];
  if (!course) {
    return next(new NotFoundError(`Course '${id}' not found`));
  }
  res.status(200).json({
    success: true,
    course,
  });
});

export default coursesRouter;
