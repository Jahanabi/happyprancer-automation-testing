import React from "react";
import { useState } from "react";
import Footer from "../../../components/Footer";
import NavBar from "../../../components/Header";
// import { API } from "../../../Context/ContextProvider";

import { useContext } from "react";
import Context from "../../../Context/Context";
import "./index.css";
import { Button2 } from "../../../common/Inputs";
import InstitutionContext from "../../../Context/InstitutionContext";
import { toast } from "react-toastify";

export default function Query() {
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const { submitQuery } = useContext(Context);
  const UtilCtx = useContext(Context).util;
  const UserCtx = useContext(Context).userData;
  // const [name, setName] = useState("");
  // const [email, setEmail] = useState("");
  // const [phoneNumber, setPhoneNumber] = useState("");
  // const [message, setMessage] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const email = e.target.email.value;
    const phoneNumber = e.target.phoneNumber.value;
    const message = e.target.message.value;

    UtilCtx.setLoader(true);

    console.log(name, email, phoneNumber, message);

    if (!name || !email || !phoneNumber || !message) {
      UtilCtx.setLoader(false);
      return toast.error("All fields are required");
    }

    try {
      const payload = {
        fullName: name,
        emailId: email,
        phoneNumber: phoneNumber,
        message: message,
        userType: UserCtx.userType || "member",
        adminEmail: InstitutionData.Query_EmailId,
        isPaymentRedirect:
          window.location.href.split("/")[3] === "query" ? false : true,
      };

      await submitQuery(InstitutionData.institutionid, payload);

      UtilCtx.setLoader(false);
      toast.success(
        "Your message has been sent. We will get back to you as soon as possible.",
      );
      e.target.reset();
      // setName("");
      // setEmail("");
      // setPhoneNumber("");
      // setMessage("");
    } catch (e) {
      toast.error(e.message);
      UtilCtx.setLoader(false);
    }
  };

  return (
    <>
      {window.location.href.split("/")[3] === "query" && <NavBar />}
      <div className={`flex flex-col gap-16 py-10 items-center Background`}>
        <div className={`flex flex-col items-center `}>
          <h2
            className={`text-[3rem] sans-sarif max500:text-[1.6rem] text-[white]`}>
            Have Questions?
          </h2>
          <p className={`text-[white] sans-sarif`}>
            we are always here for a good cup of coffee
          </p>
        </div>
        <div className={`mb-10 w-full flex justify-center px-4 sm:px-0`}>
          <div
            className={`bg-white flex px-5 shadow-2xl gap-8 max-w-full overflow-hidden max500:w-full max500:px-4 sm:w-auto`}>
            <div
              className={`m-2 p-10 max850:hidden w-[18rem] h-[30rem] flex flex-col gap-[1rem]`}
              style={{
                backgroundColor: InstitutionData.PrimaryColor,
              }}>
              <span
                className={`font-bold sans-sarif text-[1.6rem] w-full text-white leading-7`}>
                Contact Information{" "}
              </span>
              <div className={`text-[0.9rem] sans-sarif text-white`}>
                {" "}
                Already a Customer or need help ?{" "}
              </div>
              <div className={`flex text-white text-[0.8rem] flex-col`}>
                <span
                  className={`sans-sarif font-bold text-[1.4rem] mt-[2rem]`}>
                  Contact Support
                </span>
                <span>Email - {InstitutionData.Query_EmailId}</span>
                <span>Mobile - {InstitutionData.Query_PhoneNumber}</span>
                <span>{InstitutionData.Query_Address}</span>
                <a href="happyprancer.com" className={`font-bold `}>
                  {InstitutionData.Query_WebLink}
                </a>
              </div>
            </div>
            <div
              className={`border-[#9d9d9d78] border-[1px] bg-black my-8 max850:hidden`}></div>
            <div
              className={`sans-sarif flex flex-col items-center gap-10 py-4 w-full max500:w-full`}>
              <h3 className="font-bold max500:text-center">FILL IT UP!</h3>
              <form
                onSubmit={onSubmit}
                className={`flex flex-col gap-8 items-center w-full max-w-full`}>
                <div
                  className={`w-full max-w-[25rem] flex flex-col gap-6 px-2 sm:px-0`}>
                  {/* Name and Phone Number row */}
                  <div
                    className={`grid grid-cols-2 gap-4 w-full max500:grid-cols-1`}>
                    {/* Name Input */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="name" className="font-bold">
                        Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        pattern="[A-Za-z ]+"
                        title="Name can only have characters and spaces"
                        className={`rounded-md border border-black py-[0.4rem] px-2 bg-[#d9d9d980] w-full min-w-0`}
                        required
                      />
                    </div>
                    {/* Phone Number Input */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="phoneNumber" className="font-bold">
                        Phone Number
                      </label>
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        pattern="[0-9]{9,10}"
                        title="Phone number can only be 9 or 10 numbers."
                        className={`rounded-md border border-black py-[0.4rem] px-2 bg-[#d9d9d980] w-full min-w-0`}
                        required
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="flex flex-col gap-2 w-full">
                    <label htmlFor="email" className="font-bold">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className={`rounded-md border border-black py-[0.4rem] px-2 bg-[#d9d9d980] w-full min-w-0`}
                      required
                    />
                  </div>

                  {/* Message Input */}
                  <div className="flex flex-col gap-2 w-full">
                    <label htmlFor="message" className="font-bold">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      className={`rounded-md border border-black py-[0.4rem] px-2 h-32 bg-[#d9d9d980] w-full min-w-0 resize-none`}
                      required
                    />
                  </div>
                </div>
                <Button2
                  data={"Submit"}
                  // fn={onSubmit}
                  w="8rem"
                  className="max500:mr-14"
                />
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
