import React, { useEffect, useState } from "react";
import { Dialog, Flex, Text, TextArea, Select, Button, TextField } from "@radix-ui/themes";

const NOTICE_TYPES = [
    { value: "class", label: "New Class" },
    { value: "schedule", label: "Schedule Change" },
    { value: "canceled", label: "Cancelled" },
];

const toDatetimeLocalValue = (epochMs) => {
    if (!epochMs) return "";
    const d = new Date(epochMs);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromDatetimeLocalValue = (value) => {
    if (!value) return null;
    return new Date(value).getTime();
};

const emptyForm = { noticeType: "class", data: "", dateInput: "" };

const NoticeFormDialog = ({ open, onOpenChange, initialNotice, onSubmit, submitting }) => {
    const [form, setForm] = useState(emptyForm);
    const isEdit = Boolean(initialNotice);

    useEffect(() => {
        if (!open) return;
        setForm(
            initialNotice
                ? {
                    noticeType: initialNotice.noticeType,
                    data: initialNotice.data,
                    dateInput: toDatetimeLocalValue(initialNotice.date),
                }
                : emptyForm,
        );
    }, [open, initialNotice]);

    const handleSubmit = () => {
        if (!form.data.trim()) return;
        if (!isEdit && !form.dateInput) return; // date required on create

        if (isEdit) {
            // date is the DynamoDB key — cannot be changed via update
            onSubmit({
                date: initialNotice.date,
                noticeType: form.noticeType,
                data: form.data,
            });
        } else {
            onSubmit({
                date: fromDatetimeLocalValue(form.dateInput),
                noticeType: form.noticeType,
                data: form.data,
            });
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Content style={{ maxWidth: 420 }}>
                <Dialog.Title>{isEdit ? "Edit Notice" : "Add Notice"}</Dialog.Title>

                <Flex direction="column" gap="3" mt="3">
                    <Flex direction="column" gap="1">
                        <Text size="2" weight="medium">Type</Text>
                        <Select.Root
                            value={form.noticeType}
                            onValueChange={(v) => setForm((f) => ({ ...f, noticeType: v }))}>
                            <Select.Trigger />
                            <Select.Content>
                                {NOTICE_TYPES.map((t) => (
                                    <Select.Item key={t.value} value={t.value}>{t.label}</Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Root>
                    </Flex>

                    <Flex direction="column" gap="1">
                        <Text size="2" weight="medium">Notice text</Text>
                        <TextArea
                            placeholder="e.g. Sunday HIIT Yoga Flow begins"
                            value={form.data}
                            onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                            rows={3}
                        />
                    </Flex>

                    <Flex direction="column" gap="1">
                        <Text size="2" weight="medium">Date &amp; time</Text>
                        <TextField.Root
                            type="datetime-local"
                            value={form.dateInput}
                            disabled={isEdit}
                            onChange={(e) => setForm((f) => ({ ...f, dateInput: e.target.value }))}
                        />
                        {isEdit && (
                            <Text size="1" color="gray">
                                Date can't be changed on an existing notice — delete and re-add if it needs to move.
                            </Text>
                        )}
                    </Flex>
                </Flex>

                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button variant="soft" color="gray" disabled={submitting}>Cancel</Button>
                    </Dialog.Close>
                    <Button onClick={handleSubmit} disabled={submitting || !form.data.trim() || (!isEdit && !form.dateInput)}>
                        {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Notice"}
                    </Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default NoticeFormDialog;