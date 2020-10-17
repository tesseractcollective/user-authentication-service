const SOURCE_EMAIL = 'marknbroadhead@gmail.com';
const PRODUCT_NAME = 'Tesseract';

/*
 * SES params for email responding to a password reset request.
 */
export const passwordResetTemplate = (email: string, link: string) => {
    const message = `<html>
<body>
<p>Dear ${PRODUCT_NAME} User,</p>

<p>We have received a request to reset the password associated with this email address in the ${PRODUCT_NAME} systems. If you need to reset your password, please click on the link below to verify:</p>
    
<a href='${link}'>${link}</a>

<p>This link will expire in 24 hours.</p>

<p>If you did not request this password reset, please do NOT click the link.</p>

<p>Sincerely,</p>

<p>The ${PRODUCT_NAME} Team.</p>
</body>
</html>`;
    return {
      Destination: {
        ToAddresses: [
          email
        ]
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: message
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Password reset from ' + PRODUCT_NAME
        }
      },
      Source: SOURCE_EMAIL
    }
}

/*
 * SES params for email requesting verification for email ownership.
 */
export const emailVerificationTemplate = (email: string, link: string) => {
    const message = `<html>
<body>
<p>Dear ${PRODUCT_NAME} User,</p>

<p>We have received a request to authorize this email address for use with our systems. If you requested this please click on the link below to verify:</p>
    
<a href='${link}'>${link}</a>

<p>This link will expire in 24 hours.</p>

<p>If you did not request this verification, please do NOT click the link.</p>

<p>Sincerely,</p>

<p>The ${PRODUCT_NAME} Team.</p>
</body>
</html>`;
    return {
      Destination: {
        ToAddresses: [
          email
        ]
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: message
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Please verify your email address for ' + PRODUCT_NAME
        }
      },
      Source: SOURCE_EMAIL
    }
}

/*
 * SES params for email requesting verification for email ownership.
 */
export const emailAlreadyVerifiedTemplate = (email: string) => {
  const message = `<html>
<body>
<p>Dear ${PRODUCT_NAME} User,</p>

<p>We have received a request to authorize this email address for use with our systems. This email is already verified with our system. At this time, no further action is required.</p>
  
<p>If you did not request this verification, please disregard this email.</p>

<p>Sincerely,</p>

<p>The ${PRODUCT_NAME} Team.</p>
</body>
</html>`;
  return {
    Destination: {
      ToAddresses: [
        email
      ]
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: message
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: 'Email confirmation for ' + PRODUCT_NAME
      }
    },
    Source: SOURCE_EMAIL
  }
}
