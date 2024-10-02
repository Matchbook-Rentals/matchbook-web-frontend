
import React from 'react';

interface JoinTripEmailProps {
  tripLink: string;
}

const JoinTripEmailTemplate: React.FC<JoinTripEmailProps> = ({ tripLink }) => {
  const imgUrl = `${process.env.NEXT_PUBLIC_URL}/logo-nav-new.png`;
  return (
    <html>
      <head>
        <style>{`
          body { font-family: Arial, sans-serif; }
          .header { background-color: #f0f0f0; padding: 20px; text-align: center; }
          .content { padding: 20px; }
        `}</style>
      </head>
      <body>
        <div className="header">
          <img src={imgUrl} alt="Matchbook Logo" style={{ maxWidth: '200px' }} />
          <h1>Matchbook</h1>
        </div>
        <div className="content">
          <p>Hello,</p>
          <p>You have been invited to join a trip. Please click the link below to view and accept your invitation:</p>
          <p><a href={tripLink}>{tripLink}</a></p>
          <p>Best regards,<br />Your Travel Team</p>
          <p>{imgUrl}</p>
        </div>
      </body>
    </html>
  );
};

export default JoinTripEmailTemplate;
