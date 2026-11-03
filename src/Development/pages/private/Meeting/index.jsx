import React, { useEffect, Fragment, useContext } from 'react'
import Context from '../../../Context/Context'
import { useLocation } from 'react-router-dom'

const Meeting = () => {
  const UserCtx = useContext(Context)

  const location = useLocation()

const queryParams = new URLSearchParams(location.search);


const instructorId = queryParams.get('instructorId');
const meetingNumber = queryParams.get('meetingNumber');
const password = queryParams.get('password');
const classId = queryParams.get('classId');

  const payload = {
    meetingNumber: meetingNumber,
    // role: UserCtx.userData.userType === "member" ? 0 : 1,
    role: 0,
    sdkKey: process.env.REACT_APP_ZOOM_SDK_KEY,
    sdkSecret: process.env.REACT_APP_ZOOM_SDK_SECRET,
    passWord: password,
    userName: UserCtx.userData.userName,
    // userName:"test",
    userEmail: '',
    leaveUrl: `/rating?instructorId=${instructorId}${classId ? `&classId=${classId}` : ''}`
  }
 // https://us06web.zoom.us/j/83120164288?pwd=UbmScpkfP1labSt2NZxanrm0wrdU6b.1
  // 563618
  // https://us06web.zoom.us/j/84052110696
  useEffect(() => {
    const initializeMeeting = async () => {
      try {
        const { ZoomMtg } = await import('@zoomus/websdk')

        ZoomMtg.setZoomJSLib('https://source.zoom.us/2.17.0/lib', '/av')
        ZoomMtg.preLoadWasm()
        ZoomMtg.prepareWebSDK()
        // loads language files, also passes any error messages to the ui
        // ZoomMtg.i18n.load('en-US');
        // ZoomMtg.i18n.reload('en-US');
        ZoomMtg.generateSDKSignature({
          meetingNumber: payload.meetingNumber,
          role: payload.role,
          sdkKey: payload.sdkKey,
          sdkSecret: payload.sdkSecret,
          success: function (signature) {
            ZoomMtg.init({
              leaveUrl: payload.leaveUrl,
              success: function (data) {
                ZoomMtg.join({
                  meetingNumber: payload.meetingNumber,
                  signature: signature.result,
                  sdkKey: payload.sdkKey,
                  userName: payload.userName,
                  userEmail: payload.userEmail,
                  passWord: payload.passWord,
                  tk: '',
                  success: function () {},
                  error: function (joinError) {
                    console.error('Error joining meeting:', joinError)
                  }
                })
              },
              error: function (initError) {
                console.error('Error initializing Zoom:', initError)
              }
            })
          },
          error: function (signError) {
            console.error('Error generating SDK signature:', signError)
          }
        })
      } catch (error) {
        console.error('Error while initializing Zoom:', error)
      }
    }

    initializeMeeting()
  }, [
    payload.meetingNumber,
    payload.role,
    payload.sdkKey,
    payload.sdkSecret,
    payload.passWord,
    payload.userName,
    payload.userEmail,
    payload.leaveUrl
  ])

  return (
    <Fragment>
      <link
        type="text/css"
        rel="stylesheet"
        href="https://source.zoom.us/2.17.0/css/bootstrap.css"
      />
      <link
        type="text/css"
        rel="stylesheet"
        href="https://source.zoom.us/2.17.0/css/react-select.css"
      />
    </Fragment>
  )
}

export default Meeting
