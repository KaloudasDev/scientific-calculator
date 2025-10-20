# Security Policy

## Supported Versions

Currently, all versions of the Scientific Calculator are being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of our Scientific Calculator seriously. If you believe you've found a security vulnerability, please follow these steps:

### How to Report
1. **Do NOT create a public issue** for security vulnerabilities
2. Email security reports to: [kaloudasdev@gmail.com]
3. Include detailed information about the vulnerability
4. Provide steps to reproduce if possible

### What to Include
- Description of the vulnerability
- Potential impact
- Steps to reproduce
- Suggested fix (if any)
- Your contact information

### Response Timeline
- **Initial Response**: Within 48 hours
- **Assessment**: Within 5 business days
- **Fix Development**: Dependent on complexity
- **Public Disclosure**: After fix is deployed

### Scope
This security policy covers:
- Client-side JavaScript code
- Input validation mechanisms
- Data sanitization processes
- Cross-site scripting (XSS) prevention
- Mathematical operation safety

### Out of Scope
- Styling/CSS issues
- Feature requests
- General bug reports (use Issues tab instead)

## Security Measures

Our calculator implements several security features:

### Input Sanitization
- All user inputs are validated and sanitized
- Mathematical expressions are safely evaluated
- No external API calls or data transmission

### Client-Side Security
- No sensitive data storage
- All operations occur locally in browser
- No external dependencies

### Safe Evaluation
- Custom expression parser for mathematical operations
- Domain validation for all mathematical functions
- Error boundary implementation

## Updates and Patches

Security updates will be:
- Released as soon as possible
- Clearly documented in release notes
- Backported to supported versions

## Acknowledgments

We thank the security researchers and users who help us keep the Scientific Calculator secure.
