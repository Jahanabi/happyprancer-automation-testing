import React, { useContext, useState } from 'react';
import NavBar from '../../../components/Header';
import dancebg from '../../../utils/images/dancebg.jpg';
import { signIn, confirmSignIn, fetchAuthSession } from "aws-amplify/auth";
// import { API } from "../../../Context/ContextProvider";
import Context from '../../../Context/Context';
import { useNavigate } from 'react-router-dom';
import Country from '../../../components_old/Country';
import InstitutionContext from '../../../Context/InstitutionContext'
import { toast } from 'react-toastify'

function Attendance() {
  const InstitutionData = useContext(InstitutionContext).institutionData
  const UtilCtx = useContext(Context).util;
  const [countryCode, setCountryCode] = useState('91')
  const [phoneNumber, setPhoneNumber] = useState('');
  const [OTP, setOTP] = useState('');
  const [err, setErr] = useState('');
  const Navigate = useNavigate()
  const UserCtx = useContext(Context)
  const { getUserProfile, markAttendanceUser } = useContext(Context);
  console.log(UserCtx.userData)
  const institution = UserCtx.userData.institution;
  const [signinResponse, setSigninResponse] = useState(null);


  const sendOTP = async (event) => {
    event.preventDefault()
    UtilCtx.setLoader(true)

    try {
      const response = await signIn({
        username: `+${countryCode}${phoneNumber}`
      })
      setSigninResponse(response)
      console.log(response)
    } catch (e) {
      setErr(e.message)
    } finally {
      UtilCtx.setLoader(false)
    }
  }

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    try {
      await markAttendanceUser(institution);

    } catch(e) {
      console.log(e)
    }
  }

  const onSubmit = async (event) => {
    event.preventDefault()

    UtilCtx.setLoader(true)

    try {
      console.log(signinResponse)
      console.log(OTP)

      const { isSignedIn, nextStep } = await confirmSignIn({ challengeResponse: OTP });

      console.log(await fetchAuthSession())

      console.log(`+${countryCode}${phoneNumber}`)

      if (isSignedIn) {
        const userdata = await getUserProfile(InstitutionData.InstitutionId);
        UserCtx.setUserData(userdata)
        UserCtx.setIsAuth(true)
        UtilCtx.setLoader(false)
        toast.info('Logged In')
        // UserCtx.onAuthLoad(true, InstitutionData.InstitutionId)
      } else {
        setErr(
           "Incorrect Id or OTP"
        )
        UtilCtx.setLoader(false)
      }
    } catch (e) {
      if (e.toString().split(' code ')[1]?.trim() === '404') {
        toast.warn('You Must Sign Up First and use the same email and password')
        Navigate('/signup?newuser=false')
        setErr('')
      } else {
        setErr(e.message)
      }
      UtilCtx.setLoader(false)
    }
  }

  if (UserCtx.isAuth) {
    // Return content for authenticated user
    return (
      <div>
        <div>
          <div className='w-full h-screen overflow-hidden flex justify-center'>
            <NavBar />
            <div className='w-full h-screen overflow-hidden flex justify-center items-center'>
              <img className='absolute inset-0 w-full h-full object-cover' src={dancebg} alt="" />
              <div className='absolute inset-0' style={{ backdropFilter: 'blur(5px)' }}></div>
              <div className="flex flex-col w-[90vw] h-[80vh] justify-start">
                <p className='text-white K2D p-4 text-center text-[1.7rem] z-50'>"Let's keep the rhythm going! Mark Your Attendance 🙋‍♂️"</p>
                <button
                  className="w-full py-2 rounded-md bg-[#005B50] text-white z-50"
                  type="submit"
                  onClick={handleMarkAttendance}
                >
                  Mark Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <div className='w-full h-screen overflow-hidden flex justify-center'>
          <NavBar />
          <div className='w-full h-screen overflow-hidden flex justify-center items-center'>
            <img className='absolute inset-0 w-full h-full object-cover' src={dancebg} alt="" />
            <div className='absolute inset-0' style={{ backdropFilter: 'blur(5px)' }}></div>
            <div className="flex flex-col h-screen gap-[5rem] justify-end z-50">
              <p className='text-white K2D p-4 text-center text-[1.7rem]'>"Dance is the hidden language of the soul.  Let's begin our journey together."✨💃🕺 </p>
              <div className='w-full h-[400px] bg-[#1ac1a291] rounded-t-[29px]' style={{ backdropFilter: 'blur(4px)' }}>
                <form className="flex flex-col items-center p-8" onSubmit={onSubmit}>
                  <select
                    name="countryCode"
                    id=""
                    value={countryCode}
                    className={`w-full bg-[#00000000] text-[1.09rem] font-[500] mb-4 border-b border-[#CDD1D0] px-[1.5rem] py-2 `}
                    onChange={(e) => {
                      setCountryCode(e.target.value.toString())
                    }}
                  >
                    {<Country />}
                  </select>
                  <input
                    className="w-full text-[#202020] text-[1.09rem] font-[500] px-4 py-2 mb-4 border-b border-[#CDD1D0] bg-[#00000000] placeholder-black"
                    type="text"
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <input
                    className="w-full text-[1.09rem] font-[500] text-black px-4 py-2 mb-4 border-b border-[#CDD1D0] bg-[#00000000] placeholder-black"
                    type="text"
                    placeholder="OTP"
                    value={OTP}
                    onChange={(e) => setOTP(e.target.value)}
                    disabled={!signinResponse}
                  />
                  {err && <p className="text-red-500">{err}</p>}
                  <button
                    className="w-full py-2 mb-3 rounded-md bg-[#005B50] text-white"
                    onClick={sendOTP}
                    disabled={!phoneNumber}
                  >
                    {signinResponse ? 'Resend OTP' : 'Send OTP'}
                  </button>
                  <button
                    className="w-full py-2 rounded-md bg-[#005B50] text-white"
                    type="submit"
                    disabled={!OTP}
                  >
                    Sign in
                  </button>
                  <p
                    className={` text-[0.85rem] mt-2 text-black cursor-pointer`}
                    onClick={() => {
                      Navigate('/signup')
                    }}
                  >
                    Don’t have an account?{' '}
                    <span
                      className={`font-[500]`}
                    >
                      Register Now
                    </span>{' '}
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default Attendance;
