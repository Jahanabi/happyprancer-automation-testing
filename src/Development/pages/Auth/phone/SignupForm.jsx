import {BaseTextInput, CountrySelect, EmailInput, PhoneInput, PrimaryButton} from "../../../common/Inputs";
import {useState} from "react";
import {Link} from "react-router-dom";

const SignupForm = ({ handler }) => {
  const [errorText, setErrorText] = useState('')
  return (
    <form
      onSubmit={handler}
      className="grid grid-cols-2 items-center gap-x-4 gap-y-8"
    >
      <BaseTextInput
        placeholder="First Name"
        name="firstName"
        className="rounded w-full"
      />
      <BaseTextInput
        placeholder="Last Name"
        name="lastName"
        className="rounded w-full"
      />
      <EmailInput
        name="email"
        className="rounded w-full col-span-2"
      />
      <BaseTextInput
        placeholder="Referral Code (Optional)"
        name="referralCode"
        className="rounded w-full col-span-2"
        required={false}
      />

      <PrimaryButton className="col-span-2 m-auto">Send OTP</PrimaryButton>
      <p className="text-red-400 col-span-2">{errorText}</p>
      <p className="col-span-2 text-center">
        *By creating an account you agree to our
        <Link to="/signup"> Terms of use</Link> as well as
        <Link to="/signup"> Privacy Policy</Link>
      </p>
      {/*<p className='col-span-2 text-center'>Already have an account? <Link to='/signup'>Login</Link></p>*/}
    </form>
  );
}

export default SignupForm;