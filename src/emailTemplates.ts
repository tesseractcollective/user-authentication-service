export interface EmailData {
  subject: string;
  htmlMessage: string;
}

export const passwordResetTemplate = (link: string, productName: string): EmailData => {
  const subject = `Password reset from ${productName}`;
  const htmlMessage = `<html>
<body>
<p>Dear ${productName} User,</p>

<p>We have received a request to reset the password associated with this email address in the ${productName} systems. If you need to reset your password, please click on the link below to verify:</p>
    
<a href='${link}'>${link}</a>

<p>This link will expire in 24 hours.</p>

<p>If you did not request this password reset, please do NOT click the link.</p>

<p>Sincerely,</p>

<p>The ${productName} Team.</p>
</body>
</html>`;
  return { subject, htmlMessage };
}

export const emailVerificationTemplate = (link: string, productName: string): EmailData => {
  const subject = `Please verify your email address for ${productName}`;
  const htmlMessage = `<html>
<body>
<p>Dear ${productName} User,</p>

<p>We have received a request to authorize this email address for use with our systems. If you requested this please click on the link below to verify:</p>
    
<a href='${link}'>${link}</a>

<p>This link will expire in 24 hours.</p>

<p>If you did not request this verification, please do NOT click the link.</p>

<p>Sincerely,</p>

<p>The ${productName} Team.</p>
</body>
</html>`;
  return { subject, htmlMessage };
}

export const emailAlreadyVerifiedTemplate = (productName: string): EmailData => {
  const subject = `Email confirmation for ${productName}`;
  const htmlMessage = `<html>
<body>
<p>Dear ${productName} User,</p>

<p>We have received a request to authorize this email address for use with our systems. This email is already verified with our system. At this time, no further action is required.</p>
  
<p>If you did not request this verification, please disregard this email.</p>

<p>Sincerely,</p>

<p>The ${productName} Team.</p>
</body>
</html>`;
  return { subject, htmlMessage };
}
