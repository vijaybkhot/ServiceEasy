# ServiceEasy

**Effortless service management for growing repair companies**

---

## Table of Contents

- [Overview](#overview)
- [Walkthrough Video](#walkthrough-video)
- [Features](#features)
- [Project Description](#project-description)
- [Quick Start and How to use](#quick-start)
- [Test Credentials](#test-credentials)
- [Service Request Workflow](#service-request-workflow)
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

## With a focus on end-to-end service management, real-time updates, and powerful admin controls, this platform serves as a scalable, future-ready solution for electronic device repair companies looking to offer an elevated customer experience.

---

## Quick Start

## Access the Application  

The **ServiceEasy** platform is deployed and available online. You can access it directly at:  
**[https://serviceeasy.onrender.com](https://serviceeasy.onrender.com)**  

## How to Use  

1. **Sign Up or Log In**:  
   - You can sign up as a customer to explore the platform, or you can use the test credentials provided below to log in as a customer, store manager, or employee.  

2. **Placing a Service Request**:  
   - While placing the order, **select "ServiceEasy Store One"** as the store to place the order.  

3. **Test the Repair Order Workflow**:  
   - Use the credentials provided below to test the complete repair order cycle for **"ServiceEasy Store One"**.  

---

## Test Credentials  

### Customer:  
- **Email**: vijay111991@gmail.com  
- **Password**: test1234  

### Store Manager for **ServiceEasy Store One**:  
- **Email**: manager1@example.com  
- **Password**: test1234  

### Employee for **ServiceEasy Store One**:  
- **Email**: EmployeeTenStoreOne@email.com  
- **Password**: password  

---

## Service Request Workflow  

1. **Customer Action**:  
   - Log in as the customer.  
   - Place a service request for **"ServiceEasy Store One"**.  

2. **Store Manager Action (ServiceEasy Store One)**:  
   - Log in as the store manager using the provided credentials.  
   - Locate the order using the customer’s order ID and assign it to the employee for **"ServiceEasy Store One"**.  

3. **Employee Action (ServiceEasy Store One)**:  
   - Log in as the employee using the provided credentials.  
   - Complete the repair work and submit it for approval.  

4. **Manager Approval and Customer Notification**:  
   - Log in as the store manager.  
   - Approve the repair work and mark the order as ready for pickup.  
   - The customer will receive a notification that their device is ready for pickup.  

5. **Completion and Feedback**:  
   - The customer picks up the device, and the manager marks the order as complete.  
   - The customer can then log in and leave feedback on the service.
  
---

## Technical Stack

• Backend: Node.js, Express.js

• Frontend: Handlebars.js, JavaScript, HTML, CSS, Leaflet.js (Interactive Map)

• Database: MongoDB Atlas with Mongoose

• APIs: Stripe (Payments), SendGrid (Emails)

• Security: bcrypt.js, crypto, xss
