import {
  CountrySelect,
  PhoneInput, PrimaryButton
} from "../../../common/Inputs";
import countries from "../../../common/Inputs/countries.json";
import { useContext } from "react";
import Context from "../../../Context/Context";
// import { API } from "../../../Context/ContextProvider";
import InstitutionContext from "../../../Context/InstitutionContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useState} from "react";

const PhoneUpdate = () => {
  const { InstitutionId } = useContext(InstitutionContext).institutionData;
  const { userData, setUserData, util, updateUserProfile } = useContext(Context);
  const navigate = useNavigate();
  const [countryCode, setCountryCode] = useState("IN");

  const handler = async (event) => {
    event.preventDefault();

    const selectedCode = event.target.country.value;
    const countryEntry = countries.find(
      (c) => c.countryCode === selectedCode || c.value === String(selectedCode)
    );
    const countryName = countryEntry ? countryEntry.name.split(' (')[0] : selectedCode;
    const dialCode = countryEntry ? countryEntry.value : selectedCode;
    const phoneNumber = `+${dialCode}${event.target.phone.value}`;

    util.setLoader(true);
    try {
      const updatedData = await updateUserProfile(InstitutionId, { ...userData, phoneNumber, country: countryName });

      setUserData(updatedData.Attributes);
      navigate('/dashboard');
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      util.setLoader(false);
    }
  }

  return (
    <div className='p-8 pt-16 flex flex-col items-center gap-2'>
      <h1 className='font-bold text-2xl'>Add Phone Number</h1>
      <p>It seems we couldn't find your phone number. Please add it to continue using our services.</p>
      <form
        onSubmit={handler}
        className={
          `flex flex-col items-center gap-6
          w-80 pt-8`
        }
      >
        <CountrySelect
          name='country'
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className='rounded w-full'
        />
        <PhoneInput name='phone' countryCode={countryCode} className='rounded w-full' />
        <PrimaryButton>Continue</PrimaryButton>
      </form>
    </div>
  )
}

export default PhoneUpdate;