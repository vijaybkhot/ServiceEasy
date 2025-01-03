# ServiceEasy  
**Effortless service management for growing repair companies**  

---

## Table of Contents  
- [Overview](#overview)
- [Walkthrough Video](#walkthrough-video)   
- [Features](#features)
- [Project Description](#project-description)    
- [Quick Start](#quick-start)  
- [Technical Stack](#technical-stack)  

---

## Overview  
**ServiceEasy** is a web platform developed with the growth of a service repair company in mind. The company, which started with one store, has expanded to multiple stores across New York. To efficiently manage its growing operations and provide seamless service to customers, the company decided to move its operations online. **ServiceEasy** serves as the ideal solution, offering a unified platform that simplifies service management while enhancing customer convenience.  

## Walkthrough Video  
Take a look at our platform in action by watching this [Walkthrough Video](https://youtu.be/QGSx0CbL9QA).  

---

## Features  
- **Customer Convenience**: Easy service requests, real-time updates, and Stripe payments.  
- **Interactive Discovery**: Find nearby stores with an interactive map.  
- **Operational Efficiency**: Dashboards for job assignments, approvals, and handovers.  
- **Admin Oversight**: Manage requests, stores, and generate reports.  
- **Automated Communication**: Email notifications at every stage.  

---
## Project Description

**ServiceEasy** is an all-in-one platform catering to a service repair company with multiple stores. This web application is designed to streamline the repair process for customers, employees, store managers, and administrators.  

We have created a comprehensive solution that allows customers to easily:  
- Locate nearby stores.  
- Explore repair options.  
- Get instant repair quotations.  
- Place service requests online.  

### **Store Listing and Detail Pages**  

The platform includes:  
- **Store Listing Page**: Customers can view all the stores on an interactive map powered by the **Leaflet** library, with store locations marked for easy discovery.  
- **Store Detail Page**: Clicking on a store marker displays additional details about the store, including available services, customer feedback, and the option to request a repair at that specific location.  

---

The platform goes beyond customer support, empowering the repair company to efficiently manage its stores, store managers, and employees. The platform features dedicated dashboards for store managers and employees, enabling them to handle service requests from start to finish. The entire repair process is digitized and transparent, covering every step, including:  
1. **Order Placement** by the customer.  
2. **Job Assignment** by the store manager to an employee.  
3. **Job Completion** by the employee, followed by submission for approval.  
4. **Repair Approval** by the manager.  
5. **Handover of the Device** to the customer.  

The customer is kept informed at every stage via automated email notifications, and once the service is complete, they can provide feedback. This feedback is displayed on the store’s page, encouraging continuous improvement.  

The platform also includes an **Admin Dashboard**, offering a bird’s-eye view of all service requests across every store. Using this powerful tool, the admin can manage stores, store managers, and employees while generating detailed sales reports for performance analysis.  

To provide a seamless experience, the platform includes **Stripe payment integration** for secure online payments, ensuring customers can pay for services with ease.  

With a focus on end-to-end service management, real-time updates, and powerful admin controls, this platform serves as a scalable, future-ready solution for electronic device repair companies looking to offer an elevated customer experience.  
---

## Quick Start  
1. Clone the repository and navigate to the project directory:  
   ```bash  
   git clone https://github.com/vijaybkhot/ServiceEasy  
   cd serviceeasy
2. Install dependencies:
   ```bash  
   npm install 
3. Start the server:
   ```bash  
   npm run 
4. Access the application at http://localhost:3000/home.

## Test Credentials:
• Customer:
Email: vijay111991@gmail.com | Password: test1234

• Store Manager:
Email: manager1@example.com | Password: test1234

• Employee:
Email: employeeonestoreone@email.com | Password: password

## Technical Stack
• Backend: Node.js, Express.js

• Frontend: Handlebars.js, JavaScript, HTML, CSS, Leaflet.js (Interactive Map)

• Database: MongoDB Atlas with Mongoose

• APIs: Stripe (Payments), SendGrid (Emails)

• Security: bcrypt.js, crypto, xss  


