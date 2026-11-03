import React, { useContext, useEffect, useRef } from 'react'
// import { API } from '../../../Context/ContextProvider'
// import Razorpay from "razorpay";
import InstitutionContext from '../../../Context/InstitutionContext'
// import SubscriptionPopup from "../../pages/SubscriptionPopup";
import { useNavigate } from 'react-router-dom'
import Context from '../../../Context/Context'
import institutionData from '../../../utils/constants'

const RazorpaySubscription = ({ productId }) => {
  const InstitutionData = useContext(InstitutionContext).institutionData
  // eslint-disable-next-line
  const razorpay = useRef()
  const UtilCtx = useContext(Context).util
  const Ctx = useContext(Context)
  const { updatePayment, getUserProfile } = useContext(Context);
  const UserCtx = useContext(Context).userData


  const Navigate = useNavigate()

  useEffect(() => {
    console.log(window.razorpay)
  }, [])

  // eslint-disable-next-line
  const handleSubscribe = async () => {
    UtilCtx.setLoader(true)
    let response
    try {
      response = await updatePayment(
        `/user/billing/subscription/${InstitutionData.InstitutionId}`,
        { productId: productId }
      )
      if (response.isError) {
        alert(response.error)
        UtilCtx.setLoader(false)
        return
      }
    } catch (e) {
      console.log(e)
      UtilCtx.setLoader(false)
    }
    try {
      const options = {
        key:
          process.env.REACT_APP_STAGE === 'PROD'
            ? 'rzp_live_KBQhEinczOWwzs'
            : 'rzp_test_1nTmB013tmcWZS',
        subscription_id: response.paymentId,
        name: InstitutionData.InstitutionId.toUpperCase(),
        description: response.subscriptionType,
        image: InstitutionData.logoUrl,
        handler: function (r) {
          console.log(r)
          const verify = async () => {
            UtilCtx.setLoader(true)
            try {
              const res = await updatePayment(
                `/user/billing/subscription/verify/${InstitutionData.InstitutionId}`,
                { subscriptionId: response.paymentId }
              )
              const tempUserdata = await getUserProfile(
                InstitutionData.InstitutionId
              )
              Ctx.setUserData(tempUserdata)
              if (res.signatureIsValid) {
                Navigate('/dashboard', { state: { isReload: true } })
              } else {
                alert(
                  'Transaction Failed If your Amount was Deducted then Contact us'
                )
              }
              // alert(res);
              UtilCtx.setLoader(false)
            } catch (e) {
              console.log(e)
              UtilCtx.setLoader(false)
            }
          }
          verify()
        },
        prefill: {
          name: UserCtx.userName,
          email: UserCtx.emailId,
          contact: UserCtx.phoneNumber
        },
        theme: {
          color: InstitutionData.PrimaryColor
        }
      }
      const rzp1 = new window.Razorpay(options)
      rzp1.on('payment.failed', function (response) {
        // alert(response.error.code);
        alert(response.error.description);
        // alert(response.error.source);
        // alert(response.error.step);
        // alert(response.error.reason);
        // alert(response.error.metadata.order_id);
        // alert(response.error.metadata.payment_id);
        UtilCtx.setLoader(false)
      })
      const fields = rzp1.open()
      console.log(fields)
      UtilCtx.setLoader(false)
    } catch (e) {
      console.log(e)
      UtilCtx.setLoader(false)
    }
  }

  // const handleSubscribe = () => {
  //   Navigate("/subscribe");
  // };
  const domain =
    process.env.NODE_ENV === "development" ?
      "http://localhost:3000" :
      process.env.REACT_APP_STAGE === "DEV"
        ? institutionData.BETA_DOMAIN
        : institutionData.PROD_DOMAIN;

  return (
    <div className="z-1">
      <button
        className={`w-[15rem] text-white px-12 py-2 rounded-2xl h-[3rem] flex justify-center items-center max450:w-[60vw] cursor-pointer`}
        style={{ backgroundColor: InstitutionData.PrimaryColor }}
        onClick={() => {
          window.open(
            // `${domain}/allpayment/${institutionData.InstitutionId}/${UserCtx.cognitoId}/${UserCtx.emailId}?primary=${encodeURIComponent(InstitutionData.PrimaryColor.replace('#', ''))}&secondary=${encodeURIComponent(InstitutionData.SecondaryColor.replace('#', ''))}`,
            process.env.REACT_APP_STAGE === 'PROD' ?
              `https://payment.happyprancer.com/${institutionData.InstitutionId}/${productId}/${UserCtx.cognitoId}/${domain.split('://')[1]}` :
              `https://betapayment.happyprancer.com/${institutionData.InstitutionId}/${productId}/${UserCtx.cognitoId}/${domain.split('://')[1]}`,
            '_blank',
            'noopener,noreferrer'
          )
        }}
      >
        Subscribe
      </button>
    </div>
  )
}

export default RazorpaySubscription
