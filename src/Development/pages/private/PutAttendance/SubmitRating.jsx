import React, { useContext, useState, useEffect, useMemo } from 'react';
import { Button, Card, Label, Modal, Textarea } from 'flowbite-react';
import { FaStar } from 'react-icons/fa6';
import Context from "../../../Context/Context";
import InstitutionContext from "../../../Context/InstitutionContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { PrimaryButton } from "../../../common/Inputs";

const RatingPage = ({ instructorData = {}, classData = {} }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const { InstitutionId } = useContext(InstitutionContext).institutionData || {};
  const Ctx = useContext(Context);
  const { userData = {}, util = {}, submitInstructorRating, ratings = [] } = Ctx;
  const navigate = useNavigate();

  const classId = classData?.classId || instructorData?.classId || "";
  const instructorId = instructorData?.iId || instructorData?.instructorId || classData?.instructorId || "";
  const instructorEmail = instructorData?.iEmail || instructorData?.instructorEmailId || classData?.instructorEmailId || "";
  const instructorName = instructorData?.iName || instructorData?.instructorName || classData?.instructorNames || "";

  // Check if an existing rating exists for this exact class and instructor (Requirement 4)
  useEffect(() => {
    if (!instructorId || !classId) return;

    const currentCognitoId = userData?.cognitoId ? String(userData.cognitoId).trim() : "";
    const currentEmail = userData?.emailId ? String(userData.emailId).toLowerCase().trim() : "";

    const existing = ratings.find((r) => {
      const matchInst = r.instructorId && String(r.instructorId) === String(instructorId);
      const matchClass = r.classId && String(r.classId) === String(classId);
      const matchUser =
        (r.userId && currentCognitoId && String(r.userId) === currentCognitoId) ||
        (r.userEmailId && currentEmail && String(r.userEmailId).toLowerCase() === currentEmail);
      return matchInst && matchClass && matchUser;
    });

    if (existing) {
      setRating(Number(existing.rating) || 0);
      setFeedback(existing.review || "");
      setIsEditMode(true);
    }
  }, [instructorId, classId, userData?.cognitoId, userData?.emailId, ratings]);

  const handleRating = (rate) => {
    setRating(rate);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (rating === 0 || rating < 1 || rating > 5) {
      toast.error("Please give a rating between 1 and 5 stars.");
      return;
    }

    if (!instructorId) {
      toast.error("Instructor information missing.");
      return;
    }

    if (!classId) {
      toast.error("Class information is missing to verify attendance.");
      return;
    }

    setIsSubmitting(true);
    if (util.setLoader) util.setLoader(true);

    try {
      const response = await submitInstructorRating(InstitutionId, {
        instructorId: String(instructorId).trim(),
        classId: String(classId).trim(),
        instructorEmailId: instructorEmail,
        instructorName: instructorName,
        userEmailId: userData.emailId || "",
        userName: userData.userName || "",
        rating: Number(rating),
        review: feedback.trim(),
      });

      if (response?.isDuplicate) {
        toast.info(response.message || "Rating already submitted for this instructor/class.");
      } else if (response?.isUpdated) {
        toast.success(response.message || "Rating updated successfully!");
      } else {
        toast.success(response?.message || 'Rating submitted successfully.');
      }

      setShowModal(false);
      navigate('/dashboard');
    } catch (e) {
      console.error("Submit rating failed:", e);
      const statusCode = e.statusCode;
      const backendMsg = e.backendMessage || e.message || "";

      if (statusCode === 403) {
        toast.error(backendMsg || "You must attend the class before submitting a rating.");
      } else if (statusCode === 401) {
        toast.error("Your session has expired. Please log in again.");
      } else if (statusCode === 400) {
        toast.error(backendMsg || "Invalid rating submission.");
      } else if (statusCode === 500) {
        toast.error("Server verification failed. Please try again later.");
      } else {
        toast.error(backendMsg || 'An unknown error has occurred. Please try again.');
      }
      // Form values are preserved and modal stays open on error so user can retry
    } finally {
      setIsSubmitting(false);
      if (util.setLoader) util.setLoader(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 justify-center items-center min-h-screen px-4 py-8">
      <h1 className='font-bold text-center text-2xl max-w-2xl text-gray-800'>
        Your attendance for the class below has been recorded. Have a great session ahead and please rate us!
      </h1>
      <p className='font-semibold text-xl text-gray-700 text-center'>
        {classData.classDescription || classData.classType || "Session"} Class by {classData.instructorNames || instructorName}
      </p>
      <div className="w-80">
        <PrimaryButton onClick={() => setShowModal(true)}>
          {isEditMode ? "Edit your rating" : "Give us a rating!"}
        </PrimaryButton>
      </div>

      <Modal show={showModal} onClose={() => !isSubmitting && setShowModal(false)}>
        <Modal.Header className="p-4">
          {isEditMode ? "Edit Your Rating" : "Give Us a Rating"}
        </Modal.Header>
        <Modal.Body className="flex flex-col items-center">
          <Card className="w-full max-w-lg border-0 shadow-none">
            <h2 className="text-xl font-semibold mb-2 text-center text-gray-800">
              {isEditMode ? "Update your rating" : "Rate your instructor"}
            </h2>
            <div className="flex justify-center mb-4 gap-1" role="group" aria-label="Star rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`${star} Star${star > 1 ? "s" : ""}`}
                  className="p-1 focus:outline-none"
                  onClick={() => handleRating(star)}>
                  <FaStar
                    className={`w-8 h-8 cursor-pointer transition-colors ${
                      star <= rating ? 'text-yellow-500' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <Label htmlFor="feedback" className="mb-2 font-medium text-gray-700">
              Feedback (optional)
            </Label>
            <Textarea
              id="feedback"
              placeholder="Write your feedback here..."
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />

            <div className="flex gap-2 mt-4">
              <Button
                color="gray"
                className="flex-1"
                disabled={isSubmitting}
                onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primaryColor hover:bg-lightPrimaryColor text-white"
                disabled={isSubmitting || rating === 0}
                onClick={handleSubmit}>
                {isSubmitting
                  ? (isEditMode ? "Updating..." : "Submitting...")
                  : (isEditMode ? "Update Rating" : "Submit")}
              </Button>
            </div>
          </Card>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default RatingPage;
