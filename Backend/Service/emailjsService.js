import emailjs from '@emailjs/nodejs';
import dotenv from 'dotenv';
dotenv.config();

const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;
const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;

// // Verify environment variables are loaded
// console.log('EmailJS Config loaded:', {
//     SERVICE_ID: SERVICE_ID ? '✓ Set' : '✗ Missing',
//     TEMPLATE_ID: TEMPLATE_ID ? '✓ Set' : '✗ Missing',
//     PRIVATE_KEY: PRIVATE_KEY ? '✓ Set' : '✗ Missing',
//     PUBLIC_KEY: PUBLIC_KEY ? '✓ Set' : '✗ Missing'
// });

const sendOtpToEmailJS = async (email, otp) => {
    try {
        const templateParams = {
            to_email: email,
            otp,
            message: `Your OTP is ${otp}. This code is valid for 5 minutes.`,
        };

        const result = await emailjs.send(
            SERVICE_ID,
            TEMPLATE_ID,
            templateParams,
            {
                publicKey: PUBLIC_KEY,
                privateKey: PRIVATE_KEY
            }
        );

        console.log('EmailJS OTP sent successfully', result);
        return true;
    } catch (err) {
        console.error('EmailJS send error:', err.message || err);
        console.error('Error details:', JSON.stringify(err, null, 2));
        throw new Error(`Failed to send OTP via EmailJS: ${err.message}`);
    }
};

export default sendOtpToEmailJS;