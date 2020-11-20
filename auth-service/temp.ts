import { response } from 'express';
import Sms from './src/Sms';

const sms = new Sms('Tesseract');

sms.sendSms('test', '+14175939880').then(messageId => {
  console.log(messageId);
}).catch(error => {
  console.error(error);
});