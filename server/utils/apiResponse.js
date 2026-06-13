const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  if (data && data.token) {
    res.cookie('token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }
  res.status(statusCode).json({ success: true, message, data });
};

const sendError = (res, message = 'Server Error', statusCode = 500) => {
  res.status(statusCode).json({ success: false, message });
};

module.exports = { sendSuccess, sendError };
