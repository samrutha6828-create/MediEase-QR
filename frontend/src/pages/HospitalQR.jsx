import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

function HospitalQR() {
  const destinationUrl = `${window.location.protocol}//${window.location.host}/patient`;

  return (
    <div className="container">
      <h1>Hospital QR Portal</h1>
      <p className="subtitle">Point your phone's camera at the QR code below to scan.</p>
      
      <div className="qr-container" style={{ background: '#fff', padding: '30px', borderRadius: '16px', border: '4px solid #cccccc', display: 'inline-block', margin: '20px auto' }}>
        <QRCodeSVG value={destinationUrl} size={256} level="H" />
      </div>

      <div style={{ marginTop: '20px' }}>
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '5px' }}>Destination URL:</p>
        <a href={destinationUrl} style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#004488', wordBreak: 'break-all' }}>
          {destinationUrl}
        </a>
      </div>
    </div>
  );
}

export default HospitalQR;
