import React, { useContext, useEffect, useState } from "react";
import InstitutionContext from "../../../Context/InstitutionContext";
import Context from "../../../Context/Context";
import { MdEdit } from "react-icons/md";
import {
  Button,
  Modal,
  FileInput,
  Label,
  TextInput,
  Spinner,
} from "flowbite-react";
import { Dialog } from "@radix-ui/themes";
import { toast } from "react-toastify";
import { uploadData, getUrl } from "aws-amplify/storage";
import { FaPlus, FaStar } from "react-icons/fa";
import { InitialsAvatar } from "../../../utils/helpers";
import InstitutionData from "../../../../Operation/institutionData.json";

const TestimonialCard = ({
  name,
  description,
  img,
  realIndex,
  onCardClick,
  isClone = false,
}) => (
  <div
    onClick={isClone ? undefined : onCardClick}
    onKeyDown={
      isClone
        ? undefined
        : (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onCardClick?.();
            }
          }
    }
    role={isClone ? undefined : "button"}
    tabIndex={isClone ? -1 : 0}
    aria-hidden={isClone ? "true" : undefined}
    aria-label={isClone ? undefined : `Testimonial from ${name}`}
    className={`bg-white font-['Inter'] rounded-2xl p-6 shadow-sm w-[320px] shrink-0 xl:w-full group relative ${
      isClone
        ? "pointer-events-none select-none"
        : "cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#03413A]"
    } transition-shadow`}
  >
    <div className="absolute top-3 right-3 text-[#03413A]">
      <FaStar size={12} />
    </div>

    <div className="flex items-center gap-2 mb-4">
      {img ? (
        <img
          src={img}
          alt={name}
          className="h-14 w-14 border-4 border-[#03413A] rounded-full object-cover"
        />
      ) : (
        <InitialsAvatar
          name={name}
          className="h-14 w-14 border-4 border-[#03413A] rounded-full text-lg"
        />
      )}
      <div>
        <p className="text-xs font-[500] text-[#111111]">{name}</p>
      </div>
    </div>

    <p
      className="text-sm font-medium text-[#03413A] leading-relaxed overflow-hidden"
      style={{
        display: "-webkit-box",
        WebkitLineClamp: 4,
        WebkitBoxOrient: "vertical",
      }}
    >
      “{description}”
    </p>
  </div>
);

// MOVED OUT of Testimonial for stable identity across re-renders.
const ScrollColumn = ({
  columnKey,
  animationClass,
  items,
  keyPrefix,
  isPaused,
  onPauseChange,
  onCardClick,
  testimonialsLength,
  isDecorativeOnly = false,
}) => (
  <div
    aria-hidden={isDecorativeOnly ? "true" : undefined}
    className={`space-y-8 ${animationClass}`}
    style={{
      animationDuration: "30s",
      animationPlayState: isPaused ? "paused" : "running",
    }}
    onMouseEnter={() => onPauseChange(columnKey, true)}
    onMouseLeave={() => onPauseChange(columnKey, false)}
  >
    {items.map((t, i) => {
      const isClone = isDecorativeOnly || i >= testimonialsLength;
      return (
        <TestimonialCard
          key={`${keyPrefix}-${i}`}
          {...t}
          isClone={isClone}
          realIndex={i % testimonialsLength}
          onCardClick={() => onCardClick(t)}
        />
      );
    })}
  </div>
);

const Testimonial = () => {
  const testiData = InstitutionData?.Testimonial || [];

  const [testimonials, setTestimonials] = useState(testiData);
  const UserCtx = useContext(Context);
  const isAdmin = UserCtx.userData.userType === "admin";
  const { updateTestimonialData } = useContext(Context);

  const [modalShow, setModalShow] = useState(false);
  const [addModalShow, setAddModalShow] = useState(false);
  const [selectedTestimonialIndex, setSelectedTestimonialIndex] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newSelectedFile, setNewSelectedFile] = useState(null);
  const [newTestName, setNewTestName] = useState("");
  const [newFeedback, setNewFeedback] = useState("");
  const [updateTestName, setUpdateTestName] = useState("");
  const [updateFeedback, setUpdateFeedback] = useState("");
  const { PrimaryColor } = InstitutionData;
  const [loading, setLoading] = useState(false);

  const [viewTestimonial, setViewTestimonial] = useState(null);
  const [pausedColumns, setPausedColumns] = useState({});
  const [globalPaused, setGlobalPaused] = useState(false);

  const togglePause = (key, value) =>
      setPausedColumns((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    setTestimonials(InstitutionData.Testimonial || []);
  }, [InstitutionData.Testimonial]);

  const onCloseModal = () => {
    setModalShow(false);
    setUpdateTestName("");
    setUpdateFeedback("");
    setSelectedFile(null);
  };

  const onCloseAddModal = () => {
    setAddModalShow(false);
    setNewTestName("");
    setNewFeedback("");
    setNewSelectedFile(null);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only JPG, JPEG, and PNG files are allowed.");
        event.target.value = "";
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange2 = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only JPG, JPEG, and PNG files are allowed.");
        event.target.value = "";
        setNewSelectedFile(null);
      } else {
        setNewSelectedFile(file);
      }
    }
  };

  const uploadToS3 = async (file) => {
    try {
      const response = await uploadData({
        path: `Testimonials/${file.name}_${Date.now()}`,
        data: file,
        options: { contentType: file.type, accessLevel: "guest" },
      }).result;
      const url = await getUrl({ path: response.path });
      return url.url.toString().split("?")[0];
    } catch (error) {
      console.error("Error uploading to S3:", error);
      throw error;
    }
  };

  const centralizeApiCall = async (action, testimonialData) => {
    try {
      setLoading(true);
      let updatedTestimonials;

      if (action === "add") {
        updatedTestimonials = [...testimonials, testimonialData];
      } else if (action === "update") {
        updatedTestimonials = testimonials.map((test, index) =>
            index === selectedTestimonialIndex ? testimonialData : test
        );
      } else if (action === "delete") {
        updatedTestimonials = testimonials.filter(
            (_, index) => index !== selectedTestimonialIndex
        );
      }

      await updateTestimonialData({
        institutionid: InstitutionData.institutionid,
        Testimonial: updatedTestimonials,
      });

      toast.success(`Testimonial ${action}ed successfully!`);
      onCloseModal();
      onCloseAddModal();
    } catch (error) {
      console.error(error);
      toast.error(`Error in ${action}ing the testimonial`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTestimonial = () => centralizeApiCall("delete");

  const handleUpdateTestimonial = async () => {
    try {
      let newUrl = null;
      if (selectedFile) newUrl = await uploadToS3(selectedFile);

      const updatedTestimonial = {
        name: updateTestName || testimonials[selectedTestimonialIndex].name,
        description:
            updateFeedback || testimonials[selectedTestimonialIndex].description,
        img: newUrl || testimonials[selectedTestimonialIndex].img,
      };

      await centralizeApiCall("update", updatedTestimonial);
    } catch (error) {
      console.error(error);
      toast.error("Error in updating the testimonial");
    }
  };

  const handleAddTestimonial = async () => {
    try {
      if (!newTestName || !newFeedback || !newSelectedFile) {
        toast.error("Please fill in all fields and upload an image.");
        return;
      }
      const newUrl = await uploadToS3(newSelectedFile);
      const newTestimonial = {
        name: newTestName,
        description: newFeedback,
        img: newUrl,
      };
      await centralizeApiCall("add", newTestimonial);
    } catch (error) {
      console.error(error);
      toast.error("Error in adding the testimonial");
    }
  };

  const handleEditClick = (index) => {
    setSelectedTestimonialIndex(index);
    const testimonial = testimonials[index];
    setUpdateTestName(testimonial.name);
    setUpdateFeedback(testimonial.description);
    setModalShow(true);
  };

  return (
      <div
          id="testimonial-section"
          className="bg-[#EAF5F3] pt-5 py-5 xl:py-2 overflow-hidden font-['Inter']"
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-20">
          <div className="xl:hidden flex flex-col items-center mb-8 gap-3">
            <h2 className="inline-block text-white px-6 py-4 text-2xl bg-[#03413A] font-bold uppercase lg:tracking-widest rounded-sm">
              What our members say
            </h2>
            <button
              type="button"
              aria-label={globalPaused ? "Resume testimonial scrolling" : "Pause testimonial scrolling"}
              aria-pressed={globalPaused}
              onClick={() => setGlobalPaused((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#03413A] bg-white text-xs font-semibold text-[#03413A] hover:bg-[#03413A] hover:text-white transition shadow-sm"
            >
              {globalPaused ? "▶ Resume Scroll" : "⏸ Pause Scroll"}
            </button>
          </div>

          <div className="grid gap-16 items-center xl:grid-cols-[3fr_2fr]">
            <div className="hidden xl:block space-y-8">
              <div className="flex items-center gap-4 flex-wrap">
                <h2 className="text-[#03413A] text-[2.5rem] font-bold leading-tight">
                  We believe in the <br /> power of movement together
                </h2>
              </div>
              <p className="text-[#03413AB8] text-[1.8rem] font-medium">
                Our mission is to help you build a routine you actually enjoy.
                That’s why we focus on simple, daily sessions that fit your life
                and keep you consistent—with a community that grows with you.
              </p>
              <div>
                <button
                  type="button"
                  aria-label={globalPaused ? "Resume testimonial scrolling" : "Pause testimonial scrolling"}
                  aria-pressed={globalPaused}
                  onClick={() => setGlobalPaused((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#03413A] bg-white text-sm font-semibold text-[#03413A] hover:bg-[#03413A] hover:text-white transition shadow-sm"
                >
                  {globalPaused ? "▶ Resume Scrolling" : "⏸ Pause Scrolling"}
                </button>
              </div>
            </div>

            <div className="hidden xl:grid grid-cols-2 gap-8 h-[700px] overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#EAF5F3] to-transparent z-10 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-[#EAF5F3] to-transparent z-10 pointer-events-none"></div>

              <ScrollColumn
                  columnKey="desktop-left"
                  animationClass="animate-scroll-down"
                  items={[...testimonials, ...testimonials]}
                  keyPrefix="left"
                  isPaused={globalPaused || !!pausedColumns["desktop-left"]}
                  onPauseChange={togglePause}
                  onCardClick={setViewTestimonial}
                  testimonialsLength={testimonials.length}
                  isDecorativeOnly={false}
              />
              <ScrollColumn
                  columnKey="desktop-right"
                  animationClass="animate-scroll-up"
                  items={[...testimonials, ...testimonials]}
                  keyPrefix="right"
                  isPaused={globalPaused || !!pausedColumns["desktop-right"]}
                  onPauseChange={togglePause}
                  onCardClick={setViewTestimonial}
                  testimonialsLength={testimonials.length}
                  isDecorativeOnly={true}
              />
            </div>

            <div className="xl:hidden space-y-12">
              <div className="overflow-hidden">
                <div
                    className="flex gap-6 animate-scroll-left"
                    style={{
                      animationDuration: "30s",
                      animationPlayState: (globalPaused || pausedColumns["mobile-left"]) ? "paused" : "running",
                    }}
                    onMouseEnter={() => togglePause("mobile-left", true)}
                    onMouseLeave={() => togglePause("mobile-left", false)}
                >
                  {[...testimonials, ...testimonials].map((t, i) => (
                      <TestimonialCard
                          key={`m-left-${i}`}
                          {...t}
                          isClone={i >= testimonials.length}
                          onCardClick={() => setViewTestimonial(t)}
                      />
                  ))}
                </div>
              </div>
              <div className="overflow-hidden" aria-hidden="true">
                <div
                    className="flex gap-6 animate-scroll-right"
                    style={{
                      animationDuration: "30s",
                      animationPlayState: (globalPaused || pausedColumns["mobile-right"]) ? "paused" : "running",
                    }}
                    onMouseEnter={() => togglePause("mobile-right", true)}
                    onMouseLeave={() => togglePause("mobile-right", false)}
                >
                  {[...testimonials, ...testimonials].map((t, i) => (
                      <TestimonialCard
                          key={`m-right-${i}`}
                          {...t}
                          isClone={true}
                          onCardClick={() => setViewTestimonial(t)}
                      />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Dialog.Root
            open={!!viewTestimonial}
            onOpenChange={(open) => !open && setViewTestimonial(null)}
        >
          <Dialog.Content maxWidth="480px">
            {viewTestimonial && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    {viewTestimonial.img ? (
                        <img
                            src={viewTestimonial.img}
                            alt={viewTestimonial.name}
                            className="h-16 w-16 border-4 border-[#03413A] rounded-full object-cover"
                        />
                    ) : (
                        <InitialsAvatar
                            name={viewTestimonial.name}
                            className="h-16 w-16 border-4 border-[#03413A] rounded-full text-lg"
                        />
                    )}
                    <Dialog.Title className="!m-0 text-[#03413A]">
                      {viewTestimonial.name}
                    </Dialog.Title>
                  </div>
                  <Dialog.Description className="text-sm leading-relaxed text-[#03413A] whitespace-pre-wrap">
                    “{viewTestimonial.description}”
                  </Dialog.Description>
                  <div className="flex justify-end mt-6">
                    <Dialog.Close>
                      <Button style={{ backgroundColor: "#03413A" }} className="rounded-lg">
                        Close
                      </Button>
                    </Dialog.Close>
                  </div>
                </>
            )}
          </Dialog.Content>
        </Dialog.Root>

        {/* CRUD MODALS (unchanged) */}
        <Modal show={modalShow} size="lg" onClose={onCloseModal} popup>
          <Modal.Header className="py-4 px-6 border-b">Update Testimonial</Modal.Header>
          <Modal.Body className="p-6">
            <div className="space-y-6">
              <div>
                <Label className="mb-2 block">Photo</Label>
                <FileInput accept=".jpg, .jpeg, .png" onChange={handleFileChange} />
              </div>
              <div>
                <Label className="mb-2 block">Name</Label>
                <TextInput
                    value={updateTestName}
                    onChange={(e) => setUpdateTestName(e.target.value)}
                    placeholder="Name"
                />
              </div>
              <div>
                <Label className="mb-2 block">Feedback</Label>
                <TextInput
                    value={updateFeedback}
                    onChange={(e) => setUpdateFeedback(e.target.value)}
                    placeholder="Feedback"
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="px-6 pb-6 pt-0 flex flex-col gap-3">
            <Button color="failure" onClick={handleDeleteTestimonial} className="w-full rounded-lg" disabled={loading}>
              Delete
            </Button>
            <Button style={{ backgroundColor: "#03413A" }} onClick={handleUpdateTestimonial} className="w-full rounded-lg" disabled={loading}>
              {loading ? <Spinner size="sm" /> : "Update"}
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={addModalShow} size="lg" onClose={onCloseAddModal} popup>
          <Modal.Header className="py-4 px-6 border-b">Add New Testimonial</Modal.Header>
          <Modal.Body className="p-6">
            <div className="space-y-6">
              <div>
                <Label className="mb-2 block">Photo</Label>
                <FileInput accept=".jpg, .jpeg, .png" onChange={handleFileChange2} />
              </div>
              <div>
                <Label className="mb-2 block">Name</Label>
                <TextInput
                    value={newTestName}
                    onChange={(e) => setNewTestName(e.target.value)}
                    placeholder="Name"
                    maxLength={50}
                />
              </div>
              <div>
                <Label className="mb-2 block">Feedback</Label>
                <TextInput
                    value={newFeedback}
                    onChange={(e) => setNewFeedback(e.target.value)}
                    placeholder="Feedback"
                    maxLength={250}
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="px-6 pb-6 pt-0">
            <Button style={{ backgroundColor: "#03413A" }} onClick={handleAddTestimonial} className="w-full rounded-lg" disabled={loading}>
              {loading ? <Spinner size="sm" /> : <><FaPlus className="mr-2" /> Add</>}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
  );
};

export default Testimonial;