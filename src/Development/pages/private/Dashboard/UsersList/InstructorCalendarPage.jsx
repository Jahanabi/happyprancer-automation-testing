import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
// import { API } from "../../../../Context/ContextProvider";
import Context from "../../../../Context/Context";
import InstitutionContext from "../../../../Context/InstitutionContext";
import { useContext } from "react";
import Calendar from "../../../../common/Calendar";
import { Button } from "flowbite-react";

function InstructorCalendarPage() {
  const { id: instructorIdParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const instructorFromState = location.state && location.state.instructor;
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const { getInstructorAttendanceAdmin } = useContext(Context);

  const [instructor, setInstructor] = useState(instructorFromState || null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalClasses, setTotalClasses] = useState(0);
  const [monthlyTotalFormatted, setMonthlyTotalFormatted] = useState("");
  const [perClassMajor, setPerClassMajor] = useState(0);
  const [perClassCurrencyState, setPerClassCurrencyState] = useState("");
  const [monthYear, setMonthYear] = useState({
    month: new Date().getUTCMonth() + 1,
    year: new Date().getUTCFullYear(),
  });

  const parseInstructorAttendanceToClasses = useCallback(
    (attendanceItems = [], instructor) => {
      const classes = [];
      attendanceItems.forEach((item) => {
        const list = item.classTaken || item.classTakenList || [];
        (Array.isArray(list) ? list : [list]).forEach((ct) => {
          if (!ct) return;

          // Support legacy string entries like "Yoga: 1762425000000"
          // and modern object-shaped entries like { classId, classType, timestampMs }
          let classType = "";
          let ms = null;
          let classId = null;

          if (typeof ct === "string") {
            const m = ct.match(/^(.*?):\s*(\d+)$/);
            if (!m) return;
            classType = m[1];
            ms = Number(m[2]);
          } else if (typeof ct === "object") {
            classType = ct.classType || ct.classTypeName || "";
            ms = Number(ct.timestampMs || ct.timestamp || ct.ts || 0);
            classId = ct.classId || ct.id || null;
            // if timestamp missing, try item.date (which may be seconds)
            if (!ms && item && item.date) {
              // item.date may be seconds (string) or milliseconds
              const dnum = Number(item.date);
              // heuristics: if date looks like seconds (10 digits) convert to ms
              ms = dnum > 1e12 ? dnum : dnum > 1e9 ? dnum * 1000 : dnum;
            }
          } else {
            return;
          }

          if (!ms) return;

          // Ensure ms is in milliseconds (some fields may be seconds)
          if (ms < 1e12) ms = ms * 1000;

          classes.push({
            classId:
              classId ||
              `${
                instructor?.instructorId || item.cognitoId
              }-${ms}-${classType}`,
            classType,
            date: ms,
            instructorNames:
              instructor?.name || instructor?.instructorNames || "",
            zoomLink: item.zoomLink || "",
            raw: item,
          });
        });
      });
      classes.sort((a, b) => a.date - b.date);
      return classes;
    },
    []
  );

  const fetchAttendance = async (reqMonth, reqYear) => {
    if (!instructorIdParam && !(instructor && instructor.instructorId)) return;
    setLoading(true);
    try {
      const r = await getInstructorAttendanceAdmin({
          institution: InstitutionData.InstitutionId,
          cognitoIds: JSON.stringify([
            instructorIdParam || instructor.instructorId,
          ]),
          month: reqMonth,
          year: reqYear,
      });
      const results = r && r.results ? r.results : [];
      const first = results[0] || {};
      const attendanceItems =
        first.attendance ||
        first.attendancePaged ||
        first.attendanceByDay ||
        [];
      const parsed = parseInstructorAttendanceToClasses(
        attendanceItems,
        instructor ||
          first.instructor || {
            instructorId: instructorIdParam,
            name: first.name,
          }
      );
      setClasses(parsed);
      // Compute total classes for the month. Prefer backend summary if provided.
      let total = 0;
      if (
        first &&
        first.summary &&
        Number.isFinite(first.summary.totalClasses)
      ) {
        total = Number(first.summary.totalClasses);
      } else if (Array.isArray(first.attendance)) {
        total = first.attendance.reduce((acc, a) => {
          if (!a) return acc;
          if (typeof a.total === "number") return acc + a.total;
          if (Array.isArray(a.classTaken)) return acc + a.classTaken.length;
          return acc;
        }, 0);
      } else {
        // fallback to parsed classes length
        total = parsed.length;
      }
      setTotalClasses(total);
      // Compute monthly monetary total using instructor.perClassAmount when available
      try {
        const perClassRaw =
          (first && first.instructor && first.instructor.perClassAmount) ||
          (instructor && instructor.perClassAmount) ||
          0;
        const perClassCurrency =
          (first && first.instructor && first.instructor.perClassCurrency) ||
          (instructor && instructor.perClassCurrency) ||
          "INR";

        let perClassMajor = 0;
        // Heuristic: if value looks like minor units (cents/paise) - divisible by 100 or large
        if (typeof perClassRaw === "number") {
          if (perClassRaw >= 100 && perClassRaw % 100 === 0) {
            perClassMajor = perClassRaw / 100;
          } else {
            perClassMajor = perClassRaw;
          }
        } else {
          perClassMajor = Number(perClassRaw) || 0;
        }

        // persist per-class major and currency for render-time breakdown
        setPerClassMajor(perClassMajor);
        setPerClassCurrencyState(perClassCurrency);

        const monthlyTotal = perClassMajor * Number(total || 0);
        // Format as currency using Intl, fallback to simple display
        try {
          const nf = new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: perClassCurrency || "INR",
            maximumFractionDigits: 2,
          });
          setMonthlyTotalFormatted(nf.format(monthlyTotal));
        } catch (fmtErr) {
          setMonthlyTotalFormatted(`${perClassCurrency} ${monthlyTotal}`);
        }
      } catch (e) {
        setMonthlyTotalFormatted("");
      }
      setMonthYear({ month: r.month || reqMonth, year: r.year || reqYear });
      // set instructor from response if not available
      if (!instructor && first.instructor) setInstructor(first.instructor);
    } catch (err) {
      console.error("Failed to fetch instructor attendance page:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial fetch
    fetchAttendance(monthYear.month, monthYear.year);
  }, []);

  const handleViewChange = (m, y) => {
    fetchAttendance(m, y);
  };

  return (
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1 rounded bg-slate-100 text-slate-700 mr-2">
            Back
          </button>
          <span className="text-lg font-semibold">
            {instructor?.name || `Instructor ${instructorIdParam}`}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          Month: {monthYear.month}/{monthYear.year}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <Calendar
            classes={classes}
            onClassClick={(c) => console.log("class clicked", c)}
            onJoin={(c) => {
              if (c.zoomLink) window.open(c.zoomLink, "_blank");
            }}
            onViewChange={handleViewChange}
          />
        </div>

        {/* Divider: horizontal on small screens, vertical on large screens */}
        <div className="block lg:hidden w-full">
          <hr className="my-4 border-t border-gray-200" />
        </div>
        <div
          className="hidden lg:block w-px bg-gray-200 mx-2"
          aria-hidden="true"
        />

        <aside className="w-full lg:w-96 max-w-[420px] bg-white rounded p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-md font-semibold">Classes</h3>
            <div className="flex items-center gap-3">
              {/* Aesthetic total badge using primary color and black text */}
              <div
                className="flex flex-col items-center justify-center px-3 py-1 rounded-lg"
                style={{
                  border: `1px solid ${
                    InstitutionData?.PrimaryColor || "#2563eb"
                  }`,
                  background: "#fff",
                  minWidth: 84,
                }}>
                <div className="text-xs" style={{ color: "#6b7280" }}>
                  This month
                </div>
                <div className="text-xl font-bold" style={{ color: "#000" }}>
                  {totalClasses}
                </div>
              </div>
            </div>
          </div>

          <div
            className="overflow-y-auto flex-1"
            style={{ maxHeight: "calc(100vh - 220px)" }}>
            {loading ? (
              <div>Loading...</div>
            ) : classes.length === 0 ? (
              <div className="text-sm text-gray-500">
                No classes for this month
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                {classes.map((c) => {
                  return (
                    <div
                      key={c.classId}
                      className="border rounded p-3 shadow-sm bg-primaryColor text-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium">
                            {c.classType}
                          </div>
                          <div className="text-xs opacity-90">
                            {new Date(c.date).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          {c.zoomLink ? (
                            <a
                              href={c.zoomLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block px-3 py-1 rounded text-xs"
                              style={{
                                backgroundColor:
                                  InstitutionData?.PrimaryColor || "#2563eb",
                                color: "#fff",
                              }}>
                              Join
                            </a>
                          ) : (
                            <span className="text-xs opacity-85">No link</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-xs opacity-85">
                        Source: {c.raw?.source || "-"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* Footer: monetary breakdown placed at bottom of aside */}
          <div className="mt-4 pt-3 border-t">
            <div className="text-xs text-gray-500">Estimated</div>
            <div className="text-sm text-gray-600">
              {perClassMajor && perClassCurrencyState ? (
                (() => {
                  try {
                    const nf = new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: perClassCurrencyState || "INR",
                      maximumFractionDigits: 2,
                    });
                    return (
                      <div>
                        <span
                          style={{
                            color: InstitutionData?.PrimaryColor || "#2563eb",
                            fontWeight: 600,
                          }}>
                          {nf.format(perClassMajor)}
                        </span>
                        <span className="px-2">×</span>
                        <span style={{ color: "#000", fontWeight: 700 }}>
                          {totalClasses}
                        </span>
                        <span className="px-2">=</span>
                        <span style={{ color: "#000", fontWeight: 700 }}>
                          {monthlyTotalFormatted || "-"}
                        </span>
                      </div>
                    );
                  } catch (e) {
                    return (
                      <div>
                        {perClassCurrencyState} {perClassMajor} × {totalClasses}{" "}
                        = {monthlyTotalFormatted || "-"}
                      </div>
                    );
                  }
                })()
              ) : (
                <div
                  className="text-sm font-semibold"
                  style={{ color: InstitutionData?.PrimaryColor || "#2563eb" }}>
                  {monthlyTotalFormatted || "-"}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default InstructorCalendarPage;
