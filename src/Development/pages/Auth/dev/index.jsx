import { useContext, useState } from "react";
import { Select } from "flowbite-react";
import { PrimaryButton } from "../../../common/Inputs";
import { signIn } from "aws-amplify/auth";
import { toast } from "react-toastify";
import Context from "../../../Context/Context";
import institutionContext from "../../../Context/InstitutionContext";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";

const DevAuth = () => {
  const options = [
    { userType: "admin", email: "admin@tester.com" },
    { userType: "instructor", email: "instructor@tester.com" },
    { userType: "user", email: "user@tester.com" },
  ];

  const { util } = useContext(Context);
  const { InstitutionId } =
    useContext(institutionContext).institutionData || {};
  const [email, setEmail] = useState(options[0].email);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    util.setLoader(true);
    try {
      await signIn({ username: email, password: "Password@123" });
      util.setLoader(false);
      navigate("/redirect");
    } catch (e) {
      console.log(e);
      toast.error("Unknown error occurred");
    } finally {
      util.setLoader(false);
    }
  };

  return (
    <div>
      <Header />
      <div className="w-80 mt-8 mx-auto flex flex-col gap-4">
        <p>Login as: </p>
        <Select value={email} onChange={(e) => setEmail(e.target.value)}>
          {options.map((option, index) => (
            <option key={index} value={option.email}>
              {option.userType}
            </option>
          ))}
        </Select>
        <PrimaryButton onClick={handleLogin}> Login </PrimaryButton>
      </div>
    </div>
  );
};

export default DevAuth;
