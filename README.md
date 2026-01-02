📄 Claims Management Portal

A serverless, web-based expense claims management system that enables users to submit and track claims with receipts, while administrators manage approvals, users, and SLA monitoring — all powered by Google Apps Script, Google Sheets, and Google Drive.

🚀 Overview

The Claims Management Portal is designed for internal organizational use, providing a simple yet powerful way to manage expense reimbursements without traditional backend infrastructure.

Key goals:

Simplify claim submission

Provide transparency to users

Give admins full control and visibility

Track claim processing time (SLA)

Automate notifications

🧱 Tech Stack

Frontend: HTML, Tailwind CSS, Vanilla JavaScript

Backend: Google Apps Script (Web App)

Database: Google Sheets

File Storage: Google Drive

Authentication: Sheet-based credentials with role control

Deployment: GitHub Pages + Google Apps Script

👥 User Roles
👤 User

Submit and track personal claims

Upload receipts

View claim status and SLA

Reset password via OTP

👑 Admin

Manage all claims

Update claim status

Monitor SLA

Manage users and roles

🔐 Authentication & Security

Login using mobile number + password

Role-based access (Admin / User)

Session timeout (auto logout after inactivity)

Forgot password with OTP sent to registered email

Encoded role storage for basic client-side security

✍️ User Features
Claim Submission

Submit claims with:

Name

Email

Department/Base

Claim date

Claim type (Regular / Advance)

Amount

Description

Upload receipt (image or PDF)

Receipt stored securely in Google Drive

Auto-generated unique Claim ID

Email notification on submission

Claim Tracking

Search claims using:

Email ID

Claim ID

Paginated results

Latest claims shown first

View receipt via secure Drive link

Claim Status & SLA

Status badges with color coding:

Submitted

Pending

Declined

Reimbursed

Hover tooltip explaining each status:

Submitted → Waiting for admin review

Pending → Under verification

Declined → Rejected by admin

Reimbursed → Payment processed

SLA Tracking (User View)

Displays days pending for active claims

Color-coded SLA:

🟢 Green: < 3 days

🟠 Orange: 3–7 days

🔴 Red: > 7 days

SLA hidden once claim is closed

User Convenience Features

One-click Copy Claim ID button

Filter “My Claims” by status:

All

Submitted

Pending

Declined

Reimbursed

Pagination for large data sets

Clean and responsive UI

🛠 Admin Features
Claims Management

View all user claims

Filter claims by status

Paginated admin claims list

Sort by Claim ID

View uploaded receipts

Update claim status:

Submitted

Pending

Declined

Reimbursed

Confirmation dialog before status change

Automatic email notification on status update

SLA Monitoring (Admin View)

SLA column showing days pending

Real-time SLA calculation

Color-coded indicators for SLA breach

SLA stops when claim is closed

Helps identify delayed claims instantly

User Management

View all registered users

Paginated user list

Add new users:

Name

Mobile

Email

Password

Role (Admin/User)

Enable or disable users

Change user roles dynamically

User status indicators (Active / Disabled)

📧 Email Notifications

Automatic emails sent for:

Claim submission

Claim status updates

Admin notifications

Email recipients configurable via Google Sheet

Claimant always included in notifications

🔁 Password Recovery

Forgot password flow:

Enter registered mobile number

Receive 6-digit OTP via email

Verify OTP and set new password

OTP validation handled on backend

Password updated securely in Google Sheet

📊 Data & Storage

Claims stored in Google Sheets

Receipts stored in Google Drive

Drive links are view-only

User credentials stored in a separate secure sheet

Notification email list managed via sheet

🎨 UI & UX Highlights

Fully responsive (mobile & desktop)

Tailwind CSS-based modern design

Loading spinners for async actions

Custom alert and confirmation modals

Hover tooltips for clarity

Clean and accessible layout

⚙️ Technical Highlights

Serverless architecture (no hosting cost)

CORS-safe API communication

Base64 file upload handling

JSON-based API design

Frontend-based SLA calculation

Modular and maintainable JavaScript

📌 Use Cases

Internal expense reimbursement systems

NGO / organization claims tracking

Small–medium business finance workflows

Educational or demo project for serverless apps

🧠 One-Line Summary

A lightweight, serverless expense claims portal with user self-service, admin control, SLA tracking, and automated notifications.

📈 Future Enhancements (Optional)

Claim comments (Admin ↔ User)

Bulk approvals

Analytics dashboard

Budget limits per department

SLA escalation emails

Export claims to Excel/PDF

📄 License

This project is intended for internal or educational use.
You are free to modify and extend it as needed.