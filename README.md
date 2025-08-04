# MERN Media Gallery + Contact Form

A full-stack MERN application featuring user authentication, a media gallery with image uploads, a contact form with user and admin views, and ZIP download functionality. Built with MongoDB Atlas, Express, React, Node.js, and Tailwind CSS, it includes secure JWT authentication, soft-delete for users, and Cloudinary for media storage.

##  Features

- **Authentication**: Register/login with Gmail OTP verification, Google OAuth (placeholder), and password reset.
- **Media Gallery**: Upload images (JPG/PNG, max 5MB) to Cloudinary, view personal gallery, download selected images as ZIP.
- **Contact Form**: Submit messages, view/edit/delete own messages, admin view for all messages with deletion.
- **Admin Features**: Manage users (view, update roles, deactivate) and view/delete all contact messages.
- **Security**: JWT-protected routes, soft-delete for users, input validation, file type/size checks.

##  Prerequisites

- **Node.js** (v20+ LTS): Install from [nodejs.org](https://nodejs.org).
- **Git**: For cloning the repository.
- **MongoDB Atlas**: Create a free cluster at [mongodb.com](https://mongodb.com).
- **Cloudinary Account**: Sign up at [cloudinary.com](https://cloudinary.com) for image storage.
- **Gmail SMTP**: Gmail account with App Password (enable 2FA, generate via Google Account settings).
- **Google OAuth** (optional): Client ID/Secret from [Google Cloud Console](https://console.cloud.google.com).


