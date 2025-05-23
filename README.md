![image](https://github.com/user-attachments/assets/578fa111-4d2e-4514-a78b-73e3d0b1c31c)Cloud Computing Project Deliverables

1. Documentation
1.1 Architecture Diagram
The architecture diagram visually illustrates the interactions between the AWS services used in the Task Management System.
![image](https://github.com/user-attachments/assets/79753566-508e-40d6-b54c-a95bfde11ab6)



Description:
Amazon Cognito: Handles user sign-up, sign-in, and authentication.


API Gateway: Exposes RESTful endpoints for task CRUD operations.


AWS Lambda: Implements backend logic triggered by API calls and processes asynchronous notifications.


Amazon RDS: Stores relational data like user profiles and task relationships.


Amazon DynamoDB: Stores non-relational task metadata for quick retrieval.


Amazon S3: Stores user-uploaded files and task attachments.


Amazon SQS: Queues notification messages to be processed asynchronously.


Amazon EC2: Hosts the web frontend application.


Amazon CloudWatch: Monitors logs, metrics, and triggers alarms for system health.




2. Setup Guide: Step-by-Step Deployment Instructions

2.1 Prerequisites
Active AWS account with appropriate permissions.


AWS CLI installed


Source code of frontend and backend applications.




2.2 AWS Service Setup
Amazon Cognito: Create User Pool and App Client for user authentication.


Amazon RDS: Launch MySQL instance for relational data storage.


DynamoDB: Create table for task metadata.


Amazon S3: Create bucket for file attachments with proper access policies.


Amazon SQS: Create queue for handling notifications asynchronously.


AWS Lambda: Deploy functions for task operations, file uploads, and notification processing.


API Gateway: Define REST API endpoints and integrate with Lambda functions.


EC2 Instance: Launch instance, install necessary runtime, and deploy frontend application.


CloudWatch: Configure logs, monitoring dashboards, and alarms.



2.3 Integration & Configuration
Configure frontend with Cognito User Pool and API Gateway endpoints.


Connect Lambda functions with RDS, DynamoDB, S3, and SQS using IAM roles.


Test API endpoints using Postman.


Secure EC2 instance with proper security groups and environment variables.



2.4 Testing
Verify user authentication flows (sign-up, sign-in).


Test task creation, update, deletion functionalities.


Upload and retrieve files from S3.


Confirm email or notification delivery through SQS and Lambda.


Monitor logs and metrics via CloudWatch.







3. User Manual: How to Use the Task Management System

3.1 User Authentication
Sign Up: Create an account by providing email, username, and password.


Log In: Enter credentials (username, password), if correct then you will be navigated to the dashboard.
3.2 Task Operations
Create Task: Click “create task” button to fill in details: Task name, description, optional field to attach file and due date.


View Tasks: Browse the list of tasks on your dashboard.


Update Task: Select a task, click “ expand task,” modify details or attachments, then save using the “ save,” button.
Delete Task: Select task and click on the edit symbol  “ expand task,” the delete.


3.3 Notifications
Receive email notifications when deadline is approaching 


Check registered email inbox regularly.


3.4 Logout
Click “Sign out” button at the top right to securely exit the system.




