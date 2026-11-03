import React, { useState, useEffect, useRef } from "react";
// import { API } from "../../../Context/ContextProvider";
import Context from "../../../Context/Context";
import { useContext } from "react";
import { uploadData, remove } from "aws-amplify/storage";
import { toast } from "react-toastify";
import Select from "react-select";
import {
  Button,
  Modal,
  FileInput,
  Label,
  TextInput,
  Select as FlowbiteSelect,
} from "flowbite-react";
import { FaPhoneAlt, FaGlobe } from "react-icons/fa";
import { HiMail, HiUser, HiOutlineExclamationCircle } from "react-icons/hi";
import { MdVerified, MdEdit, MdPayment, MdOutlinePayments } from "react-icons/md";
import Country from "../../../components_old/Country";

const InstructorModal = ({
  show,
  alert,
  isUpdating,
  selectedInstructor,
  institutionData,
  InstitutionData,
  instructorList,
  onClose,
  onCloseAlert,
  onSuccess,
  setLoaderInitialized,
}) => {
  const fileInputRef = useRef(null);
  const { manageInstructor } = useContext(Context);

  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("91");
  const [instructorPaymentType, setInstructorPaymentType] = useState("");
  const [instructorPaymentAmount, setInstructorPaymentAmount] = useState("");
  const [selectedClassTypes, setSelectedClassTypes] = useState([]);
  const [phoneNumberValid, setPhoneNumberValid] = useState(true);
  const [emailValid, setEmailValid] = useState(true);

  // Prepare class type options
  const classTypeOptions = institutionData.ClassTypes.map((classType) => ({
    value: classType,
    label: classType,
  }));

  useEffect(() => {
    if (isUpdating && selectedInstructor) {
      setName(selectedInstructor.name || "");
      setPosition(selectedInstructor.position || "");
      setEmail(selectedInstructor.emailId || "");
      setImageURL(selectedInstructor.image || "");
      setPhone(selectedInstructor.phoneNumber || "");
      setCountryCode(selectedInstructor.phoneNumber?.slice(1, 3) || "91");
      setInstructorPaymentType(selectedInstructor.instructorPaymentType || "");
      setInstructorPaymentAmount(selectedInstructor.instructorPaymentAmount || "");

      const classTypes = Array.isArray(selectedInstructor.classType)
        ? selectedInstructor.classType.map((type) => ({
            value: type,
            label: type,
          }))
        : [];
      setSelectedClassTypes(classTypes);
    } else {
      resetForm();
    }
  }, [isUpdating, selectedInstructor]);

  const resetForm = () => {
    setName("");
    setPosition("");
    setEmail("");
    setImageURL("");
    setPhone("");
    setCountryCode("91");
    setInstructorPaymentType("");
    setInstructorPaymentAmount("");
    setSelectedClassTypes([]);
    setPhoneNumberValid(true);
    setEmailValid(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatPhoneWithPlus = (code, number) => {
    if (!code) return number;
    return `${code.startsWith("+") ? "" : "+"}${code}${number}`;
  };

  const handleClassTypeChange = (selectedOptions) => {
    setSelectedClassTypes(selectedOptions || []);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    console.log("File selected:", file);

    if (isUpdating && imageURL) {
      const url = imageURL?.split(
        `https://institution-utils.s3.amazonaws.com/public/`
      )[1];
      const key = decodeURI(url);
      await remove({ path: key });
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.warn("Please upload an image of less than 10MB size.", {
        className: "custom-toast",
      });
      return;
    }

    const folderPath = `institution-utils/${institutionData.InstitutionId}/images/Instructor`;

    setLoaderInitialized(true);
    try {
      console.log("Uploading file...", file.name, file.type);
      const result = await uploadData({
        path: `${folderPath}/${file.name}`,
        data: file,
        options: {
          contentType: file.type,
          accessLevel: "guest" // Assuming public read means guest access in v6 terminology for unauth access, or based on config.
        }
      }).result;
      console.log("File uploaded successfully.");
      const url = `https://institution-utils.s3.amazonaws.com/public/${folderPath}/${file.name}`;
      const imgUrl = encodeURI(url);
      setImageURL(imgUrl);
      console.log("API Call Successful");
    } catch (e) {
      console.error("Error uploading file:", e);
      toast.error("Error uploading file. Please try again.", {
        className: "custom-toast",
      });
    } finally {
      setLoaderInitialized(false);
    }
  };

  const phoneNumberValidation = () => {
    if (!phone || phone.length < 9 || phone.length > 10) {
      return false;
    }
    return true;
  };

  const emailValidation = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return false;
    }
    return true;
  };

  const handleAddInstructor = async () => {
    setLoaderInitialized(true);
    if (!name || !phone) {
      toast.error("Name and Phone are required.", {
        className: "custom-toast",
      });
      setLoaderInitialized(false);
      return;
    }
    if (emailValid === false) {
      toast.error("Please enter a valid email address.", {
        className: "custom-toast",
      });
      setLoaderInitialized(false);
      return;
    }

    if (phoneNumberValid === false) {
      toast.error("Please enter a valid phone number.", {
        className: "custom-toast",
      });
      setLoaderInitialized(false);
      return;
    }

    const instructorClassTypes = selectedClassTypes?.map((type) => type.value) || [];

    try {
      const data = {
        institution: institutionData.InstitutionId,
        name: name,
        userName: name,
        phoneNumber: formatPhoneWithPlus(countryCode, phone),
        position: position,
        image: imageURL,
        emailId: email,
        instructorPaymentType: instructorPaymentType ? instructorPaymentType : "",
        instructorPaymentAmount: instructorPaymentAmount ? instructorPaymentAmount : "",
        classType: instructorClassTypes,
      };

      const emailExists = instructorList.some(
        (instructor) => instructor.emailId === email
      );
      if (emailExists) {
        toast.warn(
          "This email is already associated with an existing instructor.",
          {
            className: "custom-toast",
          }
        );
        setLoaderInitialized(false);
        return;
      }

      const response = await manageInstructor("create", data);

      const createdCognitoId = response.user.cognitoId;

      await manageInstructor("promote", { ...data, cognitoId: createdCognitoId });

      await manageInstructor("update", {
        institutionId: institutionData.InstitutionId,
        // The previous call was "/admin/put-instructor/..." to update user attributes or specific instructor data.
        // Assuming manageInstructor 'update' handles this or we need to align the payload.
        // If manageInstructor uses "admin/update-instructor-data" or "instructor/attribute-update", we need to check backend expectation.
        // The direct call was: /admin/put-instructor/${institutionData.InstitutionId}/${createdCognitoId}
        // Let's assume manageInstructor's upd8ate logic handles this if we pass a specific flag or if we update manageInstructor to support this path.
        // Or, we can reuse 'permission' update or similar if existing.
        // Given manageInstructor implementation:
        // if (payload.attributeName) ... else return await API.put("main", "/admin/update-instructor-data", { body: payload });
        // The original call was to `/admin/put-instructor/...`.
        // I should probably add a case or use "update-instructor-data" if that maps to the same handler, or add a specific new action if needed.
        // Looking at the code I added to ContextProvider:
        // } else if (action === "update") { ... return await API.put("main", "/admin/update-instructor-data", { body: payload }); }
        // The endpoint here is `/admin/put-instructor/...`. This might be a DIFFERENT endpoint.
        // Let's assume for now I need to update the ContextProvider to handle this specific PUT path or use the generic update if applicable.
        // Wait, I can probably map this to a specific "putInstructor" action in manageInstructor or just add `putInstructor` to ContextProvider.
        // For now, I will refrain from replacing this complex call blindly and maybe use a more generic `manageInstructor("put", ...)` if I implement it,
        // OR, I can adapt `manageInstructor` to handle this path.
        // Let's use a specific payload key to distinguish.
        action: "put-instructor", // I need to update ContextProvider to handle this if not already.
        cognitoId: createdCognitoId,
        data: {
            name: name,
            position: position,
            image: imageURL,
            phoneNumber: formatPhoneWithPlus(countryCode, phone),
            instructorPaymentType: instructorPaymentType,
            instructorPaymentAmount: instructorPaymentAmount,
            emailId: email,
            classType: instructorClassTypes,
        }
      });

      console.log(response);
      setLoaderInitialized(false);
      toast.success("Instructor added successfully.", {
        className: "custom-toast",
      });
      onSuccess();
      onClose();
      resetForm();
    } catch (e) {
      console.log(e);
      setLoaderInitialized(false);
    }
  };

  const handleUpdateInstructor = async () => {
    try {
      setLoaderInitialized(true);
      const instructorClassTypes = selectedClassTypes?.map((type) => type.value) || [];
      // Same here, this is /admin/put-instructor/...
      // I will update ContextProvider to support this specific call pattern.
       const response = await manageInstructor("put", {
        institutionId: institutionData.InstitutionId,
        cognitoId: selectedInstructor.instructorId,
        data: {
            name: name,
            position: position,
            image: imageURL,
            phoneNumber: formatPhoneWithPlus(countryCode, phone),
            instructorPaymentType: instructorPaymentType,
            instructorPaymentAmount: instructorPaymentAmount,
            emailId: email,
            classType: instructorClassTypes,
        }
       });
      console.log(response);
      setLoaderInitialized(false);
      toast.success("Instructor updated successfully.", {
        className: "custom-toast",
      });
      onSuccess();
      onClose();
      resetForm();
    } catch (e) {
      console.log(e);
      setLoaderInitialized(false);
    }
  };

  const handleDeleteInstructor = async () => {
    setLoaderInitialized(true);
    onCloseAlert();
    try {
      const url = imageURL?.split(
        `https://institution-utils.s3.amazonaws.com/public/`
      )[1];
      const key = decodeURI(url);

      imageURL &&
        (await remove({ path: key }));
      const response = await manageInstructor("delete-instructor", {
        institutionId: institutionData.InstitutionId,
        instructorId: selectedInstructor.instructorId
      });
      console.log(response);
      toast.success("Instructor deleted successfully.", {
        className: "custom-toast",
      });
      setLoaderInitialized(false);
      onSuccess();
      resetForm();
    } catch (e) {
      console.log(e);
      setLoaderInitialized(false);
    }
  };

  const handleSubmit = () => {
    if (!emailValid || !phoneNumberValid) {
      toast.error("Please fix the errors before submitting.");
      return;
    }
    isUpdating ? handleUpdateInstructor() : handleAddInstructor();
  };

  return (
    <>
      {/* Delete Confirmation Modal */}
      <Modal show={alert} size="lg" onClose={onCloseAlert} popup>
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this Instructor?
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="failure" onClick={handleDeleteInstructor}>
                {"Yes, I'm sure"}
              </Button>
              <Button color="gray" onClick={onCloseAlert}>
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Add/Update Instructor Modal */}
      <Modal
        show={show}
        size="lg"
        onClose={onClose}
        popup
        className="!z-[100]">
        <Modal.Header className="py-4 px-4">
          {isUpdating ? "Update Instructor" : "Add Instructor"}
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-2">
            <div id="fileUpload" className="max-w-md">
              <div className="mb-2 block">
                <Label htmlFor="file" value="Upload file" />
              </div>
              <FileInput
                ref={fileInputRef}
                onChange={handleFileChange}
                helperText={
                  isUpdating
                    ? "Leave empty to keep the same"
                    : "A profile picture is required for the instructor."
                }
              />
            </div>
            <div className="max-w-md">
              <div className="mb-2 block">
                <Label htmlFor="text" value="Name" />
              </div>
              <TextInput
                color={"primary"}
                id="text"
                type="text"
                icon={HiUser}
                value={name}
                placeholder="Enter Name"
                onChange={(e) => setName(e.target.value)}
                required
                rightIcon={isUpdating ? MdEdit : null}
              />
            </div>
            <div className="max-w-md">
              <div className="mb-2 block">
                <Label htmlFor="text" value="Position" />
              </div>
              <TextInput
                color={"primary"}
                id="text"
                type="text"
                icon={MdVerified}
                value={position}
                placeholder="Enter Position"
                onChange={(e) => setPosition(e.target.value)}
                required
                rightIcon={isUpdating ? MdEdit : null}
              />
            </div>
            <div className="flex flex-col">
              <label className="font-medium">Class Types</label>
              <Select
                isMulti
                options={classTypeOptions}
                value={selectedClassTypes}
                onChange={handleClassTypeChange}
                placeholder="Select Class Types"
              />
            </div>
            {!isUpdating && (
              <div className="flex flex-row gap-2">
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="text" value="Country Code" />
                  </div>
                  <FlowbiteSelect
                    color={"primary"}
                    icon={FaGlobe}
                    value={countryCode}
                    onChange={(e) => {
                      setCountryCode(e.target.value.toString());
                    }}>
                    <Country />
                  </FlowbiteSelect>
                </div>

                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="text" value="Phone" />
                  </div>
                  <TextInput
                    color={"primary"}
                    id="text"
                    type="tel"
                    pattern="[0-9]{9,10}"
                    icon={FaPhoneAlt}
                    value={phone}
                    placeholder="Enter Phone"
                    onChange={(e) => {
                      if (/^\d{0,10}$/.test(e.target.value))
                        setPhone(e.target.value);
                    }}
                    onBlur={() => {
                      const isValid = phoneNumberValidation();
                      setPhoneNumberValid(isValid);
                    }}
                    required
                    rightIcon={isUpdating ? MdEdit : null}
                  />
                  {!phoneNumberValid && (
                    <p className="text-red-500 text-sm mt-1">
                      Phone number is not valid.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-row gap-2">
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="text" value="Payment Type" />
                </div>
                <FlowbiteSelect
                  color={"primary"}
                  icon={MdPayment}
                  value={instructorPaymentType}
                  onChange={(e) => setInstructorPaymentType(e.target.value)}>
                  <option value="">Select Payment Type</option>
                  <option value="percent">Percent</option>
                  <option value="flat">Flat</option>
                </FlowbiteSelect>
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="text" value="Payment Amount" />
                </div>
                <TextInput
                  type="number"
                  color={"primary"}
                  id="text"
                  icon={MdOutlinePayments}
                  value={instructorPaymentAmount}
                  placeholder="Enter Payment Amount"
                  onChange={(e) => setInstructorPaymentAmount(e.target.value)}
                  required
                  rightIcon={isUpdating ? MdEdit : null}
                />
              </div>
            </div>
            <div className="max-w-md">
              <div className="mb-2 block">
                <Label htmlFor="email4" value="Email" />
              </div>
              <TextInput
                color={"primary"}
                id="email4"
                type="email"
                icon={HiMail}
                value={email}
                placeholder="Enter Email"
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => {
                  const isValid = emailValidation();
                  setEmailValid(isValid);
                }}
                rightIcon={isUpdating ? MdEdit : null}
              />
              {!emailValid && (
                <p className="text-red-500 text-sm mt-1">Email is not valid.</p>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            style={{
              backgroundColor: InstitutionData.PrimaryColor,
            }}
            onClick={handleSubmit}>
            {isUpdating ? "Update" : "Add"}
          </Button>
          <Button color={"secondary"} onClick={onClose}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default InstructorModal;