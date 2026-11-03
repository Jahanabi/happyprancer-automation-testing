import React, { useContext, useEffect, useState, useCallback } from "react";
// import { API } from "../../../../Context/ContextProvider";
import "./userprofile.css";
import Context from "../../../../Context/Context";
import { useNavigate } from "react-router-dom";
import { Button2 } from "../../../../common/Inputs";
import InstitutionContext from "../../../../Context/InstitutionContext";
import { toast } from "react-toastify";
import { FaEnvelope, FaUserEdit } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { getMemberGracePeriodInfo } from "../../../../utils/gracePeriod.js";

const UserProfile = ({ isOpen, onClose, user }) => {
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState("");
  const [productDetails, setProductDetails] = useState([]);
  const [productType, setProductType] = useState("");
  const [balance, setBalance] = useState("");
  // const [country, setCountry] = useState(user?.country || '');
  const UtilCtx = useContext(Context).util;
  const Ctx = useContext(Context);
  const { getProductsAny, updateUserAdmin, updateUserPaymentAdmin, sendEmail } =
    useContext(Context);
  const [cognitoId, setCognitoId] = useState("");
  const navigate = useNavigate();
  const [lastMonthZPoints, setLastMonthZPoints] = useState("");
  const [currentMonthZPoints, setCurrentMonthZPoints] = useState("");
  const [selectedProductAmount, setSelectedProductAmount] = useState("");
  const [pdate, setPDate] = useState("");
  // const [pstatus, setPStatus] = useState('');

  const formatDate = (epochDate) => {
    const date = new Date(epochDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    if (user) {
      setName(user.userName || "");
      setEmail(user.emailId || "");
      setPhoneNumber(user.phoneNumber || "");
      setStatus(user.status || "");
      setProductType(user.productType || "");
      setBalance(user.balance || "");
      setCognitoId(user.cognitoId || "");
      // setCountry(user.country || '');
      setLastMonthZPoints(user.lastMonthZPoints || "0");
      setCurrentMonthZPoints(user.currentMonthZPoints || "0");
    }
  }, [user]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productList = await getProductsAny(InstitutionData.InstitutionId);
        setProductDetails(productList);
      } catch (error) {
        console.error("Error fetching product details:", error);
        UtilCtx.setLoader(false);
      }
    };

    fetchProducts();
  }, [InstitutionData.InstitutionId, UtilCtx]);

  const handleProductTypeChange = useCallback(
    (e) => {
      const selectedProductType = e.target.value;
      setProductType(selectedProductType);
      const selectedProduct = productDetails.find(
        (product) => product.heading === selectedProductType,
      );
      if (selectedProduct) {
        const visbleAmount = selectedProduct.amount / 100;
        setSelectedProductAmount(visbleAmount);
      } else {
        setSelectedProductAmount("");
      }
    },
    [productDetails],
  );

  const onUpdateUser = async (e) => {
    e.preventDefault();

    if (
      !name ||
      !email ||
      !phoneNumber ||
      !status ||
      !balance /*|| !country */ ||
      !cognitoId
    ) {
      toast.warn("Please fill all fields");
      return;
      // } else if (phoneNumber.length !== 10 || isNaN(phoneNumber)) {
      //   toast.warn('Please enter valid Phone Number')
      //   return
    } else if (isNaN(balance)) {
      toast.warn("Please enter valid due");
      return;
    } else if (!email.includes("@")) {
      toast.warn("Please enter valid email");
      return;
    } else if (Number(currentMonthZPoints) > Number(lastMonthZPoints)) {
      toast.warn("Please enter valid attendance");
      return;
    }

    const newBalance = parseFloat(balance) + parseFloat(selectedProductAmount);
    setBalance(newBalance.toString());
    console.log(balance);

    UtilCtx.setLoader(true);

    try {
      await updateUserAdmin(InstitutionData.InstitutionId, {
        cognitoId,
        emailId: email,
        userName: name,
        phoneNumber,
        status,
        productType,
        balance: newBalance.toString(),
        // country,
        currentMonthZPoints,
        lastMonthZPoints,
        amount: selectedProductAmount,
      });
      await updateUserPaymentAdmin(InstitutionData.InstitutionId, {
        cognitoId,
        status,
        institution: InstitutionData.InstitutionId,
        productType,
        amount: selectedProductAmount,
        // paymentStatus: pstatus,
        paymentDate: pdate,
        emailId: email,
      });
      alert("User Updated");

      const updatedUserList = Ctx.userList.map((item) => {
        if (item.cognitoId === cognitoId) {
          return {
            ...item,
            emailId: email,
            userName: name,
            phoneNumber,
            status,
            productType,
            balance: newBalance.toString(),
            currentMonthZPoints,
            lastMonthZPoints,
            // country
          };
        } else {
          return item;
        }
      });

      Ctx.setUserList(updatedUserList);
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      onClose();
      UtilCtx.setLoader(false);
    }
  };

  useEffect(() => {
    if (Ctx.isUserDataLoaded && Ctx.userData.userType !== "admin") {
      navigate("/");
    }
  }, [Ctx, navigate]);

  const getWhatsappUrl = () => {
    const currentMonth = new Date().toLocaleString("default", {
      month: "long",
    });
    const message = `Payment screenshot for ${currentMonth}`;

    const whatsappUrl = `https://wa.me/${
      InstitutionData.WpNo
    }?text=${encodeURIComponent(message)}`;
    return whatsappUrl;
  };

  const sendReminder = async (cognitoId) => {
    UtilCtx.setLoader(true);

    const pa = InstitutionData.UpiId;

    try {
      const res = await sendEmail(InstitutionData.InstitutionId, {
        pa,
        paymentPhoneNumber: InstitutionData.WpNo,
        whatsappUrl: getWhatsappUrl(),
        qrLink: `https://institution-qr-code.s3.amazonaws.com/${InstitutionData.InstitutionId}/QRCode.jpg`,
        cognitoId,
      });

      alert(res.message);
      UtilCtx.setLoader(false);
    } catch (e) {
      console.log(e);
      UtilCtx.setLoader(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal`}>
      <div
        className={`modal-content flex items-center justify-center mt-[10rem]`}>
        <div className={``}>
          <div
            className={`w-[100%] max1050:w-[100%] max-w-[36rem] rounded-3xl p-2 flex flex-col max536:w-[95%] bg-[#ffff]`}>
            <form className={`flex flex-col gap-6 max560:w-full`}>
              <FaXmark onClick={onClose} className="crossme" />
              {/* Name */}
              <div className="flex flex-row justify-between gap-4 max560:flex-col max560:gap-8">
                <div className="flex flex-col gap-1 justify-center">
                  <label className="ml-2">Name</label>
                  <input
                    required
                    placeholder="Name"
                    className="bg-inputBgColor  px-4 py-2 rounded-lg"
                    type={"text"}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1 justify-center">
                  <label className="ml-2">Email</label>
                  <input
                    className={` bg-inputBgColor px-4 py-2 rounded-lg`}
                    type="email"
                    value={email}
                    readOnly
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-row justify-between gap-4 max560:flex-col max560:gap-8">
                {/* <div className="flex flex-col gap-1 justify-center">
                  <label className="ml-2">Country</label>
                  <input
                    className="bg-inputBgColor px-4 py-2 rounded-lg"
                    type="text"
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                    }}
                  />
                </div> */}
              </div>

              {/* Phone Number and Attendance */}
              <div
                className={`flex flex-row justify-between gap-4 max560:flex-col max560:gap-8`}>
                <div className={`flex flex-col gap-1 justify-center`}>
                  <label className={`ml-2`}>Phone Number</label>
                  <input
                    className={` bg-inputBgColor px-4 py-2 rounded-lg`}
                    type="text"
                    readOnly
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                    }}
                  />
                </div>
                <div className={`flex flex-col gap-1 justify-center`}>
                  <label className={`ml-2`}>Attendance</label>
                  <div className={`flex items-center justify-center`}>
                    <input
                      className={` bg-inputBgColor px-2 py-2 rounded-lg`}
                      style={{ width: "100px" }}
                      type="number"
                      value={currentMonthZPoints}
                      onChange={(e) => {
                        setCurrentMonthZPoints(e.target.value);
                      }}
                    />
                    <p className={`mt-3 mx-2`}>/</p>
                    <input
                      className={` bg-inputBgColor px-2 py-2 rounded-lg `}
                      style={{ width: "100px" }}
                      type="number"
                      value={lastMonthZPoints}
                      onChange={(e) => {
                        setLastMonthZPoints(e.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/*joining Date and User Status*/}
              <div
                className={`flex flex-row justify-between gap-4 max560:flex-col max560:gap-8`}>
                <div className={`flex flex-col gap-1 justify-center`}>
                  <label className={``}>Joining Date</label>
                  <div
                    className={` bg-inputBgColor px-4 py-2 rounded-md`}
                    style={{
                      width: "222px",
                    }}>
                    {formatDate(user.joiningDate)}
                  </div>
                </div>
                <div className={`flex flex-col gap-1 justify-center`}>
                  <label className={`ml-2`}>User Status</label>
                  <select
                    className={` bg-inputBgColor px-4 py-2 rounded-lg `}
                    style={{
                      width: "222px",
                    }}
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                    }}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    {status === "GracePeriod" && (
                      <option value="GracePeriod">Grace Period</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Grace Period Warning Banner */}
              {user && (() => {
                const graceInfo = getMemberGracePeriodInfo(user);
                if (!graceInfo.isGracePeriod) return null;
                return (
                  <div className="w-full bg-amber-50 border border-amber-300 rounded-xl p-4 my-1 text-amber-900 text-sm shadow-sm">
                    <div className="font-bold flex items-center justify-between gap-2 text-amber-800 text-base">
                      <span className="flex items-center gap-2">
                        ⚠️ Payment Failed — 7-Day Grace Period Active
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 bg-amber-200/80 rounded-full text-amber-900">
                        Day {graceInfo.progressText}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-amber-800 grid grid-cols-2 gap-2 bg-white/70 p-2.5 rounded-lg border border-amber-200">
                      <div>
                        <span className="font-semibold block text-gray-600">Plan End Date:</span>
                        {graceInfo.formattedRenewDate}
                      </div>
                      <div>
                        <span className="font-semibold block text-gray-600">Grace Period Ends:</span>
                        {graceInfo.formattedGraceEndDate}
                      </div>
                      <div className="col-span-2 pt-1 border-t border-amber-200/60 font-medium text-amber-900 flex items-center justify-between">
                        <span>
                          Remaining Grace Days: <span className="font-extrabold text-amber-900 text-sm">{graceInfo.remainingDays}</span> {graceInfo.remainingDays === 1 ? 'day' : 'days'} left
                        </span>
                        <span className="font-semibold text-amber-800">
                          Progress: {graceInfo.progressText}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
              <div
                className={`flex flex-row justify-between gap-4 max560:flex-col max560:gap-8`}>
                <div className={`flex flex-col gap-1 justify-center`}>
                  <label className={`ml-2`}>Product Type</label>
                  <select
                    className={` bg-inputBgColor px-4 py-2 rounded-lg `}
                    style={{
                      width: "222px",
                    }}
                    value={productType}
                    onChange={handleProductTypeChange}>
                    <option value="">Select Product Type</option>
                    {productDetails.map((product) => (
                      <option key={product.heading} value={product.heading}>
                        {product.heading}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={`flex flex-col gap-1 justify-center`}>
                  <label className={`ml-2`}>Amount</label>
                  <input
                    className={` bg-inputBgColor px-4 py-2 rounded-lg`}
                    type="text"
                    value={selectedProductAmount}
                    readOnly // Make the input read-only
                  />
                </div>
              </div>

              <div
                className={`flex flex-row justify-between gap-4 max560:flex-col max560:gap-8`}>
                <div className={`flex flex-col gap-1 justify-center`}>
                  <label className={`ml-2`}>Balance</label>
                  <input
                    className={` bg-inputBgColor px-4 py-2 rounded-lg`}
                    type="text"
                    value={balance}
                    onChange={(e) => {
                      setBalance(e.target.value);
                    }}
                  />
                </div>
                {/* <div className={`flex flex-col gap-1 justify-center`}>
                  <label className={`ml-2`}>Payment Status</label>
                  <select
                    className={` bg-inputBgColor px-4 py-2 rounded-lg `}
                    style={{
                      width: '222px'
                    }}
                    value={pstatus}
                    onChange={(e) => {
                      setPStatus(e.target.value);
                    }}
                  >
                    <option value="">Select Payment Status</option>
                    <option value="paid">Paid</option>
                  </select>
                </div> */}
                <div className={`flex flex-col gap-1 justify-center`}>
                  <label className={`ml-2`}>Payment Date</label>
                  <input
                    className="bg-inputBgColor px-4 py-2 rounded-lg"
                    placeholder="Date"
                    type="date"
                    value={pdate}
                    style={{
                      width: "222px",
                    }}
                    onChange={(e) => {
                      setPDate(e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className={`flex flex-row items-center mt-3 newedit`}>
                {/* Update Profile Button */}
                <Button2
                  data={
                    <>
                      <FaUserEdit size={200} className="mr-2" /> Update Profile
                    </>
                  }
                  fn={(e) => {
                    onUpdateUser(e);
                  }}
                  w="12rem"
                />
                {/* Send Invoice Button */}
                <button
                  className="bg-white rounded-lg text-black py-2 mb-1 flex items-center invbut"
                  onClick={(e) => {
                    e.preventDefault();
                    sendReminder(cognitoId);
                  }}>
                  <FaEnvelope className="mr-3" />
                  Send Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;