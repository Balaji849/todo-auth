import PropTypes from "prop-types";
export const taskType = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  title: PropTypes.string,
  description: PropTypes.string,
  project: PropTypes.string,
  status: PropTypes.string,
  priority: PropTypes.string,
  dueDate: PropTypes.string,
  createdAt: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  completedAt: PropTypes.string,
  subtasks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      done: PropTypes.bool,
    }),
  ),
});
export const tasksType = PropTypes.arrayOf(taskType);
export const userType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  fullName: PropTypes.string,
  username: PropTypes.string,
});
