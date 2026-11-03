import QRCode from 'qrcode';
import {useEffect, useState} from "react";

const QR = () => {
  const [QRSrc, setQRSrc] = useState('');

  // const url = new URL(window.location.href);
  const url = window.location.href.split('/a')[0] + '/put-attendance';
  console.log(url);
  QRCode.toDataURL(url).then((data) => {
    console.log(data);
    setQRSrc(data);
  });

  return (
    <img src={QRSrc} alt="QR Code" />
  )
}

export default QR;