import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  Card,
  Flex,
  Box,
  Text,
  Separator,
  ScrollArea,
  IconButton,
  AlertDialog,
  Dialog,
  Button,
} from "@radix-ui/themes";
import { Megaphone, Calendar, X, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Context from "../../../../../Context/Context";
import InstitutionContext from "../../../../../Context/InstitutionContext";
import NoticeFormDialog from "./NoticeFormDialog";

const BADGE_COLORS = {
  class: {
    bg: "#DCFCE7",
    color: "#166534",
    iconBg: "#DCFCE7",
    iconColor: "#166534",
  },
  schedule: {
    bg: "#FEF3C7",
    color: "#B45309",
    iconBg: "#FEF3C7",
    iconColor: "#B45309",
  },
  canceled: {
    bg: "#FEE2E2",
    color: "#B91C1C",
    iconBg: "#FEE2E2",
    iconColor: "#B91C1C",
  },
};

const BADGE_LABELS = {
  class: "NEW CLASS",
  schedule: "SCHEDULE",
  canceled: "CANCELLED",
};

const formatNoticeDate = (epochMs) => {
  if (!epochMs) return null;
  try {
    return new Date(epochMs).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
};

const normalizeNotice = (raw) => ({
  noticeId: raw.date, // epoch ms — the DynamoDB sort key, used for update/delete
  type: raw.noticeType,
  badge: BADGE_LABELS[raw.noticeType] || "NOTICE",
  title: raw.data,
  date: formatNoticeDate(raw.date),
});

const getCurrentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const NoticesList = ({ notices: noticesProp, userType }) => {
  const isAdmin = userType?.toLowerCase() === "admin";
  const {
    getClassNotices,
    createClassNotice,
    updateClassNotice,
    deleteClassNotice,
    userData,
  } = useContext(Context);

  const institutionCtx = useContext(InstitutionContext);
  const institutionData = institutionCtx?.institutionData;
  const institutionId = institutionData?.InstitutionId || userData?.institution;

  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const month = useMemo(() => {
    const y = currentMonthDate.getFullYear();
    const m = String(currentMonthDate.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, [currentMonthDate]);

  const [notices, setNotices] = useState(noticesProp || []);
  const [loading, setLoading] = useState(!noticesProp);
  const [error, setError] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [viewAllOpen, setViewAllOpen] = useState(false);

  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const loadNotices = useCallback(async () => {
    if (!institutionId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await getClassNotices(institutionId, month);
      const rawList = Array.isArray(response)
        ? response
        : response?.notices || response?.items || response?.data || [];
      setNotices(rawList.map(normalizeNotice));
    } catch (err) {
      console.error("Error loading class notices:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [institutionId, month, getClassNotices]);

  useEffect(() => {
    if (noticesProp) {
      setNotices(noticesProp);
      return;
    }
    loadNotices();
  }, [noticesProp, loadNotices]);

  // Compact card shows notices from the start of today onwards.
  // The "View all" modal below intentionally keeps using the full `notices`
  // list so past notices for the month remain visible there.
  const upcomingNotices = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayMs = startOfToday.getTime();

    const future = notices.filter((notice) => {
      const noticeEpoch = Number(notice.noticeId);
      return !notice.noticeId || isNaN(noticeEpoch) || noticeEpoch >= startOfTodayMs;
    });

    return future.length > 0 ? future : notices;
  }, [notices]);

  const getIcon = (type) =>
    type === "canceled" ? <X size={16} /> : <Calendar size={16} />;

  const openAddDialog = () => {
    setEditingNotice(null);
    setDialogOpen(true);
  };

  const openEditDialog = (notice) => {
    // pass through the raw fields the form needs (date/noticeType/data)
    setEditingNotice({
      date: notice.noticeId,
      noticeType: notice.type,
      data: notice.title,
    });
    setDialogOpen(true);
  };

  const handleFormSubmit = async (payload) => {
    if (!institutionId) return;
    try {
      setSubmitting(true);
      if (editingNotice) {
        await updateClassNotice(institutionId, payload); // { date, noticeType, data }
      } else {
        await createClassNotice(institutionId, payload); // { date, noticeType, data } — all required
      }
      setDialogOpen(false);
      await loadNotices();
    } catch (err) {
      console.error("Error saving notice:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!institutionId || !deleteTarget) return;
    try {
      setDeleting(true);
      await deleteClassNotice(institutionId, deleteTarget.noticeId);
      setDeleteTarget(null);
      await loadNotices();
    } catch (err) {
      console.error("Error deleting notice:", err);
    } finally {
      setDeleting(false);
    }
  };

  // Shared row renderer so the compact card list and the "view all" modal
  // never drift out of sync with each other.
  const renderNoticeRow = (notice, index, arr) => {
    const colors = BADGE_COLORS[notice.type] || BADGE_COLORS.schedule;

    return (
      <React.Fragment key={notice.noticeId || index}>
        <Flex gap="3" p="4" align="center">
          <Flex
            align="center"
            justify="center"
            style={{
              width: 40,
              height: 40,
              flex: "0 0 40px",
              borderRadius: "50%",
              background: colors.iconBg,
              color: colors.iconColor,
            }}>
            {getIcon(notice.type)}
          </Flex>

          <Box minWidth="0" style={{ flex: 1 }}>
            <Box
              display="inline-block"
              mb="1"
              px="2"
              py="1"
              style={{
                borderRadius: 20,
                background: colors.bg,
                color: colors.color,
                fontSize: 9,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: 0.3,
              }}>
              {notice.badge}
            </Box>
            <Text as="div" size="2" style={{ color: "var(--us-ink, #2D5A27)" }}>
              {notice.title}
            </Text>
            {notice.date && (
              <Text
                as="div"
                size="1"
                mt="1"
                style={{ color: "var(--us-muted, #66807D)" }}>
                {notice.date}
              </Text>
            )}
          </Box>

          {isAdmin && (
            <Flex gap="1" flexShrink="0">
              <IconButton
                size="1"
                variant="ghost"
                color="gray"
                onClick={() => openEditDialog(notice)}
                aria-label="Edit notice">
                <Pencil size={14} />
              </IconButton>
              <IconButton
                size="1"
                variant="ghost"
                color="red"
                onClick={() => setDeleteTarget(notice)}
                aria-label="Delete notice">
                <Trash2 size={14} />
              </IconButton>
            </Flex>
          )}
        </Flex>
        {index < arr.length - 1 && <Separator size="4" />}
      </React.Fragment>
    );
  };

  return (
    <Card
      size="2"
      style={{
        borderRadius: 15,
        padding: 0,
        height: "100%",
        overflow: "hidden",
        background: "#FFFFFF",
        border: "1px solid var(--us-border, #E3ECE9)",
        boxShadow: "0 4px 18px rgba(45, 90, 39, 0.08)",
      }}>
      <Flex direction="column" height="100%" style={{ minHeight: 0 }}>
        <Flex
          align="center"
          justify="between"
          p="4"
          pb="3"
          style={{ flexShrink: 0 }}>
          <Flex align="center" gap="2" minWidth="0">
            <Megaphone size={18} color="var(--us-primary, #2D5A27)" />
            <Text
              size="3"
              weight="bold"
              style={{ color: "var(--us-ink, #2D5A27)" }}>
              Upcoming Events &amp; Class Notices
            </Text>
          </Flex>
          <Flex align="center" gap="1.5">
            <Flex align="center" gap="0.5" className="bg-gray-50 px-1 py-0.5 rounded-lg border border-gray-100">
              <IconButton
                size="1"
                variant="ghost"
                color="gray"
                onClick={handlePrevMonth}
                aria-label="Previous month">
                <ChevronLeft size={13} />
              </IconButton>
              <Text
                size="1"
                weight="medium"
                style={{
                  color: "var(--us-muted, #66807D)",
                  minWidth: 54,
                  textAlign: "center",
                  fontSize: 11,
                }}>
                {currentMonthDate.toLocaleString("default", { month: "short", year: "2-digit" })}
              </Text>
              <IconButton
                size="1"
                variant="ghost"
                color="gray"
                onClick={handleNextMonth}
                aria-label="Next month">
                <ChevronRight size={13} />
              </IconButton>
            </Flex>
            {isAdmin && (
              <IconButton
                size="1"
                variant="soft"
                onClick={openAddDialog}
                aria-label="Add notice">
                <Plus size={16} />
              </IconButton>
            )}
          </Flex>
        </Flex>

        <Separator size="4" style={{ flexShrink: 0 }} />

        <ScrollArea style={{ flex: 1, minHeight: 0, maxHeight: 380 }}>
          {loading ? (
            <Flex align="center" justify="center" p="5">
              <Text size="2" color="gray">
                Loading notices...
              </Text>
            </Flex>
          ) : error ? (
            <Flex align="center" justify="center" p="5">
              <Text size="2" color="gray">
                Couldn't load notices.
              </Text>
            </Flex>
          ) : upcomingNotices.length === 0 ? (
            <Flex align="center" justify="center" p="5">
              <Text size="2" color="gray">
                No upcoming notices.
              </Text>
            </Flex>
          ) : (
            <Flex direction="column">
              {upcomingNotices.map((notice, index, arr) =>
                renderNoticeRow(notice, index, arr),
              )}
            </Flex>
          )}
        </ScrollArea>

        <Box style={{ flexShrink: 0 }}>
          <Separator size="4" />
          <Flex justify="center" p="3">
            <Text
              size="1"
              weight="bold"
              onClick={() => setViewAllOpen(true)}
              style={{
                color: "var(--us-primary, #2D5A27)",
                cursor: "pointer",
              }}>
              View all notices →
            </Text>
          </Flex>
        </Box>
      </Flex>

      <NoticeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialNotice={editingNotice}
        onSubmit={handleFormSubmit}
        submitting={submitting}
      />

      {/* View-all modal — intentionally uses the full `notices` list (not
          `upcomingNotices`) so past notices for the month are still visible
          here, while the compact card above only shows what's upcoming. */}
      <Dialog.Root open={viewAllOpen} onOpenChange={setViewAllOpen}>
        <Dialog.Content style={{ maxWidth: 560, padding: 0 }}>
          <Flex align="center" justify="between" p="4" pb="3">
            <Dialog.Title mb="0">All Notices</Dialog.Title>
            {isAdmin && (
              <IconButton
                size="1"
                variant="soft"
                onClick={() => {
                  setViewAllOpen(false);
                  openAddDialog();
                }}
                aria-label="Add notice">
                <Plus size={16} />
              </IconButton>
            )}
          </Flex>
          <Separator size="4" />
          <ScrollArea style={{ maxHeight: "60vh" }}>
            {notices.length === 0 ? (
              <Flex align="center" justify="center" p="5">
                <Text size="2" color="gray">
                  No notices this month.
                </Text>
              </Flex>
            ) : (
              <Flex direction="column">
                {notices.map((notice, index, arr) =>
                  renderNoticeRow(notice, index, arr),
                )}
              </Flex>
            )}
          </ScrollArea>
          <Flex justify="end" p="3">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Close
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      <AlertDialog.Root
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialog.Content style={{ maxWidth: 400 }}>
          <AlertDialog.Title>Delete Notice</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Delete "{deleteTarget?.title}"? This can't be undone.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" disabled={deleting}>
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                color="red"
                onClick={handleDeleteConfirm}
                disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Card>
  );
};

export default NoticesList;
