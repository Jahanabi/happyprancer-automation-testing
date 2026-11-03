import Header from "../../../components/Header";
import {useContext, useState} from "react";
import LoginForm from "./LoginForm";
import OtpForm from "./OtpForm";
import SignupForm from "./SignupForm";
import institutionContext from "../../../Context/InstitutionContext";
import Context from "../../../Context/Context";
// import { API } from "../../../Context/ContextProvider";
import { signIn, confirmSignIn, signUp, getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import {toast} from "react-toastify";
import {redirect, useNavigate, useParams} from "react-router-dom";
import countries from "../../../common/Inputs/countries.json";

const AuthPage = () => {
  const { InstitutionId } = useContext(institutionContext).institutionData;
  const { util, setUserData, setIsAuth, onAuthLoad, phoneExist, signupUser } = useContext(Context);
  const { setLoader } = util;
  const { "*": link } = useParams();

  const navigate = useNavigate();

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referralCode, setReferralCode] = useState("");
  const [country, setCountry] = useState("");
  // const [signInResponse, setSignInResponse] = useState();
  const [formState, setFormState] = useState('login')


  const handleLogin = async (event) => {
    event.preventDefault();
    setLoader(true);
    const phoneNumber = `+${event.target.country.value}${event.target.phone.value}`;

    for (let country of countries) {
      if (country.value === event.target.country.value) {
        console.log(country.name);
        setCountry(country.name.split(' (')[0]);
        break;
      }
    }

    try {
      const { nextStep } = await signIn({ username: phoneNumber });
      if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE') {
        setFormState('otp');
      }
    } catch {
      setFormState('signup');
    } finally {
      setPhoneNumber(phoneNumber);
      setLoader(false);
    }
  }


  const otpHandler = async (event) => {
    event.preventDefault();
    setLoader(true);
    const otp = event.target.otp.value;

    try {
      await confirmSignIn({ challengeResponse: otp });
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      console.log(user);

      const exist = await phoneExist(InstitutionId, {
        phoneNumber,
      });

      if (exist.exists === false) {
        await signupUser(InstitutionId, {
          emailId: attributes.email,
          userName: attributes.name,
          phoneNumber: attributes.phone_number,
          country: country,
          referred_code: referralCode
        });
      }

      navigate('/redirect')

    } catch (error) {
      if (error === 'The user is not authenticated')
        toast.error('Incorrect OTP. Try again');
      else if (error.name === 'NotAuthorizedException')
        toast.error('OTP expired. Use resend OTP');
      else if (error.response?.status === 404)
        toast.error('User data not found. Delete old data');

      console.log(error);
    } finally {
      setLoader(false);
    }
  }

  const handleSignUp = async (event) => {
    event.preventDefault();
    setLoader(true);
    const name = event.target.firstName.value + event.target.lastName.value;
    const email = event.target.email.value;
    setReferralCode(event.target.referralCode.value);

    try {
      await signUp({
        username: phoneNumber,
        password: "Password@123",
        options: {
          userAttributes: {
            phone_number: phoneNumber,
            name: name,
            email: email,
          }
        }
      });

      const { nextStep } = await signIn({ username: phoneNumber });
      if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE') {
          setFormState('otp');
      }
    } catch {
      toast.error('Unknown error occurred');
    } finally {
      setLoader(false);
    }
  }


  return (
    <div>
      <Header />
      <div className='flex flex-col items-center mt-10'>
        <div
          className={
            `flex flex-col items-center gap-4
            shadow-xl px-20 py-12 w-[480px] rounded-xl`
          }
        >
          <h2 className='font-bold text-2xl'>Auth</h2>
          <p className='text-center w-64'>{
            formState === 'login' ? 'Please enter your Phone Number for verification.' :
            formState === 'signup' ? 'Please enter your data to create your account' :
            'Please enter the otp to finish your login process'
          }</p>
          {
            formState === 'login' ?
              <LoginForm handler={handleLogin} /> :
            formState === 'signup' ?
              <SignupForm handler={handleSignUp} /> :
            <OtpForm handler={otpHandler} phoneNumber={phoneNumber} />
          }
        </div>
      </div>
    </div>
  )
}

export default AuthPage;