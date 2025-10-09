export const invitationEmailTemplate = (guestName,finalMessage,inviteLink) => 
`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>KlickInvite Invitation</title>
  <style>
    body {
      font-family: 'Helvetica', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      color: #333;
    }
    .header {
      background-color: #c84591;
      color: white;
      text-align: center;
      font-size: 20px;
      padding: 15px 0;
      font-weight: 500;
    }
    .content {
      text-align: center;
      padding: 30px 20px;
    }
    .content img {
      max-width: 250px;
      margin: 20px auto;
    }
    .message {
      font-size: 15px;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 20px auto;
      text-align: left;
    }
    .button {
      display: inline-block;
      padding: 10px 30px;
      background-color: #c84591;
      color: white !important;
      border-radius: 25px;
      text-decoration: none;
      font-weight: 500;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      margin-top: 40px;
    }
    .footer img {
      width: 180px;
    }
    .social-icons img {
      width: 20px;
      margin: 0 6px;
    }
  </style>
</head>
<body>

  <div class="header">
     Dear ${guestName}
  </div>

  <div class="content">
    <img src="https://res.cloudinary.com/dcgfj2uww/image/upload/v1753438705/templates/pImage-1753438702248-534239146.jpg" alt="Save the Date">
    <div class="message">
      ${finalMessage}
    </div>

    <a href="${inviteLink}" class="button" target="_blank">View Invitation</a>

    <div class="footer">
      <img src="https://res.cloudinary.com/dcgfj2uww/image/upload/v1753438705/templates/pImage-1753438702248-534239146.jpg" alt="KlickInvite Logo">
      <p style="font-size: 13px; color:#666;">DIGITAL INVITATION FOR EVERY OCCASION</p>
      <div class="social-icons">
        <a href="https://facebook.com"><img src="https://yourcdn.com/fb.png" alt="Facebook"></a>
        <a href="https://instagram.com"><img src="https://yourcdn.com/ig.png" alt="Instagram"></a>
        <a href="https://twitter.com"><img src="https://yourcdn.com/twitter.png" alt="Twitter"></a>
      </div>
    </div>
  </div>

</body>
</html>
`;
