# LearnLanka — Requirements Document
## 1. Problem Statement
- One paragraph describing the user problem in your own words
The brief does not state what subjects, what languages, what currency the prices should be displayed in, how to make the booking, how to make the payment, payment is made by whom into what sort of an account and in what currency, whether the tutor can rate the student as well, how fast in numbers, security complied with what?

## 2. Personas
- Three personas (Student, Tutor, Operations Admin) with goals and frustrations

Student
Goals
1. Find a tutor tailored to your desired language, subject and price range easily.
2. Book a session with a tutor.
3. Be able to rate tutor and leave a comment.	
4. Make payment successfully.
5. Naviagate through the application easily.	

Frustrations
1. Being unable to find a tutor tailored to students requirements.
2. Tutor may not have any availability slots remaining.
3. Tutors may decline booking.

Tutor
Goals	
1. Connect with a student easily.	
2. Be able to publish availability slots.	
3. Be able to accept, decline or cancel bookings (with atleast 12 hour notice).	
4. Rate students and leave comments.
5. Be able to receive session payments weekly.	

Frustrations
1. Might be difficult to be a fit based on the requirements of students.
2. May not get payments if the external payment gateway is down.

Operations Admin
Goals
1. Makesure the interface is simple, easy to use and navigate.
2. Charge a 15% commission on every completed session.
3. Pay tutors weekly via bank transfer

Frustrations
1. Dealing with payments if the external payment gateway is down.
2. Handling simultaneous users booking the same tutor.
3. Making sure web application is up and running even if network traffic is present.

## 3. Functional Requirements
- Numbered list, grouped by persona, each requirement testable
Student
1.	Search for tutors by subject, grade, language (Sinhala, Tamil, English) and price band.
2.	Book a 1-hour session with a tutor and pay via card or eZ Cash.
3.	Rate Tutor(1-5 stars)  and leave a one line comment after the session. 

Tutor
1.	Publish availability slots, accept or decline bookings and cancel with at least 12 hours notice.
2.	Rate student (1-5 stars) and leave a one-line comment after the session.

Operations Admin
1.	Charge a 15% commission on every completed session and pay tutors weekly via bank transfer

## 4. Non-Functional Requirements
- Table with columns: Category, Metric, Target, How we'll measure it
Category	Metric	Target	How we'll measure it
Tutor search results	Speed	returned in under 800 ms at the 95th percentile.	from a Sri Lankan ISP

Availability	Uptime	99.5% monthly uptime.	against the booking endpoint
Concurrent sessions	Efficiency	support 200 simultaneous video sessions 	Track efficiency within the first 6 months
Privacy	Privacy and confidentiality	comply with Sri Lanka Personal Data Protection Act 2022 	consent capture, deletion request flow

Payment data	Payment gateway	never stored on LearnLanka servers.
	Use a PCI-DSS compliant gateway

## 5. Assumptions
- Numbered list of every assumption you made because the brief was silent.
1.	Students can search tutors by the languages Sinhala, Tamil and English.
2.	Students can search tutors by prices in LKR.
3.	Students are offered all the standard O/L subjects and A/L subjects.
4.	Payments are made in LKR to tutor.
5. Tutors are payed via bank transfer.
6.	An external payment gateway was used to handle all payment related tasks.
7.	SMS was used externally to send OTPs and notify user regarding payment details.

## 6. Out of Scope
- What you are explicitly NOT building in this version
1.	User interface design
2.	Booking System
3.	User login systems and profiles
4.	Connecting external systems such as Payment gateway and SMS to system
Evaluation Criteria: - Each functional requirement is testable and free of solution bias (5 pts) - Non-functional requirements have measurable targets (no "fast", "secure", "user-friendly" without numbers) (5 pts) - Personas are distinct and have specific goals, not generic descriptions (5 pts) - Assumptions section captures at least 6 silent gaps in the brief (5 pts) - Out-of-scope section names at least 4 things that could be in scope but are not (5 pts)
