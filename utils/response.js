export const sendResponse = (res, status, success, message, data = null) => {
  const response = {
    success,
    message,
    ...(data && { data }),
  };
  return res.status(status).json(response);
};
