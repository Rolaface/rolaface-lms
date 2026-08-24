import { useEffect, useState } from "react";
import type { CreateUserFormData } from "../../../types/User/createUser";
import {
  Modal,
  TextInput,
  Select,
  MultiSelect,
  Group,
  Stack,
  Text,
  Grid,
  Box,
  ActionIcon,
  Paper,
  Divider,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import dayjs from "dayjs";
import { IconUserPlus, IconMinus, IconX } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateUser, type SelectOption } from "../../../hooks/user/useCreateUser";
import { createUser, updateUser, getAllGenders } from "../../../api/User/userApi";
import { ModalFooter } from "../../../components/shared/ModalFooter";
import { openCommonModal } from "../../../components/Modal/AlertModal";
import { parseFrappeError } from "../../../utils/parseFrappeError";

const TIMEZONES = [
  "Africa/Casablanca", "Europe/Rome", "Europe/Paris", "America/Aruba", "Asia/Baghdad",
  "Pacific/Wallis", "Europe/Athens", "Pacific/Apia", "Africa/Mbabane", "Asia/Ulaanbaatar",
  "Asia/Chongqing", "America/Kentucky/Louisville", "Indian/Christmas", "Europe/Jersey",
  "Africa/Luanda", "Africa/Kinshasa", "Europe/Volgograd", "America/Dominica",
  "Australia/Lord_Howe", "America/Nipigon", "Asia/Seoul", "Europe/Kaliningrad",
  "Indian/Cocos", "Australia/Perth", "Asia/Barnaul", "America/Fortaleza",
  "Pacific/Noumea", "HST", "Europe/Tallinn", "America/Danmarkshavn", "Europe/Malta",
  "America/Cambridge_Bay", "Asia/Gaza", "Europe/Istanbul", "America/Chicago",
  "Asia/Urumqi", "Europe/Busingen", "America/Swift_Current", "Africa/Dar_es_Salaam",
  "Africa/Sao_Tome", "Asia/Phnom_Penh", "Europe/Vatican", "Pacific/Easter", "Etc/GMT+5",
  "Africa/Brazzaville", "America/Guadeloupe", "Asia/Kuala_Lumpur",
  "America/Indiana/Marengo", "Etc/GMT+8", "America/Bogota", "Pacific/Gambier",
  "America/Rankin_Inlet", "America/St_Thomas", "Africa/Accra", "Pacific/Johnston",
  "Antarctica/Rothera", "America/Bahia_Banderas", "Africa/Bangui", "America/Guayaquil",
  "Asia/Kolkata", "America/Mexico_City", "America/Recife", "Atlantic/St_Helena",
  "America/Vancouver", "America/Virgin", "Australia/Lindeman", "America/Manaus",
  "America/Puerto_Rico", "Asia/Anadyr", "America/Port-au-Prince",
  "America/Argentina/Jujuy", "America/Ciudad_Juarez", "Indian/Mahe", "Pacific/Kosrae",
  "Asia/Tbilisi", "Asia/Magadan", "Asia/Atyrau", "UTC", "America/Glace_Bay",
  "Asia/Samarkand", "Europe/Monaco", "Africa/Bujumbura", "Asia/Jerusalem",
  "Pacific/Norfolk", "America/Regina", "Pacific/Saipan", "Asia/Dubai", "Africa/Abidjan",
  "America/North_Dakota/Center", "Europe/Vienna", "Africa/Niamey", "America/Caracas",
  "America/Juneau", "America/Detroit", "Europe/Mariehamn", "Etc/GMT+4",
  "America/Shiprock", "Africa/Banjul", "Pacific/Funafuti",
];

function filterTimezones(search: string): SelectOption[] {
  const q = search.trim().toLowerCase();
  const list = q ? TIMEZONES.filter((tz) => tz.toLowerCase().includes(q)) : TIMEZONES;
  return list.map((tz) => ({ value: tz, label: tz }));
}

const toDateValue = (dob: string | null | undefined): Date | null =>
  dob && dayjs(dob).isValid() ? dayjs(dob).toDate() : null;

const TODAY = new Date();

function SectionHeader({ title }: { title: string }) {
  return (
    <Text size="xs" fw={700} c="slate.6" tt="uppercase" style={{ letterSpacing: 0.6 }} mb="sm">
      {title}
    </Text>
  );
}

interface CreateUserModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  editId?: string | null;
  isView?: boolean;
  initialData?: CreateUserFormData | null;
}

export function CreateUserModal({ opened, onClose, onMinimize, editId, isView, initialData }: CreateUserModalProps) {
  const queryClient = useQueryClient();
  const isEdit = !!editId && !isView;

  const {
    form,
    errors,
    isSubmitting,
    fetchLanguages,
    fetchRoles,
    handleFieldChange,
    addRole,
    removeRole,
    handleSubmit,
    handleReset,
  } = useCreateUser({
    initialData,
    onSubmit: async (data) => {
      const res = isEdit && editId
        ? await updateUser(editId, data)
        : await createUser(data);

      queryClient.invalidateQueries({ queryKey: ["lmsUsers"] });
       onClose();

      
      openCommonModal({
        heading: "Success",
        body:
          res.message.data ||
          (isEdit ? "User updated successfully." : "User created successfully."),
        color: "success",
        buttons: [{ label: "OK" }],
      });
    },
  });

  const [languageOptions, setLanguageOptions] = useState<SelectOption[]>([]);
  const [roleOptions, setRoleOptions] = useState<SelectOption[]>([]);
  const [timezoneOptions, setTimezoneOptions] = useState<SelectOption[]>(() => filterTimezones(""));
  const [genderOptions, setGenderOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    if (!opened) return;
    fetchLanguages("").then(setLanguageOptions);
    fetchRoles("").then(setRoleOptions);
    setTimezoneOptions(filterTimezones(""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  useEffect(() => {
    getAllGenders()
      .then(setGenderOptions)
      .catch((error) => {
        openCommonModal({
          heading: "Error",
          body: parseFrappeError(error),
          color: "danger",
          buttons: [{ label: "OK" }],
        });
      });
  }, []);

  const handleRolesChange = (vals: string[]) => {
    const added = vals.filter((v) => !form.roleIds.includes(v));
    const removed = form.roleIds.filter((v) => !vals.includes(v));
    added.forEach((id) => {
      const label = roleOptions.find((r) => r.value === id)?.label ?? id;
      addRole(id, label);
    });
    removed.forEach((id) => removeRole(id));
  };

    const handleClose = () => {
    handleReset();
    onClose();
  };

  const colSpan = { base: 12, sm: 6, md: 3 };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      withCloseButton={false}
      size={900}
      radius="lg"
      padding={0}
      centered
      shadow="xl"
      styles={{
        content: {
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
        },
        body: {
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          flex: 1,
          overflow: 'hidden',
        },
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <Box
        px="xl"
        py="md"
        style={{
          background: "var(--mantine-color-brand-6)",
          borderBottom: "1px solid var(--mantine-color-brand-7)",
          borderTopLeftRadius: "var(--mantine-radius-lg)",
          borderTopRightRadius: "var(--mantine-radius-lg)",
        }}
      >
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Box
              style={{
                width: 34,
                height: 34,
                borderRadius: "var(--mantine-radius-md)",
                background: "var(--mantine-color-white)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "var(--mantine-shadow-sm)",
              }}
            >
              <IconUserPlus size={18} stroke={2} color="var(--mantine-color-brand-6)" />
            </Box>
            <Text fw={700} size="md" c="white">
              {isView ? "View User" : isEdit ? "Edit User" : "Add User"}
            </Text>
          </Group>

 <Group gap={4} wrap="nowrap">
            <ActionIcon
              variant="subtle"
              radius="md"
              onClick={onMinimize}
              style={{ color: "var(--mantine-color-white)" }}
              styles={{
                root: {
                  "&:hover": {
                    backgroundColor: "color-mix(in srgb, var(--mantine-color-white) 15%, transparent)",
                  },
                },
              }}
            >
              <IconMinus size={18} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              radius="md"
              onClick={handleClose}
              style={{ color: "var(--mantine-color-white)" }}
              styles={{
                root: {
                  "&:hover": {
                    backgroundColor: "color-mix(in srgb, var(--mantine-color-white) 15%, transparent)",
                  },
                },
              }}
            >
              <IconX size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </Box>

      {/* ── Body ───────────────────────────────────────────── */}
            <Box px="xl" py="lg" style={{ background: "var(--mantine-color-slate-0)" }}>
        <Paper
          radius="lg"
          p="lg"
          shadow="xs"
          style={{ background: "var(--mantine-color-white)", border: "1px solid var(--mantine-color-slate-2)" }}
        >
          <Stack gap="lg">
            {/* ── Account Information ─────────────────────────── */}
            <Box>
              <SectionHeader title="Account Information" />
              <Grid gap="md">
                <Grid.Col span={colSpan}>
                  <TextInput
                    label="Email"
                    value={form.email}
                    onChange={(e) => handleFieldChange("email", e.currentTarget.value)}
                    error={errors.email}
                    disabled={isView}
                  />
                </Grid.Col>
                <Grid.Col span={colSpan}>
                  <TextInput
                    label="Username"
                    value={form.username}
                    onChange={(e) => handleFieldChange("username", e.currentTarget.value)}
                    error={errors.username}
                    disabled={isView}
                  />
                </Grid.Col>
                <Grid.Col span={colSpan}>
                  <Select
                    label="Language"
                    data={languageOptions}
                    searchable
                    placeholder="Search language..."
                    value={form.language || null}
                    onChange={(v) => handleFieldChange("language", v ?? "")}
                    onSearchChange={(q) => fetchLanguages(q).then(setLanguageOptions)}
                    disabled={isView}
                  />
                </Grid.Col>
                <Grid.Col span={colSpan}>
                  <Select
                    label="Timezone"
                    data={timezoneOptions}
                    searchable
                    placeholder="Search timezone..."
                    value={form.timezone || null}
                    onChange={(v) => handleFieldChange("timezone", v ?? "")}
                    onSearchChange={(q) => setTimezoneOptions(filterTimezones(q))}
                    disabled={isView}
                  />
                </Grid.Col>
              </Grid>
            </Box>

            {/* ── Assign Roles ─────────────────────────────────── */}
            <Box>
              <SectionHeader title="Assign Roles" />
              <MultiSelect
                data={roleOptions}
                searchable
                placeholder="Selected roles..."
                value={form.roleIds}
                onSearchChange={(q) => fetchRoles(q).then(setRoleOptions)}
                onChange={handleRolesChange}
                disabled={isView}
              />
            </Box>

            <Divider />

            {/* ── Personal Information ────────────────────────── */}
            <Box>
              <SectionHeader title="Personal Information" />
              <Grid gutter="md">
                <Grid.Col span={colSpan}>
                  <TextInput
                    label="First Name"
                    placeholder="First name"
                    value={form.firstName}
                    onChange={(e) => handleFieldChange("firstName", e.currentTarget.value)}
                    error={errors.firstName}
                    disabled={isView}
                  />
                </Grid.Col>
                <Grid.Col span={colSpan}>
                  <TextInput
                    label="Middle Name"
                    placeholder="Middle name"
                    value={form.middleName}
                    onChange={(e) => handleFieldChange("middleName", e.currentTarget.value)}
                    disabled={isView}
                  />
                </Grid.Col>
                <Grid.Col span={colSpan}>
                  <TextInput
                    label="Last Name"
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={(e) => handleFieldChange("lastName", e.currentTarget.value)}
                    disabled={isView}
                  />
                </Grid.Col>
                <Grid.Col span={colSpan}>
                  <Select
                    label="Gender"
                    placeholder="Select gender"
                    data={genderOptions}
                    value={form.gender || null}
                    onChange={(v) => handleFieldChange("gender", v ?? "")}
                    disabled={isView}
                  />
                </Grid.Col>

                <Grid.Col span={colSpan}>
                  <DateInput
                    label="Date of Birth"
                    placeholder="DD-MMM-YYYY"
                    valueFormat="DD-MMM-YYYY"
                    value={toDateValue(form.dob)}
                    onChange={(d) => handleFieldChange("dob", d ? dayjs(d).format("YYYY-MM-DD") : "")}
                    maxDate={TODAY}
                    disabled={isView}
                  />
                </Grid.Col>
                <Grid.Col span={colSpan}>
                  <TextInput
                    label="Phone"
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={(e) => handleFieldChange("phone", e.currentTarget.value)}
                    disabled={isView}
                  />
                </Grid.Col>
                <Grid.Col span={colSpan}>
                  <TextInput
                    label="Mobile No"
                    placeholder="Mobile number"
                    value={form.mobile_no}
                    onChange={(e) => handleFieldChange("mobile_no", e.currentTarget.value)}
                    disabled={isView}
                  />
                </Grid.Col>
              </Grid>
            </Box>
          </Stack>
        </Paper>
      </Box>

      {/* ── Footer ─────────────────────────────────────────── */}
      {!isView && (
        <ModalFooter
          variant="theme"
          onClose={handleClose}
          submitLabel={isEdit ? "Update" : "Create"}
          submitLoading={isSubmitting}
          onSubmit={handleSubmit}
        />
      )}
      {isView && (
        <ModalFooter
          variant="theme"
          isViewMode
          onClose={handleClose}
          submitLabel=""
        />
      )}
    </Modal>
  );
}