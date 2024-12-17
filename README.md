# ServiceEasy
CS 546 - Group Project
<br>
Group 10 Members
1. Vijay Khot - 20021838 
2. Piyush Devendra Kataktalware - 20022156
3. Shreyas Desai - 20022834
4. Raj Kale - 20029349

### Project Description
The website is an electronic device repair/service platform service for service/repair brands that own a few stores in the city. This platform can serve as an all-in-one solution for these brands. This website will 
provide an interface to the customers to get their devices serviced as well as to the employees working at 
the stores, the store managers and the administrator to manage service requests. We have developed a comprehensive web platform for an electronic device repair company with multiple stores in the New York area. To cater to a growing customer base and enhance customer service, the platform enables customers to easily locate nearby stores, explore repair options, get instant repair quotations, and place service requests online — all from the comfort of their devices.

This all-in-one solution goes beyond customer support, empowering the repair company to efficiently manage its stores, store managers, and employees. The platform features dedicated dashboards for store managers and employees, enabling them to handle service requests from start to finish. The entire repair process is digitized and transparent, covering every step, including:
	1.	Order Placement by the customer.
	2.	Job Assignment by the store manager to an employee.
	3.	Job Completion by the employee, followed by submission for approval.
	4.	Repair Approval by the manager.
	5.	Handover of the Device to the customer.

The customer is kept informed at every stage via automated email notifications, and once the service is complete, they can provide feedback. This feedback is displayed on the store’s page, encouraging continuous improvement.

The platform also includes an Admin Dashboard, offering a bird’s-eye view of all service requests across every store. Using this powerful tool, the admin can manage stores, store managers, and employees while generating detailed sales reports for performance analysis.

To provide a seamless experience, the platform includes Stripe payment integration for secure online payments, ensuring customers can pay for services with ease.

With a focus on end-to-end service management, real-time updates, and powerful admin controls, this platform serves as a scalable, future-ready solution for electronic device repair companies looking to offer an elevated customer experience.

# How to use
Navigate to the `server.js` directory of our project folder. Once inside, run the following commands -

# Installing Dependencies
```npm i```

# Running the Project
```npm start```

# Database Seed
We are using MongoDB Atlas, a cloud-based database service, with the initial data already seeded in the database. The database connection details are specified in the config.env file. Currently, the database includes three device types: iPhone, MacBook, and iPad. Each device type contains multiple models, and each model offers various repair types, with each repair type having an associated cost and time estimate. The database currently contains 5 stores, all located in the New York area, with the flexibility to add more stores as needed.

Once the service is up and running go to  `localhost:3000/home` to take a look at our website.

## Logging in
If you want to have a walkthrough of our website feel free to signup using your real email as a customer to also test the email notifications working at various stages of repair order. Or you can also use the following customer credentials to test. The admin, store manager, and employee credentials have been listed as well.
Customer log in details:

- username : vijay111991@gmail.com
- password : test1234,

Admin Log in:
- admin.user@example.com
- password: password123

Store Manager Log in:
- manager1@example.com
- test1234
  
Employee Log in
- employeeonestoreone@email.com
- password


## 🛠️ Technical Stack & Tools Used

Our platform leverages a robust and modern tech stack to deliver a seamless experience for customers, store managers, employees, and administrators. Here’s a breakdown of the key technologies and tools used:

💻 Backend
	•	Node.js: Server-side JavaScript runtime for building a scalable, event-driven backend.
	•	Express.js: Web application framework for handling HTTP requests, routing, and middleware.

🌐 Frontend
	•	HTML5 & CSS3: Core web technologies for structuring and styling the web pages.
	•	JavaScript: Client-side logic and dynamic user interactions.
	•	Handlebars.js: A powerful templating engine for rendering dynamic content on the server side.

🗄️ Database
	•	MongoDB Atlas: Cloud-hosted NoSQL database to store and manage service requests, store information, user data, and more.
	•	Mongoose: Object Data Modeling (ODM) library for MongoDB, used to define and enforce the schema for the database.

📧 Communication
	•	SendGrid API: Used for sending transactional email notifications to customers, keeping them informed throughout the service request process.

💸 Payment Integration
	•	Stripe API: Secure and flexible payment gateway to handle customer payments directly from the platform.

🔐 Security & Data Protection
	•	bcrypt.js: Used for password hashing to securely store user passwords in the database.
	•	crypto: Used for generating secure random tokens for features like password resets and email verification.
	•	xss: Protects against Cross-Site Scripting (XSS) attacks by sanitizing input from users to prevent malicious scripts.
	•	Environment Variables: Secure sensitive information like API keys, database URIs, and secret keys using config.env.

📦 Version Control & Collaboration
	•	Git & GitHub: Version control and collaboration tools for managing source code, tracking changes, and handling team contributions.

This diverse and powerful technology stack ensures smooth, secure, and efficient handling of customer service requests while providing an intuitive user experience for employees, store managers, and administrators. The integration of security-first principles with libraries like bcrypt.js, crypto, and xss ensures that the platform is secure against data breaches, XSS attacks, and credential theft.


