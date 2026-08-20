import { useEffect, useState } from "react";
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
import { IconUserPlus, IconX } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { userModal, useUserModal } from "./Usermodalstore";
import { useCreateUser, type SelectOption } from "../../../hooks/user/useCreateUser";
import { createUser, updateUser } from "../../../api/User/userApi";
import { getAllGenders } from "../../../api/User/userApi";
import { ModalFooter } from "../../../components/shared/ModalFooter";
import { showApiError } from "../../../utils/alert";

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

function dobStringToDate(dob?: string): Date | null {
  if (!dob) return null;
  const [y, m, d] = dob.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d); // local midnight, not UTC
}

function dateToDobString(date: Date | null): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text size="xs" fw={700} c="slate.6" tt="uppercase" style={{ letterSpacing: 0.6 }} mb="sm">
      {title}
    </Text>
  );
}

export function CreateUserModal() {
  const { opened, editId, initialData } = useUserModal();
  const queryClient = useQueryClient();
  const isEdit = !!editId;

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
      if (isEdit && editId) {
        await updateUser(editId, data);
      } else {
        await createUser(data);
      }
      queryClient.invalidateQueries({ queryKey: ["lmsUsers"] });
      userModal.close();
    },
  });

  const [languageOptions, setLanguageOptions] = useState<SelectOption[]>([]);
  const [roleOptions, setRoleOptions] = useState<SelectOption[]>([]);
  const [timezoneOptions, setTimezoneOptions] = useState<SelectOption[]>(() => filterTimezones(""));
  const [genderOptions, setGenderOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    if (!opened) {
      handleReset();
      return;
    }
    fetchLanguages("").then(setLanguageOptions);
    fetchRoles("").then(setRoleOptions);
    setTimezoneOptions(filterTimezones(""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  useEffect(() => {
    getAllGenders()
      .then(setGenderOptions)
      .catch((err) => showApiError(err));
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

  const handleClose = () => userModal.close();

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
              {isEdit ? "Edit User" : "Add User"}
            </Text>
          </Group>

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
      </Box>

      {/* ── Body ───────────────────────────────────────────── */}
      <Box px="xl" py="lg" style={{ maxHeight: "72vh", overflowY: "auto", background: "var(--mantine-color-slate-0)" }}>
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
              <Grid gutter="md">
                <Grid.Col span={colSpan}>
                  <TextInput
                    label="Email"
                    value={form.email}
                    onChange={(e) => handleFieldChange("email", e.currentTarget.value)}
                    error={errors.email}
                  />
                </Grid.Col>
                <Grid.Col span={colSpan}>
                  <TextInput
                    label="Username"
                    value={form.username}
                    onChange={(e) => handleFieldChange("username", e.currentTarget.value)}
                    error={errors.username}
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
                  />
                </Grid.Col>
                <Grid.Col span={colSpan}>
                  <TextInput
                    label="Middle Name"
                    placeholder="Middle name"
                    value={form.middleName}
                    onChange={(e) => handleFieldChange("middleName", e.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={colSpan}>
                  <TextInput
                    label="Last Name"
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={(e) => handleFieldChange("lastName", e.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={colSpan}>
                  <Select
                    label="Gender"
                    placeholder="Select gender"
                    data={genderOptions}
                    value={form.gender || null}
                    onChange={(v) => handleFieldChange("gender", v ?? "")}
                  />
                </Grid.Col>

                <Grid.Col span={colSpan}>
                  <DateInput
                    label="Date of Birth"
                    placeholder="DD-MMM-YYYY"
                    valueFormat="DD-MMM-YYYY"
                    value={dobStringToDate(form.dob)}
                    onChange={(date) => handleFieldChange("dob", dateToDobString(date))}
                    clearable
                    defaultLevel="decade"
                    maxDate={new Date()}
                  />
                </Grid.Col>
                <Grid.Col span={colSpan}>
                  <TextInput
                    label="Phone"
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={(e) => handleFieldChange("phone", e.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={colSpan}>
                  <TextInput
                    label="Mobile No"
                    placeholder="Mobile number"
                    value={form.mobile_no}
                    onChange={(e) => handleFieldChange("mobile_no", e.currentTarget.value)}
                  />
                </Grid.Col>
              </Grid>
            </Box>
          </Stack>
        </Paper>
      </Box>

      {/* ── Footer ─────────────────────────────────────────── */}
      <ModalFooter
        variant="theme"
        onClose={handleClose}
        submitLabel={isEdit ? "Update" : "Create"}
        submitLoading={isSubmitting}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
}