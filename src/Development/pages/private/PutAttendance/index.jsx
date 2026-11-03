import {useNavigate} from "react-router-dom";
import {useContext, useEffect, useState} from "react";
import { getCurrentUser } from "aws-amplify/auth";
// import { API } from "../../../Context/ContextProvider";
import InstitutionContext from "../../../Context/InstitutionContext";
import Context from "../../../Context/Context";
import {toast} from "react-toastify";
import SubmitRating from "./SubmitRating";

const PutAttendance = () => {
  const { InstitutionId } = useContext(InstitutionContext).institutionData;
  const { isAuth, userData, util, getCurrentClass, submitUserAttendance } = useContext(Context);
  const { emailId } = userData;
  const navigate = useNavigate();
  // const { classId } = useParams();

  const [instructorData, setInstructorData ] = useState({});
  const [classData, setClassData] = useState({});

  useEffect(() => {
    const putAttendance = async () => {
      try {
        await getCurrentUser();
      } catch (error) {
        window.sessionStorage.setItem('login_redirect', '/put-attendance');
        navigate('/login');
      }
      if (!isAuth) return;

      util.setLoader(true);
      let response;

      try {
        const classData = await getCurrentClass(InstitutionId);
        setClassData(classData);
        const { classId } = classData;
        response = await submitUserAttendance(InstitutionId, { classId, emailId });
        setInstructorData(response);
        // toast.success("Attendance marked successfully");
        if (response.message) toast.info(response.message);
      } catch (error) {
        const errorMsg =
          error?.response?.data?.message ||
          error?.message ||
          "An unknown error occurred";
        toast.error(errorMsg);
        util.setLoader(false);
        navigate('/dashboard');
      } finally {
        util.setLoader(false);
      }
    }

    putAttendance();
  }, [isAuth]);

  return <SubmitRating instructorData={instructorData} classData={classData} />
}

export default PutAttendance;
